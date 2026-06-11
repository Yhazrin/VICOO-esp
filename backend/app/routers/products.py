from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.config import settings
from app.database import get_db
from app.models.product import Product
from app.models.supply_chain import SupplyChainRecord
from app.models.order import OrderItem
from app.models.impact_fund import ImpactFundEntry
from app.models.circular_commerce import ProductReview, ClothingIntake
from app.models.design_draft import DesignDraft
from app.models.artwork import Artwork
from app.models.country import Country
from app.models.region import Region
from app.schemas import (
    ApiResponse,
    PaginatedResponse,
    ProductCreate,
    ProductOut,
    ProductUpdate,
    supply_chain_record_to_out,
)
from app.utils.content_locale import localize_artwork_dict, localize_supply_chain_row, normalize_locale
from app.deps import require_role, get_current_user
from app.data.default_regular_products import regular_catalog_mock_dicts, SKU_EXTRA_BY_PRODUCT_NAME
from app.data.product_i18n_seed import PRODUCT_I18N_BY_NAME_ZH
from app.data.impact_product_images import IMPACT_PRODUCT_IMAGE_BY_NAME as _IMPACT_IMG
from app.services.supply_chain.service import SupplyChainService

router = APIRouter(prefix="/products", tags=["Products"])

logger = logging.getLogger(__name__)

_mock_countries = [
    {"id": 1, "code": "CN", "name_zh": "中国", "name_en": "China"},
    {"id": 2, "code": "JP", "name_zh": "日本", "name_en": "Japan"},
    {"id": 3, "code": "GLOBAL", "name_zh": "全球", "name_en": "Global"},
]

_mock_regions = [
    {"id": 1, "country_id": 1, "name_zh": "新疆阿克苏", "name_en": "Aksu, Xinjiang", "region_type": "province"},
    {"id": 2, "country_id": 1, "name_zh": "山东", "name_en": "Shandong", "region_type": "province"},
    {"id": 3, "country_id": 2, "name_zh": "东京", "name_en": "Tokyo", "region_type": "prefecture"},
    {"id": 4, "country_id": 3, "name_zh": "巴西马托格罗索", "name_en": "Mato Grosso, Brazil", "region_type": "global_origin"},
    {"id": 5, "country_id": 3, "name_zh": "美国得州", "name_en": "Texas, USA", "region_type": "global_origin"},
    {"id": 6, "country_id": 3, "name_zh": "印度古吉拉特", "name_en": "Gujarat, India", "region_type": "global_origin"},
]


async def _resolve_origin_ids(
    db: AsyncSession,
    *,
    country_id: int | None,
    region_id: int | None,
) -> tuple[int | None, int | None]:
    if region_id is None:
        if country_id is None:
            return None, None
        c = await db.get(Country, country_id)
        if not c:
            raise HTTPException(status_code=400, detail="Invalid origin_country_id")
        return country_id, None

    region = await db.get(Region, region_id)
    if not region:
        raise HTTPException(status_code=400, detail="Invalid origin_region_id")

    resolved_country_id = country_id if country_id is not None else region.country_id
    if resolved_country_id != region.country_id:
        raise HTTPException(
            status_code=400,
            detail="origin_region_id does not belong to origin_country_id",
        )

    c = await db.get(Country, resolved_country_id)
    if not c:
        raise HTTPException(status_code=400, detail="Invalid origin_country_id")
    return resolved_country_id, region_id


def _apply_product_filters(
    stmt,
    category: str | None,
    status: str | None,
    is_impact_product: bool | None,
    campaign_id: int | None = None,
):
    """Apply common product filter conditions to a query statement."""
    if category:
        stmt = stmt.where(Product.category == category)
    if status:
        stmt = stmt.where(Product.status == status)
    if is_impact_product is not None:
        stmt = stmt.where(Product.is_impact_product == is_impact_product)
    if campaign_id is not None:
        stmt = stmt.where(Product.campaign_id == campaign_id)
    return stmt


