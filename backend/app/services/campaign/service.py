import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import select, func
from app.models.campaign import Campaign
from app.services.base import BaseService
from app.utils.cache import invalidate_cache
from app.utils.campaign_phase import build_campaign_status_filter, normalize_status_filter, resolve_campaign_phase
from app.core.audit import audit_action
from app.core.errors import ResourceNotFoundException, ServiceUnavailableException

logger = logging.getLogger("vicoo.campaign_service")

class CampaignService(BaseService):
    """
    Service for managing public welfare campaigns.
    Implements Redis caching for high-traffic listing endpoints.
    """

    # Do NOT use @cached here: return values contain ORM objects that cannot survive
    # json.dumps round-trip, which corrupts Redis and causes Pydantic conversion failures.
    # In DEMO_MODE this falls through to the router's except block, returning empty list.
    async def list_campaigns(
        self, 
        page: int = 1, 
        page_size: int = 20, 
        status: Optional[str] = None
    ) -> Tuple[List[Campaign], int]:
        """List campaigns with pagination."""
        try:
            stmt = select(Campaign)
            if status:
                normalized = normalize_status_filter(status)
                stmt = stmt.where(build_campaign_status_filter(normalized or status))

            count_stmt = select(func.count(Campaign.id))
            if status:
                normalized = normalize_status_filter(status)
                count_stmt = count_stmt.where(build_campaign_status_filter(normalized or status))
            total = (await self.db.execute(count_stmt)).scalar() or 0
            
            # Get items
            stmt = stmt.order_by(Campaign.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
            result = await self.db.execute(stmt)
            campaigns = result.scalars().all()
            
            return campaigns, total
        except Exception as e:
            logger.error("Error in list_campaigns: %s", e)
            raise ServiceUnavailableException(message="Database query failed")

    async def get_active_campaign(self) -> Campaign:
        """Get the latest campaign that is in progress by date."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(Campaign)
            .where(build_campaign_status_filter("active", now))
            .order_by(Campaign.created_at.desc())
        )
        result = await self.db.execute(stmt)
        campaign = result.scalar_one_or_none()
        if not campaign:
            raise ResourceNotFoundException(message="No active campaign found")
        return campaign

    async def get_campaign_by_id(self, campaign_id: int) -> Campaign:
        """Get a single campaign by ID."""
        stmt = select(Campaign).where(Campaign.id == campaign_id)
        result = await self.db.execute(stmt)
        campaign = result.scalar_one_or_none()
        if not campaign:
            raise ResourceNotFoundException(message=f"Campaign {campaign_id} not found")
        return campaign

    _CREATABLE_FIELDS = {"title", "description", "goal_amount", "start_date", "end_date", "status", "cover_image"}

    @audit_action(action="create_campaign", resource_type="campaign")
    async def create_campaign(self, data: Dict[str, Any]) -> Campaign:
        """Create a new campaign and invalidate cache."""
        try:
            safe = {k: v for k, v in data.items() if k in self._CREATABLE_FIELDS}
            campaign = Campaign(**safe)
            self.db.add(campaign)
            await self.db.flush()
            await self.db.refresh(campaign, ["created_at"])
            # Invalidate listing caches
            await invalidate_cache("campaigns:")
            return campaign
        except Exception as e:
            logger.error("Error creating campaign: %s", e)
            raise ServiceUnavailableException()

    _UPDATABLE_FIELDS = {"title", "description", "goal_amount", "start_date", "end_date", "status", "cover_image"}

    @audit_action(action="update_campaign", resource_type="campaign")
    async def update_campaign(self, campaign_id: int, data: Dict[str, Any]) -> Campaign:
        """Update a campaign and invalidate cache."""
        campaign = await self.get_campaign_by_id(campaign_id)
        for k, v in data.items():
            if k in self._UPDATABLE_FIELDS:
                setattr(campaign, k, v)
        await self.db.flush()
        await self.db.refresh(campaign, ["created_at"])
        # Invalidate listing caches
        await invalidate_cache("campaigns:")
        return campaign

    @audit_action(action="delete_campaign", resource_type="campaign")
    async def delete_campaign(self, campaign_id: int):
        """Delete a campaign and invalidate cache."""
        campaign = await self.get_campaign_by_id(campaign_id)
        await self.db.delete(campaign)
        await self.db.flush()
        # Invalidate listing caches
        await invalidate_cache("campaigns:")
