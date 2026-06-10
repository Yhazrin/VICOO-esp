"""
Idempotently insert / update charity campaigns in the database (with Unsplash cover images).

- New databases get multiple illustrated campaigns
- Existing rows with relative cover_image paths (e.g. /static/campaigns/) are updated to https URLs

Run inside server/container:
  cd /path/to/VICOO-esp/backend && python -m app.add_campaigns_demo

Or via docker:
  docker compose -f deploy/easy/docker-compose.host-nginx.yml exec backend \
    python -m app.add_campaigns_demo
"""
from __future__ import annotations

import asyncio
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select

from app.data.campaign_covers import (
    COVER_CHOIR,
    COVER_FUTURE,
    COVER_HOMETOWN,
    COVER_SPRING,
    COVER_WORKSHOP,
)
from app.database import AsyncSessionLocal, engine
from app.models.campaign import Campaign
from app.utils.cache import invalidate_cache

# Titles match seed data for idempotent merge
def _rows() -> list[dict]:
    return [
        {
            "title": "Colors of Spring — Rural Children Art Exhibition",
            "description": (
                "Collecting artworks from children in rural primary schools across the country, "
                "showcasing spring through their eyes. Outstanding works will be exhibited in city "
                "galleries and turned into charity postcards for fundraising."
            ),
            "cover_image": COVER_SPRING,
            "start_date": datetime(2025, 3, 1),
            "end_date": datetime(2025, 6, 30),
            "goal_amount": Decimal("50000.00"),
            "current_amount": Decimal("32500.00"),
            "status": "active",
            "participant_count": 150,
            "artwork_count": 8,
        },
        {
            "title": "My Hometown — Memories of the Land",
            "description": (
                "Inviting children to paint the mountains, rivers, and traditions of their hometowns. "
                "Preserving fading rural memories and raising awareness of local culture."
            ),
            "cover_image": COVER_HOMETOWN,
            "start_date": datetime(2025, 7, 1),
            "end_date": datetime(2025, 10, 31),
            "goal_amount": Decimal("80000.00"),
            "current_amount": Decimal("15000.00"),
            "status": "active",
            "participant_count": 95,
            "artwork_count": 7,
        },
        {
            "title": "Paint the Future — Technology & Dreams",
            "description": (
                "Themed around 'Future Technology', encouraging children to boldly imagine the world "
                "of tomorrow. Winning artworks will be used for charity T-shirt designs, with all "
                "proceeds funding rural art education."
            ),
            "cover_image": COVER_FUTURE,
            "start_date": datetime(2025, 11, 1),
            "end_date": datetime(2026, 2, 28),
            "goal_amount": Decimal("100000.00"),
            "current_amount": Decimal("8500.00"),
            "status": "active",
            "participant_count": 60,
            "artwork_count": 5,
        },
        {
            "title": "Childhood Dreams — Sustainable Materials Workshop",
            "description": (
                "Running introductory classes on recycled fabrics and plant-based dyeing at rural "
                "primary schools, with participants creating small quilts and scarves from reclaimed cloth. "
                "Material costs and instructor fees are funded by this campaign."
            ),
            "cover_image": COVER_WORKSHOP,
            "start_date": datetime(2025, 9, 1),
            "end_date": datetime(2026, 1, 31),
            "goal_amount": Decimal("40000.00"),
            "current_amount": Decimal("12000.00"),
            "status": "active",
            "participant_count": 48,
            "artwork_count": 4,
        },
        {
            "title": "Voices of the Cloud Ridge — Rural Children's Choir",
            "description": "Building small choirs for village groups across Yunnan and Guizhou, providing sheet music, uniforms, and one city performance opportunity.",
            "cover_image": COVER_CHOIR,
            "start_date": datetime(2025, 4, 1),
            "end_date": datetime(2025, 12, 20),
            "goal_amount": Decimal("60000.00"),
            "current_amount": Decimal("28000.00"),
            "status": "active",
            "participant_count": 120,
            "artwork_count": 6,
        },
    ]


async def main() -> None:
    rows = _rows()
    titles = [r["title"] for r in rows]
    inserted = 0
    updated = 0

    async with AsyncSessionLocal() as session:
        existing = (await session.execute(select(Campaign).where(Campaign.title.in_(titles)))).scalars().all()
        by_title = {c.title: c for c in existing}

        for r in rows:
            t = r["title"]
            if t not in by_title:
                c = Campaign(
                    title=r["title"],
                    description=r["description"],
                    cover_image=r["cover_image"],
                    start_date=r["start_date"],
                    end_date=r["end_date"],
                    goal_amount=r["goal_amount"],
                    current_amount=r["current_amount"],
                    status=r["status"],
                    participant_count=r["participant_count"],
                    artwork_count=r["artwork_count"],
                )
                session.add(c)
                inserted += 1
            else:
                c = by_title[t]
                old = c.cover_image or ""
                if old.startswith("/static/") or not old.startswith("http"):
                    c.cover_image = r["cover_image"]
                    if not (c.description or "").strip():
                        c.description = r["description"]
                    updated += 1

        await session.commit()

    # Invalidate list cache
    try:
        await invalidate_cache("campaigns:")
    except Exception as e:
        print(f"Warning: cache invalidation failed: {e}")

    print(f"Campaigns: inserted {inserted}, updated cover/description {updated}.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