def _localize_product_dict(d: dict, locale: str) -> dict:
    """When locale=en and *_en fields are non-empty, override the primary fields."""
    out = dict(d)
    loc = normalize_locale(locale)
    if loc == "en":
        if out.get("name_en"):
            out["name"] = out["name_en"]
        if out.get("description_en"):
            out["description"] = out["description_en"]
        if out.get("trace_story_title_en"):
            out["trace_story_title"] = out["trace_story_title_en"]
        if out.get("trace_story_content_en"):
            out["trace_story_content"] = out["trace_story_content_en"]
    return out


async def _artwork_image_fallback_map(db: AsyncSession, products: list[Product]) -> dict[int, str]:
    """When product.image_url is empty, use linked artwork image (batch lookup)."""
    need = {p.artwork_id for p in products if p.artwork_id and not (p.image_url and str(p.image_url).strip())}
    if not need:
        return {}
    r = await db.execute(select(Artwork.id, Artwork.image_url).where(Artwork.id.in_(need)))
    return {row[0]: row[1] for row in r.all() if row[1]}


async def _products_to_out_dicts(db: AsyncSession, products: list[Product], *, locale: str = "zh") -> list[dict]:
    fb = await _artwork_image_fallback_map(db, products)
    out: list[dict] = []
    for p in products:
        d = ProductOut.model_validate(p).model_dump()
        if not (d.get("image_url") or "").strip() and p.artwork_id:
            u = fb.get(p.artwork_id)
            if u:
                d["image_url"] = u
        extra = SKU_EXTRA_BY_PRODUCT_NAME.get((p.name or "").strip())
        if extra:
            if extra.get("sizes") is not None:
                d["sizes"] = extra["sizes"]
            if extra.get("colors") is not None:
                d["colors"] = extra["colors"]
        d = _localize_product_dict(d, locale)
        out.append(d)
    return out


