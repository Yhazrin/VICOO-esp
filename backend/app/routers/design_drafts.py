import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import ApiResponse
from app.schemas.design_draft import DesignDraftCreate, DesignDraftUpdate, DesignDraftOut
from app.services.design_draft.service import DesignDraftService
from app.deps import get_current_user, require_role

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/design-drafts", tags=["Design Drafts"])


@router.get("", response_model=ApiResponse)
async def list_design_drafts(
    status: str | None = Query(None),
    artwork_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin", "editor")),
):
    """List all design drafts with optional filters."""
    try:
        service = DesignDraftService(db)
        drafts = await service.list_drafts(status=status, artwork_id=artwork_id)
        return ApiResponse(data=[DesignDraftOut.model_validate(d).model_dump() for d in drafts])
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list design drafts")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("", response_model=ApiResponse, status_code=201)
async def create_design_draft(
    body: DesignDraftCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new design draft from an artwork."""
    try:
        service = DesignDraftService(db)
        draft = await service.create_draft(body.artwork_id, current_user["id"], body.model_dump())
        return ApiResponse(data=DesignDraftOut.model_validate(draft).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Design draft operation failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{draft_id}", response_model=ApiResponse)
async def get_design_draft(
    draft_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin", "editor")),
):
    """Get a design draft by ID."""
    try:
        service = DesignDraftService(db)
        draft = await service.get_draft(draft_id)
        return ApiResponse(data=DesignDraftOut.model_validate(draft).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Design draft operation failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{draft_id}/generate", response_model=ApiResponse)
async def generate_design(
    draft_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin", "editor")),
):
    """Generate AI design from draft."""
    try:
        service = DesignDraftService(db)
        draft = await service.generate_design(draft_id)
        return ApiResponse(data=DesignDraftOut.model_validate(draft).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Design draft operation failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{draft_id}/approve", response_model=ApiResponse)
async def approve_design_draft(
    draft_id: int,
    body: DesignDraftUpdate | None = None,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin")),
):
    """Approve a design draft."""
    try:
        service = DesignDraftService(db)
        draft = await service.approve_draft(draft_id, review_note=body.review_note if body else None)
        return ApiResponse(data=DesignDraftOut.model_validate(draft).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Design draft operation failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{draft_id}/reject", response_model=ApiResponse)
async def reject_design_draft(
    draft_id: int,
    body: DesignDraftUpdate | None = None,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin")),
):
    """Reject a design draft."""
    try:
        service = DesignDraftService(db)
        draft = await service.reject_draft(draft_id, review_note=body.review_note if body else None)
        return ApiResponse(data=DesignDraftOut.model_validate(draft).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Design draft operation failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{draft_id}/publish", response_model=ApiResponse)
async def publish_design_draft(
    draft_id: int,
    body: dict | None = None,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin")),
):
    """Publish an approved design draft as a product."""
    try:
        service = DesignDraftService(db)
        product = await service.publish_as_product(draft_id, body or {})
        return ApiResponse(data={"product_id": product.id, "product_name": product.name})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Design draft operation failed")
        raise HTTPException(status_code=500, detail="Internal server error")
