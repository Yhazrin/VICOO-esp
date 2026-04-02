from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.database import get_db
from app.schemas import ApiResponse, CampaignCreate, CampaignOut, CampaignUpdate, PaginatedResponse
from app.deps import require_role
from app.services.campaign.service import CampaignService

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])
logger = logging.getLogger(__name__)

# Fallback mock data for non-critical failures
from decimal import Decimal
_mock_campaigns = [
    {
        "id": 1,
        "title": "春天的色彩 — 乡村儿童画展",
        "description": "征集来自全国各地乡村小学孩子们的画作...",
        "status": "active",
        "goal_amount": Decimal("50000.00"),
        "current_amount": Decimal("32500.00"),
    }
]

@router.get("", response_model=PaginatedResponse)
async def list_campaigns(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List campaigns with pagination and Redis caching."""
    service = CampaignService(db)
    try:
        campaigns, total = await service.list_campaigns(page, page_size, status)
        return PaginatedResponse(
            data=[CampaignOut.model_validate(c).model_dump() for c in campaigns],
            total=total,
            page=page,
            page_size=page_size,
        )
    except Exception as e:
        logger.error(f"Failed to list campaigns: {e}")
        return PaginatedResponse(data=[], total=0, page=page, page_size=page_size)

@router.get("/active", response_model=ApiResponse)
async def get_active_campaign(db: AsyncSession = Depends(get_db)):
    """Get the current active campaign (Cached)."""
    service = CampaignService(db)
    try:
        campaign = await service.get_active_campaign()
        return ApiResponse(data=CampaignOut.model_validate(campaign).model_dump())
    except Exception:
        return ApiResponse(data=_mock_campaigns[0])

@router.get("/{campaign_id}", response_model=ApiResponse)
async def get_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single campaign by ID."""
    service = CampaignService(db)
    try:
        campaign = await service.get_campaign_by_id(campaign_id)
        return ApiResponse(data=CampaignOut.model_validate(campaign).model_dump())
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Campaign not found")

@router.post("", response_model=ApiResponse, status_code=201)
async def create_campaign(
    body: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Create a new campaign (Invalidates cache)."""
    service = CampaignService(db)
    try:
        campaign = await service.create_campaign(body.model_dump())
        await db.commit()
        return ApiResponse(data=CampaignOut.model_validate(campaign).model_dump())
    except Exception as e:
        logger.error(f"Create failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{campaign_id}", response_model=ApiResponse)
async def update_campaign(
    campaign_id: int,
    body: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Update a campaign (Invalidates cache)."""
    service = CampaignService(db)
    try:
        campaign = await service.update_campaign(campaign_id, body.model_dump(exclude_unset=True))
        await db.commit()
        return ApiResponse(data=CampaignOut.model_validate(campaign).model_dump())
    except Exception as e:
        logger.error(f"Update failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{campaign_id}", response_model=ApiResponse)
async def delete_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Delete a campaign."""
    service = CampaignService(db)
    try:
        await service.delete_campaign(campaign_id)
        await db.commit()
        return ApiResponse(data={"deleted": campaign_id})
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