_mock_products = [
    {"id": 1, "name": "彩虹鱼棉质 T 恤", "description": "采用有机棉面料，印有获奖作品《彩虹鱼》。每件 T 恤的收益 30% 用于乡村美育基金。", "price": "168.00", "currency": "CNY", "image_url": _IMPACT_IMG["彩虹鱼棉质 T 恤"], "category": "apparel", "stock": 200, "status": "active", "is_impact_product": True, "campaign_id": 1, "donation_percentage": "30.00", "artwork_id": 2, "origin_country_id": 1, "origin_region_id": 1, "trace_story_title": "从新疆棉田到东京衣橱", "trace_story_content": "这件 T 恤的棉纤维以中国新疆阿克苏为主源，辅以全球认证棉花配比。纺纱与织造在华东完成，最终以透明溯源方式进入日本东京联名渠道，讲述一条跨区域公益供应链。", "sizes": ["S", "M", "L", "XL"], "colors": [{"name": "White", "hex": "#F5F0E8"}, {"name": "Navy", "hex": "#1C2841"}, {"name": "Rust", "hex": "#8B3A2A"}], "created_at": "2025-04-01T10:00:00"},
    {"id": 2, "name": "星星之夜帆布托特包", "description": "GRS 认证再生棉帆布，印有获奖画作《星星之夜》。可溯源再生棉帆布，日常通勤与公益表达兼得。", "price": "89.00", "currency": "CNY", "image_url": _IMPACT_IMG["星星之夜帆布托特包"], "category": "accessories", "stock": 150, "status": "active", "is_impact_product": True, "campaign_id": 1, "donation_percentage": "25.00", "artwork_id": 4, "origin_country_id": 3, "origin_region_id": 4, "trace_story_title": "全球棉花的二次生命", "trace_story_content": "帆布包原料采用全球来源的可追溯棉花纤维与再生棉混纺，重点覆盖巴西马托格罗索与美国得州供应批次。通过再生工艺与短链物流，形成更低碳足迹的公益商品故事。", "created_at": "2025-04-05T10:00:00"},
    {"id": 3, "name": "春天的花园丝巾", "description": "100% 真丝面料，孩子们的画作化为丝巾图案，每一条都是独一无二的艺术品。", "price": "258.00", "currency": "CNY", "image_url": _IMPACT_IMG["春天的花园丝巾"], "category": "accessories", "stock": 80, "status": "active", "is_impact_product": True, "campaign_id": 1, "donation_percentage": "30.00", "artwork_id": 1, "created_at": "2025-04-10T10:00:00"},
    {"id": 4, "name": "妈妈的手棉麻衬衫", "description": "天然棉麻混纺面料，胸前手绘线稿刺绣风印花源自获奖画作《妈妈的手》。强调天然纤维原料可溯源。", "price": "198.00", "currency": "CNY", "image_url": _IMPACT_IMG["妈妈的手棉麻衬衫"], "category": "apparel", "stock": 160, "status": "active", "is_impact_product": True, "campaign_id": 2, "donation_percentage": "25.00", "artwork_id": 11, "created_at": "2025-04-15T10:00:00"},
    {"id": 5, "name": "太空旅行圆领卫衣", "description": "中厚卫衣面料，胸前满印儿童宇宙涂鸦《太空旅行》。送给每个仰望星空的梦想家。", "price": "228.00", "currency": "CNY", "image_url": _IMPACT_IMG["太空旅行圆领卫衣"], "category": "apparel", "stock": 120, "status": "active", "is_impact_product": True, "campaign_id": 3, "donation_percentage": "25.00", "artwork_id": 15, "created_at": "2025-04-20T10:00:00"},
    {"id": 6, "name": "我的家帆布鞋", "description": "有机棉帆布鞋面，可降解鞋底。鞋侧印有《我的家》画作。", "price": "198.00", "currency": "CNY", "image_url": _IMPACT_IMG["我的家帆布鞋"], "category": "footwear", "stock": 0, "status": "sold_out", "is_impact_product": True, "campaign_id": 2, "donation_percentage": "30.00", "artwork_id": 3, "sizes": ["36", "37", "38", "39", "40", "41", "42", "43"], "colors": [{"name": "White", "hex": "#F5F0E8"}, {"name": "Black", "hex": "#1A1A16"}], "created_at": "2025-04-25T10:00:00"},
    {"id": 7, "name": "未来城市连帽卫衣", "description": "加绒连帽卫衣，背后满印儿童手绘未来城市画作《未来城市》。适合秋冬联名穿搭。", "price": "268.00", "currency": "CNY", "image_url": _IMPACT_IMG["未来城市连帽卫衣"], "category": "apparel", "stock": 90, "status": "active", "is_impact_product": True, "campaign_id": 3, "donation_percentage": "25.00", "artwork_id": 19, "created_at": "2025-05-01T10:00:00"},
    {"id": 8, "name": "过年了针织开衫", "description": "可溯源羊毛与再生纤维混纺针织开衫，正面提花织入儿童节日画作《过年了》。温暖的公益穿搭。", "price": "328.00", "currency": "CNY", "image_url": _IMPACT_IMG["过年了针织开衫"], "category": "apparel", "stock": 60, "status": "active", "is_impact_product": True, "campaign_id": 1, "donation_percentage": "28.00", "artwork_id": 18, "sizes": ["S", "M", "L", "XL"], "created_at": "2025-05-05T10:00:00"},
    {"id": 13, "name": "海豚之歌再生纤维披肩", "description": "海洋主题儿童画作《海豚之歌》授权印花，再生聚酯与有机棉混纺，收益 28% 捐入「春天的色彩」美育项目。", "price": "198.00", "currency": "CNY", "image_url": _IMPACT_IMG["海豚之歌再生纤维披肩"], "category": "accessories", "stock": 110, "status": "active", "is_impact_product": True, "campaign_id": 1, "donation_percentage": "28.00", "artwork_id": 8, "created_at": "2025-05-08T10:00:00"},
    {"id": 14, "name": "牧羊曲手绘方巾", "description": "牧羊主题儿童画作《牧羊曲》转化为穿搭用方巾，可作头巾或颈巾。有机棉面料，甘肃定西工坊手工印制。", "price": "88.00", "currency": "CNY", "image_url": _IMPACT_IMG["牧羊曲手绘方巾"], "category": "accessories", "stock": 180, "status": "active", "is_impact_product": True, "campaign_id": 2, "donation_percentage": "22.00", "artwork_id": 20, "created_at": "2025-05-09T10:00:00"},
    # 常规店 SKU（id 从 20 起，避免与公益 mock id 13/14 区间重叠）
    *regular_catalog_mock_dicts(20),
]


