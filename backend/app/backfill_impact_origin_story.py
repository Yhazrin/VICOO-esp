"""
Backfill trace stories and origin country/region foreign keys for existing impact products.

Usage:
  cd backend && python -m app.backfill_impact_origin_story
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal, engine
from app.data.impact_origin_story_seed import (
    DEFAULT_IMPACT_TRACE_STORY,
    IMPACT_TRACE_STORY_BY_NAME,
    ORIGIN_COUNTRIES,
    ORIGIN_REGIONS,
)
from app.models.country import Country
from app.models.product import Product
from app.models.region import Region


async def main() -> None:
    async with AsyncSessionLocal() as session:
        country_id_by_code: dict[str, int] = {}
        for row in ORIGIN_COUNTRIES:
            obj = (
                await session.execute(select(Country).where(Country.code == row["code"]))
            ).scalar_one_or_none()
            if obj is None:
                obj = Country(**row)
                session.add(obj)
                await session.flush()
            country_id_by_code[row["code"]] = obj.id

        region_id_by_name_zh: dict[str, int] = {}
        for row in ORIGIN_REGIONS:
            obj = (
                await session.execute(select(Region).where(Region.name_zh == row["name_zh"]))
            ).scalar_one_or_none()
            if obj is None:
                obj = Region(
                    country_id=country_id_by_code[row["country_code"]],
                    name_zh=row["name_zh"],
                    name_en=row["name_en"],
                    region_type=row.get("region_type"),
                )
                session.add(obj)
                await session.flush()
            region_id_by_name_zh[row["name_zh"]] = obj.id

        res = await session.execute(
            select(Product).where(Product.is_impact_product.is_(True)).order_by(Product.id.asc())
        )
        products = list(res.scalars().all())
        changed = 0
        for p in products:
            story = IMPACT_TRACE_STORY_BY_NAME.get(p.name, DEFAULT_IMPACT_TRACE_STORY)
            p.origin_country_id = country_id_by_code.get(story["country_code"])
            p.origin_region_id = region_id_by_name_zh.get(story["region_name_zh"])
            p.trace_story_title = story["title"]
            p.trace_story_content = story["content"]
            changed += 1

        await session.commit()
        print(f"backfill_impact_origin_story: updated {changed} impact products.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
