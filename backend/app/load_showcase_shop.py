"""
Idempotently insert/update showcase products for demos and courses (upsert by product name).

Run locally or inside container:
  cd backend && python -m app.load_showcase_shop

Docker:
  docker compose -f deploy/easy/docker-compose.yml exec backend python -m app.load_showcase_shop
"""

from __future__ import annotations

import asyncio

from sqlalchemy import func, select

from app.database import AsyncSessionLocal, engine
from app.models.artwork import Artwork
from app.models.campaign import Campaign
from app.models.product import Product
from app.models.supply_chain import SupplyChainRecord
from app.showcase_shop_catalog import SHOWCASE_IMPACT, SHOWCASE_REGULAR


async def _supply_count(session, product_id: int) -> int:
    q = await session.execute(
        select(func.count()).select_from(SupplyChainRecord).where(SupplyChainRecord.product_id == product_id)
    )
    return int(q.scalar() or 0)


async def main() -> None:
    try:
        async with AsyncSessionLocal() as session:
            c_res = await session.execute(select(Campaign.id).order_by(Campaign.id))
            campaign_ids = list(c_res.scalars().all())
            if not campaign_ids:
                print("Error: no campaigns — please run python -m app.seed or create campaigns first.")
                return

            a_res = await session.execute(
                select(Artwork.id).where(Artwork.status == "approved").order_by(Artwork.id)
            )
            artwork_ids = list(a_res.scalars().all())
            if not artwork_ids:
                a2 = await session.execute(select(Artwork.id).order_by(Artwork.id).limit(12))
                artwork_ids = list(dict.fromkeys(artwork_ids + list(a2.scalars().all())))
            if not artwork_ids:
                print("Error: no artworks — please run seed first.")
                return

            n_supply = 0

            for row in SHOWCASE_REGULAR:
                r = await session.execute(select(Product).where(Product.name == row["name"]))
                p = r.scalar_one_or_none()
                if p:
                    p.description = row["description"]
                    p.price = row["price"]
                    p.image_url = row["image_url"]
                    p.category = row["category"]
                    p.stock = row["stock"]
                    p.status = "active"
                    p.is_impact_product = False
                    p.currency = "CNY"
                    p.campaign_id = None
                    p.artwork_id = None
                    p.donation_percentage = None
                else:
                    session.add(
                        Product(
                            name=row["name"],
                            description=row["description"],
                            price=row["price"],
                            currency="CNY",
                            image_url=row["image_url"],
                            category=row["category"],
                            stock=row["stock"],
                            status="active",
                            is_impact_product=False,
                        )
                    )

            await session.flush()

            for item in SHOWCASE_IMPACT:
                r = await session.execute(select(Product).where(Product.name == item["name"]))
                p = r.scalar_one_or_none()
                cid = campaign_ids[item["campaign_i"] % len(campaign_ids)]
                aid = artwork_ids[item["artwork_i"] % len(artwork_ids)]
                if p:
                    p.description = item["description"]
                    p.price = item["price"]
                    p.image_url = item["image_url"]
                    p.category = item["category"]
                    p.stock = item["stock"]
                    p.status = "active"
                    p.is_impact_product = True
                    p.campaign_id = cid
                    p.donation_percentage = item["donation_percentage"]
                    p.artwork_id = aid
                    p.currency = "CNY"
                    pid = p.id
                else:
                    np = Product(
                        name=item["name"],
                        description=item["description"],
                        price=item["price"],
                        currency="CNY",
                        image_url=item["image_url"],
                        category=item["category"],
                        stock=item["stock"],
                        status="active",
                        is_impact_product=True,
                        campaign_id=cid,
                        donation_percentage=item["donation_percentage"],
                        artwork_id=aid,
                    )
                    session.add(np)
                    await session.flush()
                    pid = np.id

                sc = await _supply_count(session, pid)
                if sc == 0:
                    for tr in item["trace"]:
                        stage, desc, loc, lat, lon, cert, ts, carbon_kg, carbon_note = tr
                        session.add(
                            SupplyChainRecord(
                                product_id=pid,
                                stage=stage,
                                description=desc,
                                location=loc,
                                latitude=lat,
                                longitude=lon,
                                certified=cert,
                                cert_image_url=None,
                                timestamp=ts,
                                carbon_kg=carbon_kg,
                                carbon_note=carbon_note,
                            )
                        )
                        n_supply += 1

            await session.commit()
            print(
                f"Showcase products synced: {len(SHOWCASE_REGULAR)} regular, {len(SHOWCASE_IMPACT)} impact; "
                f"added {n_supply} supply chain records (only for products without trace data)."
            )
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