def _merge_product_mock_i18n(rows: list[dict]) -> None:
    """Merge English translations into mock products.

    For products where REGULAR_CATALOG already provides name_en/description_en
    (from default_regular_products.py), keep those — don't overwrite with the
    PRODUCT_I18N_BY_NAME_ZH lookup (which only matches on Chinese names).

    For impact products with Chinese names, fill name_en/description_en from
    PRODUCT_I18N_BY_NAME_ZH so the locale-based switching works in DEMO_MODE.
    """
    for p in rows:
        # Skip if this product already has name_en from REGULAR_CATALOG
        if p.get("name_en"):
            continue
        m = PRODUCT_I18N_BY_NAME_ZH.get(str(p.get("name", "")).strip())
        if not m:
            continue
        if m.get("name_en"):
            p["name_en"] = m["name_en"]
        if m.get("description_en"):
            p["description_en"] = m["description_en"]
        if m.get("trace_story_title_en"):
            p["trace_story_title_en"] = m["trace_story_title_en"]
        if m.get("trace_story_content_en"):
            p["trace_story_content_en"] = m["trace_story_content_en"]


_merge_product_mock_i18n(_mock_products)

_mock_supply_chain = [
    {"id": 1, "product_id": 1, "stage": "material_sourcing", "description": "Organic cotton from Aksu, Xinjiang — GOTS certified", "location": "Aksu, Xinjiang", "latitude": 41.17, "longitude": 80.26, "certified": True, "cert_image_url": "/static/certs/gots_cert.jpg", "timestamp": "2025-02-01T08:00:00", "created_at": "2025-02-01T08:00:00"},
    {"id": 2, "product_id": 1, "stage": "processing", "description": "Yarn spinning and fabric dyeing using plant-based pigments, no harmful chemicals", "location": "Shaoxing, Zhejiang", "latitude": 30.0, "longitude": 120.58, "certified": True, "cert_image_url": "/static/certs/oeko_cert.jpg", "timestamp": "2025-02-15T08:00:00", "created_at": "2025-02-15T08:00:00"},
    {"id": 3, "product_id": 1, "stage": "manufacturing", "description": "Garment cutting and sewing in an ISO 9001 certified factory", "location": "Shenzhen, Guangdong", "latitude": 22.55, "longitude": 114.05, "certified": True, "cert_image_url": "/static/certs/iso9001.jpg", "timestamp": "2025-03-01T08:00:00", "created_at": "2025-03-01T08:00:00"},
    {"id": 4, "product_id": 1, "stage": "quality_check", "description": "Finished product quality inspection — 12 tests including formaldehyde content and color fastness", "location": "Shenzhen, Guangdong", "latitude": 22.55, "longitude": 114.08, "certified": True, "cert_image_url": None, "timestamp": "2025-03-10T08:00:00", "created_at": "2025-03-10T08:00:00"},
    {"id": 5, "product_id": 1, "stage": "shipping", "description": "Biodegradable packaging materials, carbon-neutral logistics", "location": "Nationwide delivery", "latitude": 35.86, "longitude": 104.2, "certified": False, "cert_image_url": None, "timestamp": "2025-03-15T08:00:00", "created_at": "2025-03-15T08:00:00"},
]


