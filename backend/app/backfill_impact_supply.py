"""
为已有数据库中「前 10 个公益商品（按 id 升序）」补写优衣库式溯源（若该商品尚无任一条 supply_chain 记录则跳过整组，避免重复）。

用法: cd backend && python -m app.backfill_impact_supply
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
            print(f"公益商品不足 10 条（当前 {len(ids)}），跳过。请先保证种子或商品数据完整。")
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
        print(f"backfill_impact_supply: 新增 {added} 条溯源记录（已存在同品同阶段则跳过）。")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
