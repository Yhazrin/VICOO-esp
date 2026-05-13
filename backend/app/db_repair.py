"""
Idempotent catalog repair: 中文类目 → 英文枚举、公益 / 优衣库常规 SKU 分流。

开发环境在 lifespan 中自动执行；生产可运行:
  cd backend && python -m app.db_repair
"""

from __future__ import annotations

import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.product import Product
from app.data.default_regular_products import REGULAR_CATALOG, regular_catalog_for_orm
from app.data.impact_product_images import IMPACT_PRODUCT_IMAGE_BY_NAME

REGULAR_IMAGE_BY_NAME = {r["name"]: r["image_url"] for r in REGULAR_CATALOG}

logger = logging.getLogger("tonghua")

REGULAR_PRODUCT_NAMES = {r["name"] for r in REGULAR_CATALOG}

ZH_CATEGORY_TO_EN: dict[str, str] = {
    "服装": "apparel",
    "配饰": "accessories",
    "文具": "stationery",
    "印刷": "prints",
    "生活": "lifestyle",
    "鞋履": "footwear",
    "家居": "home",
    "礼盒": "gift_box",
}

_IMPACT_TITLE_MARKERS = (
    "彩虹鱼",
    "星星之夜",
    "春天的花园",
    "妈妈的手",
    "太空旅行",
    "我的家帆布鞋",
    "画出未来",
    "过年了",
    "海豚之歌",
    "牧羊曲",
    "再生纤维披肩",
    "手工拼布壁挂",
)

_COMPANY_TITLE_MARKERS = (
    "Organic Linen",
    "Recycled Cashmere",
    "Hemp Canvas",
    "Merino Wool",
)


def _impact_from_copy(name: str, description: str | None) -> bool:
    n = name or ""
    blob = f"{n} {description or ''}"
    if any(m in n for m in _IMPACT_TITLE_MARKERS):
        return True
    if any(k in blob for k in ("收益", "捐赠", "美育", "获奖作品", "义卖", "印有《", "乡村美育")):
        return True
    return False


def _company_from_title(name: str) -> bool:
    n = name or ""
    return any(m in n for m in _COMPANY_TITLE_MARKERS)


def _needs_impact_image_refresh(url: str | None) -> bool:
    """空链接、Unsplash、或已废弃的 /static/products/*.jpg 占位，需写回 Picsum。"""
    u = (url or "").strip()
    if not u:
        return True
    if "picsum.photos" in u:
        return False
    if "/static/products/" in u:
        return True
    if "unsplash.com" in u:
        return True
    return False


async def repair_impact_product_images(session: AsyncSession) -> int:
    """幂等：按商品名写回公益店主图 URL（修复已有库里的 Unsplash 无法加载问题）。"""
    result = await session.execute(select(Product).where(Product.is_impact_product.is_(True)))
    updated = 0
    for p in result.scalars().all():
        key = (p.name or "").strip()
        fixed = IMPACT_PRODUCT_IMAGE_BY_NAME.get(key)
        if not fixed:
            continue
        if not _needs_impact_image_refresh(p.image_url):
            continue
        p.image_url = fixed
        updated += 1
    if updated:
        logger.info("db_repair: refreshed impact product image_url rows: %s", updated)
    return updated


async def repair_legacy_static_product_image_urls(session: AsyncSession) -> int:
    """
    旧种子 / 演示里使用了不存在的 /static/products/*.jpg。按商品名对齐公益主图或常规店目录，否则 Picsum。
    幂等；需在 repair_impact_product_images 之后执行，以便仅处理 is_impact=False 的占位行。
    """
    result = await session.execute(select(Product))
    updated = 0
    for p in result.scalars().all():
        u = (p.image_url or "").strip()
        if "/static/products/" not in u:
            continue
        name = (p.name or "").strip()
        fixed = (
            IMPACT_PRODUCT_IMAGE_BY_NAME.get(name)
            or REGULAR_IMAGE_BY_NAME.get(name)
            or f"https://picsum.photos/seed/vicoo-prod-{p.id}/900/1200"
        )
        if fixed != p.image_url:
            p.image_url = fixed
            updated += 1
    if updated:
        logger.info("db_repair: fixed legacy /static/products/ image_url rows: %s", updated)
    return updated


async def repair_product_catalog(session: AsyncSession) -> int:
    """
    Returns number of product rows created (baseline company SKUs), not updates.
    """
    result = await session.execute(select(Product))
    rows: list[Product] = list(result.scalars().all())

    for p in rows:
        if p.category and p.category in ZH_CATEGORY_TO_EN:
            p.category = ZH_CATEGORY_TO_EN[p.category]

        if p.name in REGULAR_PRODUCT_NAMES:
            p.is_impact_product = False
            continue

        if _company_from_title(p.name or ""):
            p.is_impact_product = False
            continue

        if _impact_from_copy(p.name or "", p.description):
            p.is_impact_product = True

    existing_names = {p.name for p in rows}
    created = 0
    company_count = sum(1 for p in rows if not p.is_impact_product)
    if company_count < 1:
        for spec in regular_catalog_for_orm():
            if spec["name"] in existing_names:
                continue
            session.add(Product(**spec))
            created += 1
            existing_names.add(spec["name"])

    if created:
        logger.info("db_repair: created baseline company SKUs: %s", created)

    await repair_impact_product_images(session)
    await repair_legacy_static_product_image_urls(session)
    return created


async def _cli() -> None:
    async with AsyncSessionLocal() as session:
        n = await repair_product_catalog(session)
        await session.commit()
        print(f"Catalog repair done. New baseline SKUs: {n}")


if __name__ == "__main__":
    asyncio.run(_cli())
