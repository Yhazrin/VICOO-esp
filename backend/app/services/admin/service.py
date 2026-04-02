import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, ChildParticipant
from app.models.artwork import Artwork
from app.models.donation import Donation
from app.models.order import Order
from app.models.campaign import Campaign
from app.services.base import BaseService
from app.core.audit import audit_action

logger = logging.getLogger("tonghua.admin_service")

class AdminService(BaseService):
    """
    Service handling administrative tasks, bulk operations, and dashboard stats.
    """

    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """
        Aggregate real-time metrics for the admin dashboard.
        """
        # 1. Total Donation Amount
        donation_total = (await self.db.execute(
            select(func.sum(Donation.amount)).where(Donation.status == "completed")
        )).scalar() or 0

        # 2. Pending Artworks Count
        pending_artworks = (await self.db.execute(
            select(func.count(Artwork.id)).where(Artwork.status == "pending")
        )).scalar() or 0

        # 3. Active Campaigns Count
        active_campaigns = (await self.db.execute(
            select(func.count(Campaign.id)).where(Campaign.status == "active")
        )).scalar() or 0

        # 4. Total Users Count
        total_users = (await self.db.execute(select(func.count(User.id)))).scalar() or 0

        return {
            "total_donation_amount": str(donation_total),
            "pending_artworks_count": pending_artworks,
            "active_campaigns_count": active_campaigns,
            "total_users_count": total_users,
            "currency": "CNY"
        }

    @audit_action(action="batch_moderate_artworks", resource_type="artwork")
    async def batch_moderate_artworks(self, artwork_ids: List[int], status: str) -> Dict[str, Any]:
        """
        Approve or reject multiple artworks at once.
        """
        stmt = (
            update(Artwork)
            .where(Artwork.id.in_(artwork_ids))
            .values(status=status)
        )
        await self.db.execute(stmt)
        
        # If approving, we might want to also sync count back to children, 
        # but for bulk we'll do a simple update for now.
        
        return {"modified_count": len(artwork_ids), "status": status}

    @audit_action(action="batch_moderate_children", resource_type="child_participant")
    async def batch_moderate_children(self, child_ids: List[int], status: str) -> Dict[str, Any]:
        """
        Approve or withdraw multiple child participants.
        """
        stmt = (
            update(ChildParticipant)
            .where(ChildParticipant.id.in_(child_ids))
            .values(status=status)
        )
        await self.db.execute(stmt)
        return {"modified_count": len(child_ids), "status": status}