@router.get("", response_model=PaginatedResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    status: str | None = Query(None),
    is_impact_product: bool | None = Query(None),
    campaign_id: int | None = Query(None),
    locale: str = Query("zh", pattern="^(zh|en)$"),
    db: AsyncSession = Depends(get_db),
):
    """List products with optional filtering."""
    try:
        stmt = _apply_product_filters(
            select(Product), category, status, is_impact_product, campaign_id
        ).order_by(Product.id.desc())
        count_stmt = _apply_product_filters(
            select(func.count(Product.id)), category, status, is_impact_product, campaign_id
        )
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        products = result.scalars().all()
        return PaginatedResponse(
            data=await _products_to_out_dicts(db, list(products), locale=locale),
            total=total,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("list_products: database query failed")
        if settings.APP_ENV != "demo":
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        filtered = _mock_products
        if category:
            filtered = [p for p in filtered if p["category"] == category]
        if status:
            filtered = [p for p in filtered if p["status"] == status]
        if is_impact_product is not None:
            filtered = [p for p in filtered if p.get("is_impact_product", False) == is_impact_product]
        if campaign_id is not None:
            filtered = [p for p in filtered if p.get("campaign_id") == campaign_id]
        for p in filtered:
            _localize_product_dict(p, locale)
        start = (page - 1) * page_size
        return PaginatedResponse(
            data=filtered[start : start + page_size],
            total=len(filtered),
            page=page,
            page_size=page_size,
        )


@router.get("/categories", response_model=ApiResponse)
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List all product categories."""
    try:
        stmt = select(Product.category, func.count(Product.id)).group_by(Product.category)
        result = await db.execute(stmt)
        categories = [
            {"name": row[0], "count": row[1]}
            for row in result.all()
            if row[0]
        ]
        return ApiResponse(data=categories)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Product query failed: %s", e)
        if settings.APP_ENV != "demo":
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        cat_counts: dict[str, int] = {}
        for p in _mock_products:
            cat = p.get("category", "Uncategorized")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
        categories = [{"name": k, "count": v} for k, v in cat_counts.items()]
        return ApiResponse(data=categories)


@router.get("/origins/countries", response_model=ApiResponse)
async def list_origin_countries(db: AsyncSession = Depends(get_db)):
    """List origin country dictionary rows."""
    try:
        stmt = select(Country).order_by(Country.id.asc())
        result = await db.execute(stmt)
        countries = result.scalars().all()
        return ApiResponse(
            data=[
                {
                    "id": c.id,
                    "code": c.code,
                    "name_zh": c.name_zh,
                    "name_en": c.name_en,
                }
                for c in countries
            ]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Product query failed: %s", e)
        if settings.APP_ENV != "demo":
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        return ApiResponse(data=_mock_countries)


@router.get("/origins/regions", response_model=ApiResponse)
async def list_origin_regions(
    country_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List origin region dictionary rows, optionally filtered by country."""
    try:
        stmt = select(Region).order_by(Region.id.asc())
        if country_id is not None:
            stmt = stmt.where(Region.country_id == country_id)
        result = await db.execute(stmt)
        regions = result.scalars().all()
        return ApiResponse(
            data=[
                {
                    "id": r.id,
                    "country_id": r.country_id,
                    "name_zh": r.name_zh,
                    "name_en": r.name_en,
                    "region_type": r.region_type,
                }
                for r in regions
            ]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Product query failed: %s", e)
        if settings.APP_ENV != "demo":
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        data = _mock_regions
        if country_id is not None:
            data = [r for r in data if r["country_id"] == country_id]
        return ApiResponse(data=data)


@router.get("/featured", response_model=ApiResponse)
async def list_featured_products(locale: str = Query("zh", pattern="^(zh|en)$"), db: AsyncSession = Depends(get_db)):
    """List featured products (active with stock, limit 8)."""
    try:
        stmt = select(Product).where(Product.status == "active", Product.stock > 0).limit(8)
        result = await db.execute(stmt)
        products = result.scalars().all()
        return ApiResponse(data=await _products_to_out_dicts(db, list(products), locale=locale))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Product query failed: %s", e)
        if settings.APP_ENV != "demo":
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        featured = [p for p in _mock_products if p["status"] == "active" and p["stock"] > 0][:8]
        for p in featured:
            _localize_product_dict(p, locale)
        return ApiResponse(data=featured)


@router.get("/{product_id}/supply-chain", response_model=ApiResponse)
async def get_product_supply_chain(
    product_id: int,
    locale: str = Query("zh", pattern="^(zh|en)$"),
    db: AsyncSession = Depends(get_db),
):
    """Get supply chain records for a product."""
    try:
        product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product_name = product.name or ""
        sc_service = SupplyChainService(db)
        await sc_service.ensure_supply_chain_records(product_id)
        stmt = select(SupplyChainRecord).where(SupplyChainRecord.product_id == product_id)
        result = await db.execute(stmt)
        records = result.scalars().all()
        rows = [
            localize_supply_chain_row(supply_chain_record_to_out(r).model_dump(), product_name, locale)
            for r in records
        ]
        return ApiResponse(data=rows)
    except HTTPException:
        raise
    except Exception:
        if not settings.DEMO_MODE:
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        product_name = ""
        for p in _mock_products:
            if p["id"] == product_id:
                product_name = str(p.get("name") or "")
                break
        records = [
            localize_supply_chain_row(dict(r), product_name, locale)
            for r in _mock_supply_chain
            if r["product_id"] == product_id
        ]
        return ApiResponse(data=records)


@router.get("/{product_id}/artwork", response_model=ApiResponse)
async def get_product_artwork(
    product_id: int,
    locale: str = Query("zh", pattern="^(zh|en)$"),
    db: AsyncSession = Depends(get_db),
):
    """Get the artwork linked to a product."""
    try:
        stmt = select(Product).where(Product.id == product_id)
        result = await db.execute(stmt)
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        if not product.artwork_id:
            raise HTTPException(status_code=404, detail="No artwork linked to this product")
        artwork_stmt = select(Artwork).where(Artwork.id == product.artwork_id)
        artwork_result = await db.execute(artwork_stmt)
        artwork = artwork_result.scalar_one_or_none()
        if not artwork:
            raise HTTPException(status_code=404, detail="Linked artwork not found")
        from app.schemas.artwork import ArtworkOut
        data = localize_artwork_dict(ArtworkOut.model_validate(artwork).model_dump(), locale)
        return ApiResponse(data=data)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Product artwork query failed: %s", e)
        # DEMO_MODE fallback
        _aw = "https://images.unsplash.com"
        mock_artworks = {
            1: {"id": 1, "title": "Spring Garden", "artist_name": "Xiao Ming", "image_url": f"{_aw}/photo-1549887557-07aa9327f35d?auto=format&fit=crop&w=800&q=80", "status": "approved"},
            2: {"id": 2, "title": "Rainbow Fish", "artist_name": "Xiao Hong", "image_url": f"{_aw}/photo-1502082554558-074e87f815bc?auto=format&fit=crop&w=800&q=80", "status": "approved"},
            3: {"id": 3, "title": "My Home", "artist_name": "Xiao Li", "image_url": f"{_aw}/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80", "status": "approved"},
            4: {"id": 4, "title": "Starry Night", "artist_name": "Xiao Gang", "image_url": f"{_aw}/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80", "status": "featured"},
            8: {"id": 8, "title": "Dolphin Song", "artist_name": "Xiao Hai", "image_url": f"{_aw}/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80", "status": "approved"},
            11: {"id": 11, "title": "Mother's Hands", "artist_name": "Xiao Hua", "image_url": f"{_aw}/photo-1513542789411-b6b5fbdb320b?auto=format&fit=crop&w=800&q=80", "status": "featured"},
            15: {"id": 15, "title": "Space Journey", "artist_name": "Xiao Gang", "image_url": f"{_aw}/photo-1457364887197-9150188c107b?auto=format&fit=crop&w=800&q=80", "status": "approved"},
            18: {"id": 18, "title": "Chinese New Year", "artist_name": "Xiao Xue", "image_url": f"{_aw}/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=800&q=80", "status": "approved"},
            19: {"id": 19, "title": "Future City", "artist_name": "Xiao Hai", "image_url": f"{_aw}/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80", "status": "approved"},
            20: {"id": 20, "title": "Shepherd's Song", "artist_name": "Xiao Fang", "image_url": f"{_aw}/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80", "status": "approved"},
        }
        for p in _mock_products:
            if p["id"] == product_id and p.get("artwork_id"):
                aw = mock_artworks.get(p["artwork_id"])
                if aw:
                    return ApiResponse(data=localize_artwork_dict(aw, locale))
        raise HTTPException(status_code=404, detail="No artwork linked to this product")


@router.get("/{product_id}", response_model=ApiResponse)
async def get_product(product_id: int, locale: str = Query("zh", pattern="^(zh|en)$"), db: AsyncSession = Depends(get_db)):
    """Get a single product by ID."""
    try:
        stmt = select(Product).where(Product.id == product_id)
        result = await db.execute(stmt)
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        data = (await _products_to_out_dicts(db, [product], locale=locale))[0]
        return ApiResponse(data=data)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Product query failed: %s", e)
        if settings.APP_ENV != "demo":
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        for p in _mock_products:
            if p["id"] == product_id:
                return ApiResponse(data=_localize_product_dict(dict(p), locale))
        raise HTTPException(status_code=404, detail="Product not found")


@router.post("", response_model=ApiResponse, status_code=201)
async def create_product(body: ProductCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    """Create a new product."""
    try:
        payload = body.model_dump()
        origin_country_id, origin_region_id = await _resolve_origin_ids(
            db,
            country_id=payload.get("origin_country_id"),
            region_id=payload.get("origin_region_id"),
        )
        payload["origin_country_id"] = origin_country_id
        payload["origin_region_id"] = origin_region_id
        product = Product(**payload)
        db.add(product)
        await db.flush()
        await db.refresh(product, ["created_at"])
        return ApiResponse(data=ProductOut.model_validate(product).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error("DB write failed during create_product: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.put("/{product_id}", response_model=ApiResponse)
async def update_product(product_id: int, body: ProductUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    """Update a product."""
    try:
        stmt = select(Product).where(Product.id == product_id)
        result = await db.execute(stmt)
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        payload = body.model_dump(exclude_unset=True)
        if "origin_country_id" in payload or "origin_region_id" in payload:
            origin_country_id, origin_region_id = await _resolve_origin_ids(
                db,
                country_id=payload.get("origin_country_id", product.origin_country_id),
                region_id=payload.get("origin_region_id", product.origin_region_id),
            )
            payload["origin_country_id"] = origin_country_id
            payload["origin_region_id"] = origin_region_id

        _PRODUCT_UPDATABLE = {
            "name", "name_en", "description", "description_en", "price", "image_url",
            "category", "stock", "status", "is_impact_product", "campaign_id",
            "donation_percentage", "artwork_id", "origin_country_id", "origin_region_id",
            "trace_story_title", "trace_story_content", "trace_story_title_en", "trace_story_content_en",
        }
        for k, v in payload.items():
            if k in _PRODUCT_UPDATABLE:
                setattr(product, k, v)
        await db.flush()
        await db.refresh(product, ["created_at"])
        return ApiResponse(data=ProductOut.model_validate(product).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error("DB write failed during update_product: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.delete("/{product_id}", response_model=ApiResponse)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Delete a product when it has no order or impact-fund linkage."""
    try:
        stmt = select(Product).where(Product.id == product_id)
        result = await db.execute(stmt)
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        n_items = (
            await db.execute(select(func.count()).select_from(OrderItem).where(OrderItem.product_id == product_id))
        ).scalar() or 0
        n_fund = (
            await db.execute(
                select(func.count()).select_from(ImpactFundEntry).where(ImpactFundEntry.product_id == product_id)
            )
        ).scalar() or 0
        if n_items or n_fund:
            raise HTTPException(
                status_code=409,
                detail="Product has orders or fund entries; set status to inactive instead of deleting.",
            )

        await db.execute(delete(SupplyChainRecord).where(SupplyChainRecord.product_id == product_id))
        await db.execute(delete(ProductReview).where(ProductReview.product_id == product_id))
        await db.execute(
            update(ClothingIntake).where(ClothingIntake.product_id == product_id).values(product_id=None)
        )
        await db.execute(
            update(DesignDraft).where(DesignDraft.product_id == product_id).values(product_id=None)
        )
        await db.delete(product)
        return ApiResponse(data={"id": product_id, "deleted": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.error("DB write failed during delete_product: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
