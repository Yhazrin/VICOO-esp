import logging
from typing import Optional, Tuple, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.design_draft import DesignDraft
from app.models.artwork import Artwork
from app.models.product import Product
from app.services.base import BaseService
from app.core.audit import audit_action

logger = logging.getLogger("vicoo.design_draft")


class DesignDraftService(BaseService):
    """Service for managing AI-assisted design drafts from artworks."""

    @audit_action(action="create_design_draft", resource_type="design_draft")
    async def create_draft(self, artwork_id: int, user_id: int, data: dict) -> DesignDraft:
        """Create a new design draft from an artwork."""
        # Verify artwork exists
        stmt = select(Artwork).where(Artwork.id == artwork_id)
        artwork = (await self.db.execute(stmt)).scalar_one_or_none()
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")

        draft = DesignDraft(
            artwork_id=artwork_id,
            created_by_user_id=user_id,
            title=data.get("title", artwork.title),
            description=data.get("description"),
            target_category=data.get("target_category"),
            original_artwork_url=artwork.image_url,
            status="draft",
        )
        self.db.add(draft)
        await self.db.flush()
        return draft

    @audit_action(action="generate_design", resource_type="design_draft")
    async def generate_design(self, draft_id: int) -> DesignDraft:
        """Generate AI design from draft (mock: sets prompt and status)."""
        draft = await self._get_draft(draft_id)

        if draft.status not in ("draft", "rejected"):
            raise HTTPException(status_code=400, detail="Draft is not in a generatable state")

        # Mock AI generation — in production this would call an AI image service
        prompt = (
            f"Create a commercial product design for '{draft.target_category or 'apparel'}' "
            f"inspired by the artwork '{draft.title}'. "
            f"Style: vibrant, child-friendly, welfare aesthetic."
        )

        draft.prompt_used = prompt
        draft.design_image_url = f"/static/designs/draft_{draft.id}.jpg"
        draft.status = "ai_generated"
        await self.db.flush()
        return draft

    @audit_action(action="approve_design_draft", resource_type="design_draft")
    async def approve_draft(self, draft_id: int, review_note: Optional[str] = None) -> DesignDraft:
        """Approve a draft for publishing."""
        draft = await self._get_draft(draft_id)
        if draft.status not in ("ai_generated", "review"):
            raise HTTPException(status_code=400, detail="Draft is not in a reviewable state")
        draft.status = "approved"
        if review_note:
            draft.review_note = review_note
        await self.db.flush()
        return draft

    @audit_action(action="reject_design_draft", resource_type="design_draft")
    async def reject_draft(self, draft_id: int, review_note: Optional[str] = None) -> DesignDraft:
        """Reject a draft."""
        draft = await self._get_draft(draft_id)
        draft.status = "rejected"
        if review_note:
            draft.review_note = review_note
        await self.db.flush()
        return draft

    @audit_action(action="publish_design_as_product", resource_type="design_draft")
    async def publish_as_product(self, draft_id: int, product_data: dict) -> Product:
        """Create a Product from an approved design draft."""
        draft = await self._get_draft(draft_id)
        if draft.status != "approved":
            raise HTTPException(status_code=400, detail="Draft must be approved before publishing")

        product = Product(
            name=product_data.get("name", draft.title),
            description=product_data.get("description", draft.description),
            price=product_data["price"],
            currency=product_data.get("currency", "CNY"),
            image_url=draft.design_image_url,
            category=draft.target_category or product_data.get("category"),
            stock=product_data.get("stock", 0),
            status="active",
            is_impact_product=True,
            artwork_id=draft.artwork_id,
        )
        self.db.add(product)
        await self.db.flush()

        draft.product_id = product.id
        draft.status = "published"
        await self.db.flush()
        return product

    async def get_draft(self, draft_id: int) -> DesignDraft:
        return await self._get_draft(draft_id)

    async def list_drafts(
        self,
        status: Optional[str] = None,
        artwork_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[DesignDraft], int]:
        count_stmt = select(func.count(DesignDraft.id))
        if status:
            count_stmt = count_stmt.where(DesignDraft.status == status)
        if artwork_id:
            count_stmt = count_stmt.where(DesignDraft.artwork_id == artwork_id)
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = select(DesignDraft)
        if status:
            stmt = stmt.where(DesignDraft.status == status)
        if artwork_id:
            stmt = stmt.where(DesignDraft.artwork_id == artwork_id)
        stmt = stmt.order_by(DesignDraft.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(stmt)).scalars().all()
        return rows, total

    async def _get_draft(self, draft_id: int) -> DesignDraft:
        stmt = select(DesignDraft).where(DesignDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()
        if not draft:
            raise HTTPException(status_code=404, detail="Design draft not found")
        return draft
