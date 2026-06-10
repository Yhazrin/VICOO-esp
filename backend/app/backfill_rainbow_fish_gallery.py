"""
为「彩虹鱼棉质 T 恤」各溯源阶段写入 backend/static/photo/ 配图（可重复执行）。

用法: cd backend && python -m app.backfill_rainbow_fish_gallery
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal, engine
from app.data.rainbow_fish_supply_gallery import (
    RAINBOW_FISH_GALLERY_BY_STAGE,
    RAINBOW_FISH_PRODUCT_NAME,
    rainbow_fish_gallery_json,
)
from app.models.product import Product
from app.models.supply_chain import SupplyChainRecord


async def main() -> None:
    try:
        async with AsyncSessionLocal() as session:
            product_id = await session.scalar(
                select(Product.id).where(Product.name == RAINBOW_FISH_PRODUCT_NAME).limit(1)
            )
            if product_id is None:
                print(f"未找到商品「{RAINBOW_FISH_PRODUCT_NAME}」，跳过。")
                return

            updated = 0
            for stage in RAINBOW_FISH_GALLERY_BY_STAGE:
                gallery_json = rainbow_fish_gallery_json(stage)
                if not gallery_json:
                    continue
                result = await session.execute(
                    select(SupplyChainRecord).where(
                        SupplyChainRecord.product_id == product_id,
                        SupplyChainRecord.stage == stage,
                    )
                )
                record = result.scalars().first()
                if record is None:
                    print(f"  跳过 {stage}：无溯源记录")
                    continue
                record.gallery_json = gallery_json
                updated += 1

            await session.commit()
            print(
                f"backfill_rainbow_fish_gallery: 商品 id={product_id}，更新 {updated} 个阶段的 gallery。"
            )
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
