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
    try:
        async with AsyncSessionLocal() as session:
            r = await session.execute(
                select(Product.id)
                .where(Product.is_impact_product.is_(True))
                .order_by(Product.id)
                .limit(10)
            )
            ids = [row[0] for row in r.all()]
            if len(ids) < 2:
                print(f"公益商品不足 2 条（当前 {len(ids)}），跳过。请先执行种子或 add_impact_products_demo。")
                return
            if len(ids) < 10:
                print(
                    f"公益商品 {len(ids)} 条（不足 10），将为已有商品补写溯源；"
                    "缺失 SKU 请对照 seed 补全后再跑一遍。"
                )

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
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
