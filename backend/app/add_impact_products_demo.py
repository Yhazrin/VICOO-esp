"""
Idempotently insert realistic impact products with full supply-chain trace nodes (WGS84).
Deduplicates by product name — safe to run multiple times.

Run inside container:
  cd /app/backend && python -m app.add_impact_products_demo
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select

from app.database import AsyncSessionLocal, engine
from app.models.artwork import Artwork
from app.models.campaign import Campaign
from app.models.country import Country
from app.models.product import Product
from app.models.region import Region
from app.models.supply_chain import SupplyChainRecord
from app.data.impact_origin_story_seed import (
    DEFAULT_IMPACT_TRACE_STORY,
    IMPACT_TRACE_STORY_BY_NAME,
    ORIGIN_COUNTRIES,
    ORIGIN_REGIONS,
)

# Unsplash images (same style as seed.py)
_U = "https://images.unsplash.com"

# Fixed names for deduplication
IMPACT_PRODUCT_NAMES = frozenset(
    {
        "Dali Bai Tie-Dye Children's Art Scarf",
        "Guizhou Dong Indigo Canvas Bag 'Morning Mist'",
        "Qilian Yak Down Children's Art Shawl",
        "Dehua Recycled Porcelain Kids Mug Set",
    }
)


def _impact_catalog() -> list[dict]:
    """Each entry has campaign_i / artwork_i for modulo-binding to real DB ids."""
    return [
        {
            "name": "Dali Bai Tie-Dye Children's Art Scarf",
            "description": (
                "Co-branded with the 'Colors of Spring' project by Dali Zhoucheng's intangible tie-dye workshop. "
                "Scarf patterns come from award-winning paintings by partner school children. "
                "Plant-indigo dyed, hand-stitched edges. 26% of each sale funds rural art education supplies."
            ),
            "price": Decimal("128.00"),
            "category": "accessories",
            "stock": 160,
            "donation_percentage": Decimal("26.00"),
            "campaign_i": 0,
            "artwork_i": 0,
            "image_url": f"{_U}/photo-1504196606672-aef5d9a7b792?auto=format&fit=crop&w=900&q=80",
            "trace": [
                ("material_sourcing", "Organic cotton yarn sourced directly from partner farms in Chuxiong, pesticide residue tested", "Chuxiong, Yunnan", 25.0330, 101.5330, True, datetime(2025, 8, 5), Decimal("2.8"), "Farm irrigation and harvest transport"),
                ("processing", "Plant-indigo fermentation dyeing at Zhoucheng workshop, no azo dyes", "Zhoucheng, Dali, Yunnan", 25.8547, 100.2139, True, datetime(2025, 8, 22), Decimal("1.9"), "Solar-assisted cloth drying"),
                ("manufacturing", "Hand-cut and stitched edges, partner seamstresses paid per piece", "Dali, Yunnan", 25.6065, 100.2676, True, datetime(2025, 9, 8), Decimal("0.6"), "Short-haul electric sewing in workshop"),
                ("quality_check", "Third-party lab in Kunming tests color fastness and formaldehyde", "Kunming, Yunnan", 25.0389, 102.7183, True, datetime(2025, 9, 18), Decimal("0.4"), "Test logistics included in carbon accounting"),
                ("shipping", "Biodegradable paper packaging, ships nationwide from Kunming warehouse", "Kunming, Yunnan", 25.0389, 102.7183, False, datetime(2025, 9, 25), Decimal("1.1"), "Cold-chain LTL + last-mile electric vehicles"),
            ],
        },
        {
            "name": "Guizhou Dong Indigo Canvas Bag 'Morning Mist'",
            "description": (
                "Indigo-dyed canvas from the Dong region of Qiandongnan, printed with the 'Morning Mist of Dong Village' "
                "children's artwork (authorized). Heavy-weight recycled cotton canvas with reinforced capacity. "
                "24% of sales donated to the 'My Hometown' rural memory project."
            ),
            "price": Decimal("96.00"),
            "category": "accessories",
            "stock": 220,
            "donation_percentage": Decimal("24.00"),
            "campaign_i": 1,
            "artwork_i": 1,
            "image_url": f"{_U}/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
            "trace": [
                ("material_sourcing", "Recycled cotton canvas fabric, supplier provides GRS traceability number", "Ningbo, Zhejiang", 29.8747, 121.5507, True, datetime(2025, 7, 12), Decimal("3.1"), "Sea freight consolidation to Qinzhou"),
                ("processing", "Seven-dip Dong indigo immersion dyeing at Kaili partner workshop, sun-cured", "Kaili, Guizhou", 26.5836, 107.9803, True, datetime(2025, 7, 28), Decimal("2.0"), "Dye vat heated with biomass pellets"),
                ("manufacturing", "Cut pieces and handle reinforcement at Liuzhou sewing factory", "Liuzhou, Guangxi", 24.3263, 109.4281, True, datetime(2025, 8, 15), Decimal("1.4"), "Rooftop solar panels at factory"),
                ("quality_check", "Tensile strength and color fastness spot-check, SGS partner lab", "Shenzhen, Guangdong", 22.5431, 114.0579, True, datetime(2025, 8, 29), Decimal("0.5"), "Samples air-freighted to lab"),
                ("shipping", "Shipped from South China central warehouse, carbon-neutral label offset", "Foshan, Guangdong", 23.0297, 113.1056, False, datetime(2025, 9, 6), Decimal("1.3"), "Electric truck trunk route pilot"),
            ],
        },
        {
            "name": "Qilian Yak Down Children's Art Shawl",
            "description": (
                "Yak down blend from pastures at the foot of the Qilian Mountains — soft and warm. "
                "Printed patterns from children's paintings at Haibei Prefecture charity primary school. "
                "27% of each sale funds winter heating and art classes for high-altitude schools."
            ),
            "price": Decimal("268.00"),
            "category": "accessories",
            "stock": 85,
            "donation_percentage": Decimal("27.00"),
            "campaign_i": 2,
            "artwork_i": 2,
            "image_url": f"{_U}/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80",
            "trace": [
                ("material_sourcing", "Dehaired yak down from Qilian pastoral cooperative, direct sourcing", "Qilian, Qinghai", 38.1754, 100.2497, True, datetime(2025, 6, 3), Decimal("4.2"), "Cold-chain short-haul from pasture to Xining"),
                ("processing", "Washing, dehairing, and worsted spinning at Xining wool mill", "Xining, Qinghai", 36.6171, 101.7782, True, datetime(2025, 6, 20), Decimal("2.6"), "Industrial waste heat recovery"),
                ("manufacturing", "Flat-knit weaving and digital printing at Tianjin knitting factory", "Tianjin", 39.0842, 117.2010, True, datetime(2025, 7, 8), Decimal("2.9"), "Annual grid green-electricity share disclosure"),
                ("quality_check", "Pilling and composition testing per FZ/T standards", "Langfang, Hebei", 39.5239, 116.7044, True, datetime(2025, 7, 22), Decimal("0.7"), "Centralized lab delivery"),
                ("shipping", "Bundled orders from North China warehouse, bio-based packaging", "Tongzhou, Beijing", 39.9097, 116.6576, False, datetime(2025, 8, 1), Decimal("1.5"), "Rail trunk + urban distribution"),
            ],
        },
        {
            "name": "Dehua Recycled Porcelain Kids Mug Set",
            "description": (
                "Dehua white porcelain craft with 30% recycled clay. Each set features two different children's "
                "paintings (sister pieces from the same class). 23% of sales fund pottery corners at rural schools in Fujian."
            ),
            "price": Decimal("158.00"),
            "category": "lifestyle",
            "stock": 140,
            "donation_percentage": Decimal("23.00"),
            "campaign_i": 0,
            "artwork_i": 3,
            "image_url": f"{_U}/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=900&q=80",
            "trace": [
                ("material_sourcing", "Kaolin blended with recycled construction ceramic powder, batch traceable", "Dehua, Fujian", 25.4897, 118.2417, True, datetime(2025, 5, 10), Decimal("2.2"), "Short-haul trucking to industrial park"),
                ("processing", "Ball milling, iron removal, and vacuum pugging", "Dehua, Fujian", 25.4897, 118.2417, True, datetime(2025, 5, 18), Decimal("1.1"), "Off-peak electricity production"),
                ("manufacturing", "High-pressure slip casting, underglaze decal, and 1280°C oxidation firing", "Dehua, Fujian", 25.4897, 118.2417, True, datetime(2025, 6, 2), Decimal("3.4"), "Natural gas kiln thermal efficiency upgrade"),
                ("quality_check", "Lead and cadmium leaching spot-check per GB 4806.4", "Quanzhou, Fujian", 24.9139, 118.5859, True, datetime(2025, 6, 15), Decimal("0.3"), "Same-city lab delivery"),
                ("shipping", "Xiamen port feeder + East China e-commerce warehouse distribution", "Xiamen, Fujian", 24.4798, 118.0894, False, datetime(2025, 6, 22), Decimal("1.8"), "Sea freight main trunk"),
            ],
        },
    ]


async def main() -> None:
    try:
        async with AsyncSessionLocal() as session:
            country_id_by_code: dict[str, int] = {}
            for row in ORIGIN_COUNTRIES:
                existing_country = (
                    await session.execute(select(Country).where(Country.code == row["code"]))
                ).scalar_one_or_none()
                if existing_country is None:
                    existing_country = Country(**row)
                    session.add(existing_country)
                    await session.flush()
                country_id_by_code[row["code"]] = existing_country.id

            region_id_by_name_zh: dict[str, int] = {}
            for row in ORIGIN_REGIONS:
                existing_region = (
                    await session.execute(select(Region).where(Region.name_zh == row["name_zh"]))
                ).scalar_one_or_none()
                if existing_region is None:
                    existing_region = Region(
                        country_id=country_id_by_code[row["country_code"]],
                        name_zh=row["name_zh"],
                        name_en=row["name_en"],
                        region_type=row.get("region_type"),
                    )
                    session.add(existing_region)
                    await session.flush()
                region_id_by_name_zh[row["name_zh"]] = existing_region.id

            existing = await session.execute(select(Product.name).where(Product.name.in_(IMPACT_PRODUCT_NAMES)))
            existing_names = set(existing.scalars().all())
            if existing_names == IMPACT_PRODUCT_NAMES:
                print("Impact trace products already exist — skipping insertion.")
                return

            c_res = await session.execute(select(Campaign.id).order_by(Campaign.id))
            campaign_ids = list(c_res.scalars().all())
            if not campaign_ids:
                print("Error: no campaigns in database — please run seed or create campaigns first.")
                return

            a_res = await session.execute(
                select(Artwork.id).where(Artwork.status == "approved").order_by(Artwork.id)
            )
            artwork_ids = list(a_res.scalars().all())
            if len(artwork_ids) < 4:
                a2 = await session.execute(select(Artwork.id).order_by(Artwork.id).limit(8))
                artwork_ids = list(dict.fromkeys(artwork_ids + list(a2.scalars().all())))
            if not artwork_ids:
                print("Error: no artworks in database — please run seed first.")
                return

            catalog = _impact_catalog()
            to_insert = [c for c in catalog if c["name"] not in existing_names]
            new_products: list[Product] = []

            for item in to_insert:
                story = IMPACT_TRACE_STORY_BY_NAME.get(item["name"], DEFAULT_IMPACT_TRACE_STORY)
                p = Product(
                    name=item["name"],
                    description=item["description"],
                    price=item["price"],
                    currency="CNY",
                    image_url=item["image_url"],
                    category=item["category"],
                    stock=item["stock"],
                    status="active",
                    is_impact_product=True,
                    campaign_id=campaign_ids[item["campaign_i"] % len(campaign_ids)],
                    donation_percentage=item["donation_percentage"],
                    artwork_id=artwork_ids[item["artwork_i"] % len(artwork_ids)],
                    origin_country_id=country_id_by_code.get(story["country_code"]),
                    origin_region_id=region_id_by_name_zh.get(story["region_name_zh"]),
                    trace_story_title=story["title"],
                    trace_story_content=story["content"],
                )
                session.add(p)
                new_products.append(p)

            await session.flush()

            for p, item in zip(new_products, to_insert, strict=True):
                for row in item["trace"]:
                    stage, desc, loc, lat, lon, cert, ts, carbon_kg, carbon_note = row
                    session.add(
                        SupplyChainRecord(
                            product_id=p.id,
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

            await session.commit()
            print(f"Inserted {len(new_products)} impact products with supply chain nodes.")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
