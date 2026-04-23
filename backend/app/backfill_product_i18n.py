"""
Fill products.name_en / description_en / trace_story_*_en from product_i18n_seed.

Usage (from repo root, with DATABASE_URL set or .env):
  cd backend && python -m app.backfill_product_i18n
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.data.product_i18n_seed import PRODUCT_I18N_BY_NAME_ZH
from app.database import AsyncSessionLocal
from app.models.product import Product


async def run() -> int:
    updated = 0
    async with AsyncSessionLocal() as session:
        r = await session.execute(select(Product))
        products = r.scalars().all()
        for p in products:
            m = PRODUCT_I18N_BY_NAME_ZH.get((p.name or "").strip())
            if not m:
                continue
            if m.get("name_en"):
                p.name_en = m["name_en"]
            if m.get("description_en"):
                p.description_en = m["description_en"]
            if m.get("trace_story_title_en"):
                p.trace_story_title_en = m["trace_story_title_en"]
            if m.get("trace_story_content_en"):
                p.trace_story_content_en = m["trace_story_content_en"]
            updated += 1
        await session.commit()
    print(f"backfill_product_i18n: updated {updated} products.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
