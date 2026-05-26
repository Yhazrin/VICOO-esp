"""
Backfill supply chain trace records for the first 10 impact products (by id).
Skips products that already have any supply_chain records to avoid duplicates.

Usage: cd backend && python -m app.backfill_impact_supply
"""

from __future__ import annotations

import asyncio

from sqlalchemy import func, select

from app.database import AsyncSessionLocal, engine
from app.data.impact_supply_chain_seed import extra_impact_supply_records
from app.models.product import Product
from app.models.supply_chain import SupplyChainRecord


async def main() -> None:
    async with AsyncSessionLocal() as session:
        r = await session.execute(
            select(Product.id)
            .where(Product.is_impact_product.is_(True))
            .order_by(Product.id)
            .limit(10)
        )
        ids = [row[0] for row in r.all()]
        if len(ids) < 10:
            print(f"Fewer than 10 impact products found ({len(ids)}) — skipping. Ensure seed data is complete.")
            return

        candidates = extra_impact_supply_records(ids)
        added = 0
        for rec in candidates:
            q = await session.scalar(
                select(func.count())
                .select_from(SupplyChainRecord)
                .where(
                    SupplyChainRecord.product_id == rec.product_id,
                    SupplyChainRecord.stage == rec.stage,
                )
            )
            if q and q > 0:
                continue
            session.add(rec)
            added += 1
        await session.commit()
        print(f"backfill_impact_supply: added {added} trace records (existing product+stage pairs skipped).")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
