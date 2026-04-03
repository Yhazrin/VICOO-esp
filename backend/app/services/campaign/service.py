import logging
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import select, func
from app.models.campaign import Campaign
from app.services.base import BaseService
from app.utils.cache import cached, invalidate_cache
from app.core.errors import ResourceNotFoundException, ServiceUnavailableException

logger = logging.getLogger("vicoo.campaign_service")

class CampaignService(BaseService):
    """
    Service for managing public welfare campaigns.
    Implements Redis caching for high-traffic listing endpoints.
    """

    @cached(prefix="campaigns:list", ttl=600)
    async def list_campaigns(
        self, 
        page: int = 1, 
        page_size: int = 20, 
        status: Optional[str] = None
    ) -> Tuple[List[Campaign], int]:
        """List campaigns with pagination and caching."""
        try:
            stmt = select(Campaign)
            if status:
                stmt = stmt.where(Campaign.status == status)
            
            # Count total
            count_stmt = select(func.count(Campaign.id))
            if status:
                count_stmt = count_stmt.where(Campaign.status == status)
            total = (await self.db.execute(count_stmt)).scalar() or 0
            
            # Get items
            stmt = stmt.offset((page - 1) * page_size).limit(page_size)
            result = await self.db.execute(stmt)
            campaigns = result.scalars().all()
            
            return campaigns, total
        except Exception as e:
            logger.error(f"Error in list_campaigns: {e}")
            raise ServiceUnavailableException(message="Database query failed")

    @cached(prefix="campaigns:active", ttl=300)
    async def get_active_campaign(self) -> Campaign:
        """Get the latest active campaign."""
        stmt = select(Campaign).where(Campaign.status == "active").order_by(Campaign.created_at.desc())
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

    async def create_campaign(self, data: Dict[str, Any]) -> Campaign:
        """Create a new campaign and invalidate cache."""
        try:
            campaign = Campaign(**data)
            self.db.add(campaign)
            await self.db.flush()
            # Invalidate listing caches
            await invalidate_cache("campaigns:")
            return campaign
        except Exception as e:
            logger.error(f"Error creating campaign: {e}")
            raise ServiceUnavailableException()

    async def update_campaign(self, campaign_id: int, data: Dict[str, Any]) -> Campaign:
        """Update a campaign and invalidate cache."""
        campaign = await self.get_campaign_by_id(campaign_id)
        for k, v in data.items():
            setattr(campaign, k, v)
        await self.db.flush()
        # Invalidate listing caches
        await invalidate_cache("campaigns:")
        return campaign

    async def delete_campaign(self, campaign_id: int):
        """Delete a campaign and invalidate cache."""
        campaign = await self.get_campaign_by_id(campaign_id)
        await self.db.delete(campaign)
        await self.db.flush()
        # Invalidate listing caches
        await invalidate_cache("campaigns:")
