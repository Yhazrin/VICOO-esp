"""
Fix supply chain coordinates for the four impact demo products to match add_impact_products_demo.
Updates existing records by matching product.name + stage + location.

Run: cd /app/backend && python -m app.fix_impact_supply_chain_coordinates
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.add_impact_products_demo import IMPACT_PRODUCT_NAMES, _impact_catalog
from app.database import AsyncSessionLocal, engine
from app.models.product import Product
from app.models.supply_chain import SupplyChainRecord


async def main() -> None:
    try:
        async with AsyncSessionLocal() as session:
            updated = 0
            for item in _impact_catalog():
                prod = await session.scalar(select(Product).where(Product.name == item["name"]))
                if not prod or prod.name not in IMPACT_PRODUCT_NAMES:
                    continue
                for row in item["trace"]:
                    stage, _desc, loc, lat, lon, *_rest = row
                    rec = await session.scalar(
                        select(SupplyChainRecord).where(
                            SupplyChainRecord.product_id == prod.id,
                            SupplyChainRecord.stage == stage,
                            SupplyChainRecord.location == loc,
                        )
                    )
                    if rec is None:
                        continue
                    if rec.latitude != lat or rec.longitude != lon:
                        rec.latitude = lat
                        rec.longitude = lon
                        updated += 1
            await session.commit()
            print(f"Fixed latitude/longitude on {updated} supply_chain_records.")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
