import logging
from typing import Optional, List, Dict, Any, Tuple

from fastapi import HTTPException
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.artwork import Artwork
from app.models.user import ChildParticipant
from app.services.base import BaseService
from app.core.audit import audit_action

logger = logging.getLogger("tonghua.artwork_service")

class ArtworkService(BaseService):
    """
    Service handling artwork submission, moderation, and voting.
    """

    async def list_artworks(
        self, 
        page: int = 1, 
        page_size: int = 20, 
        campaign_id: Optional[int] = None,
        status: str = "approved"
    ) -> Tuple[List[Artwork], int]:
        """
        List approved artworks with pagination.
        """
        stmt = select(Artwork).where(Artwork.status == status)
        if campaign_id:
            stmt = stmt.where(Artwork.campaign_id == campaign_id)
        
        total = (await self.db.execute(select(func.count()).select_from(stmt.subquery()))).scalar() or 0
        
        stmt = stmt.order_by(Artwork.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        return result.scalars().all(), total

    @audit_action(action="submit_artwork", resource_type="artwork")
    async def submit_artwork(self, child_id: int, artwork_data: Dict[str, Any]) -> Artwork:
        """
        Submit a new artwork for a child participant.
        """
        # Verify child exists and belongs to the guardian (caller's responsibility or check here)
        child_stmt = select(ChildParticipant).where(ChildParticipant.id == child_id)
        child = (await self.db.execute(child_stmt)).scalar_one_or_none()
        if not child:
            raise HTTPException(status_code=404, detail="Child participant not found")

        artwork = Artwork(
            title=artwork_data.get("title"),
            description=artwork_data.get("description"),
            image_url=artwork_data.get("image_url"),
            campaign_id=artwork_data.get("campaign_id"),
            child_participant_id=child_id,
            status="pending"
        )
        self.db.add(artwork)
        await self.db.flush()
        return artwork

    @audit_action(action="moderate_artwork", resource_type="artwork")
    async def moderate_artwork(self, artwork_id: int, new_status: str) -> Artwork:
        """
        Update artwork status (approved/rejected).
        """
        stmt = select(Artwork).where(Artwork.id == artwork_id)
        artwork = (await self.db.execute(stmt)).scalar_one_or_none()
        
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")

        old_status = artwork.status
        artwork.status = new_status
        
        # If approved for the first time, increment child's artwork count
        if new_status == "approved" and old_status != "approved":
            await self.db.execute(
                update(ChildParticipant)
                .where(ChildParticipant.id == artwork.child_participant_id)
                .values(artwork_count=ChildParticipant.artwork_count + 1)
            )
            
        await self.db.flush()
        return artwork

    @audit_action(action="vote_artwork", resource_type="artwork")
    async def vote_artwork(self, artwork_id: int, user_id: int) -> Artwork:
        """
        Register a vote for an artwork.
        """
        # Logic for duplicate vote prevention should be here (e.g. check a votes table)
        # For simplicity, we just increment the counter in this refactor
        stmt = select(Artwork).where(Artwork.id == artwork_id)
        artwork = (await self.db.execute(stmt)).scalar_one_or_none()
        
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")
        
        if artwork.status != "approved":
            raise HTTPException(status_code=400, detail="Can only vote for approved artworks")

        artwork.vote_count += 1
        await self.db.flush()
        return artwork
