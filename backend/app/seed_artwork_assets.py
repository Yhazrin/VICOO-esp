"""
Idempotent seed: bind demo artwork rows to local static images.

Runs on API startup when:
  - all artwork_1..20.jpg exist under backend/static/artworks/, and
  - fewer than 20 artworks in DB already point at those static URLs.

Usage:
  cd backend && python -m app.seed_artwork_assets
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.artwork_catalog_seed import (
    ARTWORK_CATALOG,
    ARTWORK_COUNT,
    ARTWORK_STATIC_PREFIX,
    artwork_image_url,
    artwork_thumb_url,
)
from app.database import AsyncSessionLocal
from app.models.artwork import Artwork
from app.models.campaign import Campaign
from app.models.user import ChildParticipant

logger = logging.getLogger("vicoo.seed_artwork_assets")

_STATIC_ARTWORKS_DIR = Path(__file__).resolve().parent.parent / "static" / "artworks"


def static_artwork_files_complete() -> bool:
    if not _STATIC_ARTWORKS_DIR.is_dir():
        return False
    for seq in range(1, ARTWORK_COUNT + 1):
        if not (_STATIC_ARTWORKS_DIR / f"artwork_{seq}.jpg").is_file():
            return False
    return True


async def count_artworks_with_local_images(session: AsyncSession) -> int:
    stmt = (
        select(func.count())
        .select_from(Artwork)
        .where(Artwork.image_url.like(f"%{ARTWORK_STATIC_PREFIX}%"))
    )
    return int((await session.execute(stmt)).scalar_one() or 0)


async def artworks_need_asset_seed(session: AsyncSession) -> bool:
    if not static_artwork_files_complete():
        return False
    bound = await count_artworks_with_local_images(session)
    return bound < ARTWORK_COUNT


async def _load_child_and_campaign_ids(session: AsyncSession) -> tuple[list[int], list[int]]:
    children = (
        await session.execute(select(ChildParticipant.id).order_by(ChildParticipant.id))
    ).scalars().all()
    campaigns = (
        await session.execute(select(Campaign.id).order_by(Campaign.id))
    ).scalars().all()
    return list(children), list(campaigns)


def _resolve_campaign_id(campaign_ids: list[int], campaign_index: int | None) -> int | None:
    if campaign_index is None:
        return None
    if campaign_index < 0 or campaign_index >= len(campaign_ids):
        return None
    return campaign_ids[campaign_index]


def _resolve_child_id(child_ids: list[int], child_index: int | None) -> int | None:
    if child_index is None:
        return None
    if child_index < 0 or child_index >= len(child_ids):
        return None
    return child_ids[child_index]


async def seed_artwork_assets(session: AsyncSession) -> tuple[int, int]:
    """Update or insert catalog artworks. Returns (updated, inserted)."""
    existing = (await session.execute(select(Artwork))).scalars().all()
    by_title = {a.title: a for a in existing}

    child_ids, campaign_ids = await _load_child_and_campaign_ids(session)

    updated = 0
    inserted = 0

    for entry in ARTWORK_CATALOG:
        seq = entry["seq"]
        image_url = artwork_image_url(seq)
        thumbnail_url = artwork_thumb_url(seq)
        artwork = by_title.get(entry["title"])

        if artwork is None:
            artwork = Artwork(
                title=entry["title"],
                description=entry["description"],
                image_url=image_url,
                thumbnail_url=thumbnail_url,
                child_participant_id=_resolve_child_id(child_ids, entry.get("child_index")),
                artist_name=entry["artist_name"],
                status=entry["status"],
                like_count=entry["like_count"],
                view_count=entry["view_count"],
                campaign_id=_resolve_campaign_id(campaign_ids, entry.get("campaign_index")),
            )
            session.add(artwork)
            inserted += 1
            continue

        changed = False
        if artwork.image_url != image_url:
            artwork.image_url = image_url
            changed = True
        if artwork.thumbnail_url != thumbnail_url:
            artwork.thumbnail_url = thumbnail_url
            changed = True
        if changed:
            updated += 1

    return updated, inserted


async def maybe_seed_artwork_assets() -> bool:
    """
    Load artwork static bindings when files exist but DB is not fully wired.
    Returns True if seed ran (updates or inserts committed).
    """
    if not static_artwork_files_complete():
        logger.debug("Artwork static files incomplete; skip artwork asset seed.")
        return False

    async with AsyncSessionLocal() as session:
        if not await artworks_need_asset_seed(session):
            logger.debug("Artwork assets already bound (%d/%d).", ARTWORK_COUNT, ARTWORK_COUNT)
            return False

        updated, inserted = await seed_artwork_assets(session)
        await session.commit()
        logger.info(
            "Artwork asset seed complete: updated=%d inserted=%d (static /static/artworks/).",
            updated,
            inserted,
        )
        return updated > 0 or inserted > 0


async def run() -> int:
    if not static_artwork_files_complete():
        print("seed_artwork_assets: static files missing under backend/static/artworks/")
        return 1
    async with AsyncSessionLocal() as session:
        if not await artworks_need_asset_seed(session):
            bound = await count_artworks_with_local_images(session)
            print(f"seed_artwork_assets: nothing to do ({bound}/{ARTWORK_COUNT} already bound).")
            return 0
        updated, inserted = await seed_artwork_assets(session)
        await session.commit()
        print(f"seed_artwork_assets: updated={updated} inserted={inserted}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
