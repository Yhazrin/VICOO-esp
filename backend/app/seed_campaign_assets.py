"""
Idempotent seed: bind demo campaigns to local static cover images.

Runs on API startup when:
  - campaign_1..8.jpg exist under backend/static/campaigns/, and
  - fewer than 8 campaigns use those covers and/or catalog metadata is outdated.

Usage:
  cd backend && python -m app.seed_campaign_assets
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.campaign_catalog_seed import (
    CAMPAIGN_CATALOG,
    CAMPAIGN_COUNT,
    CAMPAIGN_STATIC_PREFIX,
    campaign_cover_url,
)
from app.database import AsyncSessionLocal
from app.models.artwork import Artwork
from app.models.campaign import Campaign
from app.models.donation import Donation
from app.models.product import Product

logger = logging.getLogger("vicoo.seed_campaign_assets")

_STATIC_CAMPAIGNS_DIR = Path(__file__).resolve().parent.parent / "static" / "campaigns"

_CATALOG_FIELDS = (
    "title",
    "subtitle",
    "description",
    "start_date",
    "end_date",
    "goal_amount",
    "current_amount",
    "status",
    "participant_count",
    "artwork_count",
    "sustainability_eyebrow",
    "sustainability_title",
    "sustainability_subtitle",
)


def static_campaign_files_complete() -> bool:
    if not _STATIC_CAMPAIGNS_DIR.is_dir():
        return False
    for seq in range(1, CAMPAIGN_COUNT + 1):
        if not (_STATIC_CAMPAIGNS_DIR / f"campaign_{seq}.jpg").is_file():
            return False
    return True


async def count_campaigns_with_local_covers(session: AsyncSession) -> int:
    stmt = (
        select(func.count())
        .select_from(Campaign)
        .where(Campaign.cover_image.like(f"%{CAMPAIGN_STATIC_PREFIX}%"))
    )
    return int((await session.execute(stmt)).scalar_one() or 0)


async def _load_campaigns_ordered(session: AsyncSession) -> list[Campaign]:
    return list(
        (await session.execute(select(Campaign).order_by(Campaign.id))).scalars().all()
    )


async def campaigns_need_asset_seed(session: AsyncSession) -> bool:
    if not static_campaign_files_complete():
        return False

    existing = await _load_campaigns_ordered(session)
    bound = await count_campaigns_with_local_covers(session)

    if len(existing) < CAMPAIGN_COUNT:
        return True
    if bound < CAMPAIGN_COUNT:
        return True

    for i, entry in enumerate(CAMPAIGN_CATALOG):
        if i >= len(existing):
            break
        if existing[i].title != entry["title"]:
            return True

    return False


def _campaign_from_entry(entry: dict, cover_image: str) -> Campaign:
    kwargs = {field: entry[field] for field in _CATALOG_FIELDS if field in entry}
    kwargs["cover_image"] = cover_image
    return Campaign(**kwargs)


def _apply_entry_to_campaign(campaign: Campaign, entry: dict, cover_image: str) -> bool:
    changed = False
    if campaign.cover_image != cover_image:
        campaign.cover_image = cover_image
        changed = True
    for field in _CATALOG_FIELDS:
        if field not in entry:
            continue
        value = entry[field]
        if getattr(campaign, field) != value:
            setattr(campaign, field, value)
            changed = True
    return changed


async def _prune_extra_campaigns(session: AsyncSession) -> int:
    """Remove duplicate demo rows (id > CAMPAIGN_COUNT) with no FK references."""
    extras = list(
        (
            await session.execute(
                select(Campaign).where(Campaign.id > CAMPAIGN_COUNT).order_by(Campaign.id)
            )
        )
        .scalars()
        .all()
    )
    removed = 0
    for campaign in extras:
        cid = campaign.id
        product_count = int(
            (
                await session.execute(
                    select(func.count()).select_from(Product).where(Product.campaign_id == cid)
                )
            ).scalar_one()
            or 0
        )
        donation_count = int(
            (
                await session.execute(
                    select(func.count()).select_from(Donation).where(Donation.campaign_id == cid)
                )
            ).scalar_one()
            or 0
        )
        artwork_count = int(
            (
                await session.execute(
                    select(func.count()).select_from(Artwork).where(Artwork.campaign_id == cid)
                )
            ).scalar_one()
            or 0
        )
        if product_count or donation_count or artwork_count:
            continue
        await session.delete(campaign)
        removed += 1
    return removed


async def seed_campaign_assets(session: AsyncSession) -> tuple[int, int]:
    """Update or insert catalog campaigns by stable id order. Returns (updated, inserted)."""
    existing = await _load_campaigns_ordered(session)
    updated = 0
    inserted = 0

    for i, entry in enumerate(CAMPAIGN_CATALOG):
        cover_image = campaign_cover_url(entry["seq"])
        if i < len(existing):
            if _apply_entry_to_campaign(existing[i], entry, cover_image):
                updated += 1
            continue

        session.add(_campaign_from_entry(entry, cover_image))
        inserted += 1

    return updated, inserted


async def campaigns_need_prune(session: AsyncSession) -> bool:
    extra_count = int(
        (
            await session.execute(
                select(func.count()).select_from(Campaign).where(Campaign.id > CAMPAIGN_COUNT)
            )
        ).scalar_one()
        or 0
    )
    return extra_count > 0


async def maybe_seed_campaign_assets() -> bool:
    if not static_campaign_files_complete():
        logger.debug("Campaign static files incomplete; skip campaign asset seed.")
        return False

    async with AsyncSessionLocal() as session:
        need_seed = await campaigns_need_asset_seed(session)
        need_prune = await campaigns_need_prune(session)
        if not need_seed and not need_prune:
            bound = await count_campaigns_with_local_covers(session)
            logger.debug(
                "Campaign assets already bound (%d/%d).", bound, CAMPAIGN_COUNT
            )
            return False

        updated = inserted = removed = 0
        if need_seed:
            updated, inserted = await seed_campaign_assets(session)
        if need_prune:
            removed = await _prune_extra_campaigns(session)
        await session.commit()
        logger.info(
            "Campaign asset seed complete: updated=%d inserted=%d removed=%d (static /static/campaigns/).",
            updated,
            inserted,
            removed,
        )
        return updated > 0 or inserted > 0 or removed > 0


async def run() -> int:
    if not static_campaign_files_complete():
        print("seed_campaign_assets: static files missing under backend/static/campaigns/")
        return 1
    async with AsyncSessionLocal() as session:
        need_seed = await campaigns_need_asset_seed(session)
        need_prune = await campaigns_need_prune(session)
        if not need_seed and not need_prune:
            bound = await count_campaigns_with_local_covers(session)
            print(f"seed_campaign_assets: nothing to do ({bound}/{CAMPAIGN_COUNT} bound).")
            return 0
        updated = inserted = removed = 0
        if need_seed:
            updated, inserted = await seed_campaign_assets(session)
        if need_prune:
            removed = await _prune_extra_campaigns(session)
        await session.commit()
        print(f"seed_campaign_assets: updated={updated} inserted={inserted} removed={removed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
