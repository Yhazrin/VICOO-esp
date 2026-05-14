import logging
from decimal import Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.impact_fund import ImpactFundEntry
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.artwork import Artwork
from app.services.base import BaseService
from app.core.audit import audit_action

logger = logging.getLogger("tonghua.impact_fund")

# Revenue split ratios
ARTIST_RATIO = Decimal("0.60")
SCHOOL_RATIO = Decimal("0.30")
CHARITY_RATIO = Decimal("0.10")


class ImpactFundService(BaseService):
    """Service for allocating and tracking impact fund entries from product sales."""

    @audit_action(action="allocate_impact_fund", resource_type="impact_fund")
    async def allocate_for_order(self, order_id: int) -> list[ImpactFundEntry]:
        """
        Allocate impact funds for all eligible items in an order.

        Idempotent: skips order if entries already exist.
        Only allocates for products with donation_percentage > 0.
        """
        # Idempotency check
        existing_stmt = select(ImpactFundEntry).where(ImpactFundEntry.order_id == order_id)
        existing = (await self.db.execute(existing_stmt)).scalars().all()
        if existing:
            logger.info(f"Impact fund already allocated for order {order_id}, skipping.")
            return existing

        # Get order items
        items_stmt = select(OrderItem).where(OrderItem.order_id == order_id)
        items = (await self.db.execute(items_stmt)).scalars().all()

        if not items:
            return []

        # Batch load products
        product_ids = list({item.product_id for item in items})
        products_stmt = select(Product).where(Product.id.in_(product_ids))
        products_result = (await self.db.execute(products_stmt)).scalars().all()
        product_map = {p.id: p for p in products_result}

        # Batch load artworks for products that have artwork_id
        artwork_ids = list({p.artwork_id for p in product_map.values() if p.artwork_id})
        artwork_map = {}
        if artwork_ids:
            artworks_stmt = select(Artwork).where(Artwork.id.in_(artwork_ids))
            artworks_result = (await self.db.execute(artworks_stmt)).scalars().all()
            artwork_map = {a.id: a for a in artworks_result}

        entries: list[ImpactFundEntry] = []

        for item in items:
            product = product_map.get(item.product_id)

            if not product or not product.donation_percentage or product.donation_percentage <= 0:
                continue

            item_total = item.price * item.quantity
            donation_pct = product.donation_percentage
            donation_total = item_total * donation_pct / Decimal("100")

            # Get artwork info for artist/school names
            artist_name = None
            school_name = None
            artwork_id = product.artwork_id
            child_participant_id = None

            if artwork_id:
                artwork = artwork_map.get(artwork_id)
                if artwork:
                    artist_name = artwork.artist_name
                    child_participant_id = artwork.child_participant_id
                    if artwork.child_participant:
                        school_name = artwork.child_participant.school

            # 60% to artist
            entries.append(ImpactFundEntry(
                order_id=order_id,
                order_item_id=item.id,
                product_id=product.id,
                artwork_id=artwork_id,
                child_participant_id=child_participant_id,
                beneficiary_type="artist",
                beneficiary_name=artist_name,
                sale_amount=item_total,
                donation_percentage=donation_pct,
                allocated_amount=donation_total * ARTIST_RATIO,
                status="allocated",
            ))

            # 30% to school
            entries.append(ImpactFundEntry(
                order_id=order_id,
                order_item_id=item.id,
                product_id=product.id,
                artwork_id=artwork_id,
                child_participant_id=child_participant_id,
                beneficiary_type="school",
                beneficiary_name=school_name,
                sale_amount=item_total,
                donation_percentage=donation_pct,
                allocated_amount=donation_total * SCHOOL_RATIO,
                status="allocated",
            ))

            # 10% to charity pool
            entries.append(ImpactFundEntry(
                order_id=order_id,
                order_item_id=item.id,
                product_id=product.id,
                artwork_id=artwork_id,
                child_participant_id=child_participant_id,
                beneficiary_type="charity_pool",
                beneficiary_name="VICOO Charity Pool",
                sale_amount=item_total,
                donation_percentage=donation_pct,
                allocated_amount=donation_total * CHARITY_RATIO,
                status="allocated",
            ))

        for entry in entries:
            self.db.add(entry)
        await self.db.flush()

        logger.info(f"Allocated {len(entries)} impact fund entries for order {order_id}")
        return entries

    async def get_entries_for_order(self, order_id: int) -> list[ImpactFundEntry]:
        """Get all impact fund entries for an order."""
        stmt = select(ImpactFundEntry).where(ImpactFundEntry.order_id == order_id)
        return (await self.db.execute(stmt)).scalars().all()

    async def get_fund_summary(self) -> dict:
        """Get aggregate impact fund statistics."""
        from sqlalchemy import func as sa_func

        total_stmt = select(
            sa_func.coalesce(sa_func.sum(ImpactFundEntry.allocated_amount), 0),
            sa_func.count(ImpactFundEntry.id),
        )
        result = (await self.db.execute(total_stmt)).one()
        total_amount = result[0] or 0
        total_entries = result[1] or 0

        by_type_stmt = select(
            ImpactFundEntry.beneficiary_type,
            sa_func.coalesce(sa_func.sum(ImpactFundEntry.allocated_amount), 0),
            sa_func.count(ImpactFundEntry.id),
        ).group_by(ImpactFundEntry.beneficiary_type)
        by_type_result = (await self.db.execute(by_type_stmt)).all()

        by_type = {}
        for row in by_type_result:
            by_type[row[0]] = {"amount": float(row[1]), "count": row[2]}

        return {
            "total_amount": float(total_amount),
            "total_entries": total_entries,
            "by_type": by_type,
        }
