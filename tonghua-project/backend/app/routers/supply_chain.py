from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.models.supply_chain import SupplyChainRecord
from app.models.product import Product
from app.schemas import ApiResponse, SupplyChainRecordCreate, SupplyChainRecordOut, SupplyChainTrace, PaginatedResponse
from app.deps import get_current_user, require_role

router = APIRouter(prefix="/supply-chain", tags=["Supply Chain"])

STAGES_ORDER = ["material_sourcing", "processing", "manufacturing", "quality_check", "shipping"]

# ── MOCK DATA (served when database is unavailable) ──────────────
# These records are illustrative examples for development/demo purposes.
# Real supply chain data is loaded from the database when available.
# Certification references and partner names below are fictional.
# ────────────────────────────────────────────────────────────────
_mock_records = [
    {
        "id": 1,
        "product_id": 4,
        "stage": "material_sourcing",
        "description": "[MOCK] 有机棉花采自新疆阿克苏地区合作农场，获得GOTS全球有机纺织品标准认证。",
        "location": "新疆维吾尔自治区阿克苏市",
        "certified": True,
        "cert_image_url": "/static/certs/gots_cert_001.jpg",
        "timestamp": "2025-01-15T08:00:00",
        "created_at": "2025-01-16T10:00:00",
    },
    {
        "id": 2,
        "product_id": 4,
        "stage": "processing",
        "description": "[MOCK] 棉花在经认证的纺纱厂进行清理、梳理和纺纱。工厂采用太阳能供电。",
        "location": "山东省济南市",
        "certified": True,
        "cert_image_url": "/static/certs/processing_cert_001.jpg",
        "timestamp": "2025-01-28T09:00:00",
        "created_at": "2025-01-29T10:00:00",
    },
    {
        "id": 3,
        "product_id": 4,
        "stage": "manufacturing",
        "description": "[MOCK] 成衣在公平贸易认证工厂制作，工人享受合理薪资和安全的工作环境。",
        "location": "广东省广州市",
        "certified": True,
        "cert_image_url": "/static/certs/fair_trade_cert_001.jpg",
        "timestamp": "2025-02-10T08:00:00",
        "created_at": "2025-02-11T10:00:00",
    },
    {
        "id": 4,
        "product_id": 4,
        "stage": "quality_check",
        "description": "[MOCK] 通过第三方质检机构SGS检测，符合GB/T 18401-2010国家标准。",
        "location": "广东省广州市",
        "certified": True,
        "cert_image_url": "/static/certs/sgs_cert_001.jpg",
        "timestamp": "2025-02-20T14:00:00",
        "created_at": "2025-02-21T10:00:00",
    },
    {
        "id": 5,
        "product_id": 4,
        "stage": "shipping",
        "description": "[MOCK] 使用可降解包装材料，通过碳中和物流合作伙伴配送。",
        "location": "全国配送",
        "certified": True,
        "cert_image_url": "/static/certs/carbon_neutral_cert_001.jpg",
        "timestamp": "2025-03-01T08:00:00",
        "created_at": "2025-03-02T10:00:00",
    },
]


@router.get("/records", response_model=PaginatedResponse)
async def list_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: int | None = Query(None),
    stage: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List supply chain records with optional filters."""
    try:
        stmt = select(SupplyChainRecord)
        if product_id is not None:
            stmt = stmt.where(SupplyChainRecord.product_id == product_id)
        if stage:
            stmt = stmt.where(SupplyChainRecord.stage == stage)
        count_stmt = select(func.count(SupplyChainRecord.id))
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(SupplyChainRecord.timestamp).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        records = result.scalars().all()
        return PaginatedResponse(
            data=[SupplyChainRecordOut.model_validate(r).model_dump() for r in records],
            total=total,
            page=page,
            page_size=page_size,
        )
    except Exception:
        filtered = _mock_records
        if product_id is not None:
            filtered = [r for r in filtered if r["product_id"] == product_id]
        if stage:
            filtered = [r for r in filtered if r["stage"] == stage]
        start = (page - 1) * page_size
        return PaginatedResponse(
            data=filtered[start: start + page_size],
            total=len(filtered),
            page=page,
            page_size=page_size,
        )


@router.get("/trace/{product_id}", response_model=ApiResponse)
async def trace_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Get full supply chain trace for a product, ordered by stage."""
    try:
        product_stmt = select(Product).where(Product.id == product_id)
        product_result = await db.execute(product_stmt)
        product = product_result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        stmt = select(SupplyChainRecord).where(
            SupplyChainRecord.product_id == product_id
        ).order_by(SupplyChainRecord.timestamp)
        result = await db.execute(stmt)
        records = result.scalars().all()
        return ApiResponse(data={
            "product_id": product_id,
            "product_name": product.name,
            "records": [SupplyChainRecordOut.model_validate(r).model_dump() for r in records],
        })
    except HTTPException:
        raise
    except Exception:
        records = [r for r in _mock_records if r["product_id"] == product_id]
        return ApiResponse(data={
            "product_id": product_id,
            "product_name": "[MOCK] 童画公益 × 可持续时尚 T恤",
            "records": records,
        })


@router.get("/stages", response_model=ApiResponse)
async def list_stages():
    """List all supply chain stages in order."""
    return ApiResponse(data=[
        {"key": "material_sourcing", "label": "原料采购", "order": 1},
        {"key": "processing", "label": "加工处理", "order": 2},
        {"key": "manufacturing", "label": "生产制造", "order": 3},
        {"key": "quality_check", "label": "质量检测", "order": 4},
        {"key": "shipping", "label": "物流配送", "order": 5},
    ])


@router.post("/records", response_model=ApiResponse, status_code=201)
async def create_record(
    body: SupplyChainRecordCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin", "editor")),
):
    """Create a new supply chain record (admin/editor only)."""
    try:
        record = SupplyChainRecord(**body.model_dump())
        db.add(record)
        await db.flush()
        return ApiResponse(data=SupplyChainRecordOut.model_validate(record).model_dump())
    except Exception:
        new_id = max(r["id"] for r in _mock_records) + 1 if _mock_records else 1
        new_record = {
            "id": new_id,
            **body.model_dump(mode="json"),
            "created_at": datetime.now().isoformat(),
        }
        _mock_records.append(new_record)
        return ApiResponse(data=new_record, message="Record created (mock)")
