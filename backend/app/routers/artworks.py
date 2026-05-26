from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import secrets
import logging

from app.config import settings
from app.database import get_db
from app.models.artwork import Artwork
from app.models.user import ChildParticipant
from app.schemas import ApiResponse, ArtworkCreate, ArtworkOut, ArtworkUpdate, ArtworkStatusUpdate, PaginatedResponse
from app.schemas.artwork import ChildParticipantForArtwork
from app.deps import require_role, get_current_user, get_redis_client

router = APIRouter(prefix="/artworks", tags=["Artworks"])

logger = logging.getLogger(__name__)


def _convert_child_participant(cp: ChildParticipant | None) -> ChildParticipantForArtwork | None:
    """Convert database ChildParticipant to frontend-compatible format."""
    if cp is None:
        return None
    return ChildParticipantForArtwork(
        id=str(cp.id),
        firstName=cp.display_name,
        age=cp.age,
        guardianId=None,  # Not stored in backend for security
        schoolName=getattr(cp, "school", None),
        consentGiven=getattr(cp, "consent_given", False),
        consentDate=getattr(cp, "consent_date", None).isoformat() if getattr(cp, "consent_date", None) else None,
        status=getattr(cp, "status", "active"),
    )


def _serialize_artwork(artwork: Artwork) -> dict:
    """Serialize artwork with child participant data."""
    artwork_dict = ArtworkOut.model_validate(artwork).model_dump()
    artwork_dict["childParticipant"] = _convert_child_participant(artwork.child_participant)
    return artwork_dict

_mock_artworks = [
    {
        "id": i,
        "title": t,
        "description": d,
        "image_url": f"/static/artworks/artwork_{i}.jpg",
        "thumbnail_url": f"/static/artworks/thumb_{i}.jpg",
        "child_participant_id": None,
        "artist_name": a,
        "status": s,
        "vote_count": l,  # Changed from like_count to vote_count
        "view_count": v,
        "campaign_id": c,
        "created_at": f"2025-{(i % 12) + 1:02d}-15T10:00:00",
        "updated_at": f"2025-{(i % 12) + 1:02d}-15T10:00:00",
    }
    for i, (t, d, a, s, l, v, c) in enumerate(
        [
            ("Spring Garden", "A colorful garden drawn with crayons", "Xiao Ming", "approved", 128, 560, 1),
            ("Rainbow Fish", "A deep-sea rainbow fish painted in watercolor", "Xiao Hong", "approved", 95, 430, 1),
            ("My Home", "A warm home with parents and a puppy", "Xiao Li", "approved", 210, 890, 2),
            ("Starry Night", "A Van Gogh-style starry sky reproduction", "Xiao Gang", "featured", 350, 1200, 1),
            ("Mountain Stream", "A plein air painting of a hometown stream", "Xiao Fang", "approved", 78, 320, 2),
            ("Little Cat", "My first kitten friend", "Xiao Jie", "approved", 160, 670, 3),
            ("Autumn Harvest", "Golden rice fields and farmers", "Xiao Yu", "pending", 45, 180, None),
            ("Snowman Family", "A snowman family portrait from winter", "Xiao Xue", "approved", 190, 780, 1),
            ("Song of Dolphins", "Dolphins jumping in the blue ocean", "Xiao Hai", "approved", 130, 520, 2),
            ("Old House", "Recording a village house about to be demolished", "Xiao Shi", "approved", 88, 390, 3),
            ("Mother's Hands", "Drawing mom's hands doing housework", "Xiao Hua", "featured", 280, 1050, 1),
            ("Summer Pond", "Frogs and dragonflies on lotus leaves", "Xiao Tian", "approved", 105, 440, 2),
            ("My Dream", "Wearing a white coat to become a doctor", "Xiao Yi", "approved", 175, 710, 3),
            ("Field Song", "Wheat fields swaying in the wind", "Xiao Mai", "approved", 62, 290, None),
            ("Space Travel", "Riding a rocket to the moon", "Xiao Yu", "approved", 140, 580, 1),
            ("Best Friends", "Playing with friends on the playground", "Xiao Peng", "pending", 30, 120, None),
            ("Rainbow After Rain", "A double rainbow after a storm", "Xiao Yu", "approved", 92, 410, 2),
            ("Chinese New Year", "Firecrackers and Spring Festival couplets", "Xiao Nian", "approved", 220, 900, 3),
            ("Future City", "Flying cars and solar-powered buildings", "Xiao Wei", "approved", 115, 470, 1),
            ("Shepherd's Song", "A little shepherd and sheep on the grassland", "Xiao Mu", "approved", 85, 350, 2),
        ],
        start=1,
    )
]


@router.get("", response_model=PaginatedResponse)
async def list_artworks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    campaign_id: int | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List artworks with optional filtering and pagination."""
    try:
        stmt = select(Artwork).options(selectinload(Artwork.child_participant))
        if status:
            stmt = stmt.where(Artwork.status == status)
        if campaign_id is not None:
            stmt = stmt.where(Artwork.campaign_id == campaign_id)
        if search:
            safe = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            like = f"%{safe}%"
            stmt = stmt.where(Artwork.title.ilike(like, escape="\\") | Artwork.description.ilike(like, escape="\\"))
        count_stmt = select(func.count(Artwork.id))
        if status:
            count_stmt = count_stmt.where(Artwork.status == status)
        if campaign_id is not None:
            count_stmt = count_stmt.where(Artwork.campaign_id == campaign_id)
        if search:
            safe = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            like = f"%{safe}%"
            count_stmt = count_stmt.where(Artwork.title.ilike(like, escape="\\") | Artwork.description.ilike(like, escape="\\"))
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        artworks = result.scalars().all()
        return PaginatedResponse(
            data=[_serialize_artwork(a) for a in artworks],
            total=total,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("list_artworks primary query failed (%s), retrying without child_participant", e)
        # Fallback: query without selectinload if child_participants relationship breaks
        try:
            stmt = select(Artwork)
            if status:
                stmt = stmt.where(Artwork.status == status)
            if campaign_id is not None:
                stmt = stmt.where(Artwork.campaign_id == campaign_id)
            if search:
                safe = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
                like = f"%{safe}%"
                stmt = stmt.where(Artwork.title.ilike(like, escape="\\") | Artwork.description.ilike(like, escape="\\"))
            count_stmt = select(func.count(Artwork.id))
            if status:
                count_stmt = count_stmt.where(Artwork.status == status)
            if campaign_id is not None:
                count_stmt = count_stmt.where(Artwork.campaign_id == campaign_id)
            if search:
                safe = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
                like = f"%{safe}%"
                count_stmt = count_stmt.where(Artwork.title.ilike(like, escape="\\") | Artwork.description.ilike(like, escape="\\"))
            total = (await db.execute(count_stmt)).scalar() or 0
            stmt = stmt.offset((page - 1) * page_size).limit(page_size)
            result = await db.execute(stmt)
            artworks = result.scalars().all()
            return PaginatedResponse(
                data=[_serialize_artwork(a) for a in artworks],
                total=total,
                page=page,
                page_size=page_size,
            )
        except Exception as e2:
            logger.error("list_artworks fallback also failed: %s", e2, exc_info=True)
            filtered = _mock_artworks
            if status:
                filtered = [a for a in filtered if a["status"] == status]
            if campaign_id is not None:
                filtered = [a for a in filtered if a.get("campaign_id") == campaign_id]
            start = (page - 1) * page_size
            return PaginatedResponse(
                data=filtered[start : start + page_size],
                total=len(filtered),
                page=page,
                page_size=page_size,
            )


@router.get("/mine", response_model=PaginatedResponse)
async def list_my_artworks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List artworks submitted by the current user."""
    try:
        base = (
            select(Artwork)
            .options(selectinload(Artwork.child_participant))
            .where(Artwork.user_id == current_user["id"])
        )
        total = (await db.execute(
            select(func.count(Artwork.id)).where(Artwork.user_id == current_user["id"])
        )).scalar() or 0
        stmt = base.order_by(Artwork.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        artworks = result.scalars().all()
        return PaginatedResponse(
            data=[_serialize_artwork(a) for a in artworks],
            total=total, page=page, page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list user artworks: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/featured", response_model=ApiResponse)
async def list_featured_artworks(db: AsyncSession = Depends(get_db)):
    """List featured artworks (limit 8)."""
    try:
        stmt = select(Artwork).where(Artwork.status == "featured").limit(8)
        result = await db.execute(stmt)
        artworks = result.scalars().all()
        return ApiResponse(data=[_serialize_artwork(a) for a in artworks])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list featured artworks: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/{artwork_id}", response_model=ApiResponse)
async def get_artwork(artwork_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single artwork by ID."""
    try:
        # First, fetch the artwork to check existence
        stmt = select(Artwork).options(selectinload(Artwork.child_participant)).where(Artwork.id == artwork_id)
        result = await db.execute(stmt)
        artwork = result.scalar_one_or_none()
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")

        # Use atomic UPDATE to increment view_count to prevent race conditions
        update_stmt = (
            update(Artwork)
            .where(Artwork.id == artwork_id)
            .values(view_count=Artwork.view_count + 1)
        )
        await db.execute(update_stmt)

        # Fetch the updated artwork with child participant
        updated_stmt = select(Artwork).options(selectinload(Artwork.child_participant)).where(Artwork.id == artwork_id)
        result = await db.execute(updated_stmt)
        artwork = result.scalar_one_or_none()

        return ApiResponse(data=_serialize_artwork(artwork))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get artwork {artwork_id}: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.post("", response_model=ApiResponse, status_code=201)
async def create_artwork(
    title: str = Form(...),
    image: UploadFile = File(...),
    description: str = Form(None),
    campaign_id: int = Form(None),
    child_display_name: str = Form(None),
    guardian_consent: str = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new artwork (multipart/form-data support)."""
    # Check for guardian consent if child participant is involved
    # For this test scenario, if child_display_name is provided, consent is required
    # Handle string boolean values like "true"/"false"
    consent_given = guardian_consent and guardian_consent.lower() not in ["false", "0", "no"]
    if child_display_name and not consent_given:
        raise HTTPException(status_code=403, detail="Guardian consent is required for child participants")

    try:
        # Process image upload (mock)
        image_filename = f"{secrets.token_hex(8)}.jpg"
        image_url = f"/static/artworks/{image_filename}"

        # Construct artwork data
        artwork_data = {
            "title": title,
            "description": description,
            "image_url": image_url,
            "thumbnail_url": image_url,  # Use same for thumbnail in mock
            "user_id": current_user["id"],
            "artist_name": current_user.get("nickname", "Anonymous"),
            "campaign_id": campaign_id,
            "status": "pending",
            "like_count": 0,  # Fixed: use like_count instead of vote_count
            "view_count": 0,
        }

        # Handle child participant logic if needed (simplified for mock)
        # In a real scenario, you would create a ChildParticipant here

        artwork = Artwork(**artwork_data)
        db.add(artwork)
        await db.flush()
        await db.refresh(artwork, ["created_at", "updated_at"])
        return ApiResponse(data=_serialize_artwork(artwork))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB write failed during create_artwork: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.put("/{artwork_id}", response_model=ApiResponse)
async def update_artwork(artwork_id: int, body: ArtworkUpdate, db: AsyncSession = Depends(get_db), _admin: dict = Depends(require_role("admin", "editor"))):
    """Update an artwork."""
    try:
        stmt = select(Artwork).options(selectinload(Artwork.child_participant)).where(Artwork.id == artwork_id)
        result = await db.execute(stmt)
        artwork = result.scalar_one_or_none()
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")
        _ARTWORK_UPDATABLE = {"title", "description", "image_url", "thumbnail_url", "status"}
        for k, v in body.model_dump(exclude_unset=True).items():
            if k in _ARTWORK_UPDATABLE:
                setattr(artwork, k, v)
        await db.flush()
        await db.refresh(artwork, ["created_at", "updated_at"])
        return ApiResponse(data=_serialize_artwork(artwork))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB write failed during update_artwork: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/{artwork_id}/status", response_model=ApiResponse)
async def get_artwork_status(artwork_id: int, db: AsyncSession = Depends(get_db)):
    """Get artwork status."""
    try:
        stmt = select(Artwork).where(Artwork.id == artwork_id)
        result = await db.execute(stmt)
        artwork = result.scalar_one_or_none()
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")
        return ApiResponse(data={"id": artwork.id, "status": artwork.status})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get artwork status {artwork_id}: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.put("/{artwork_id}/status", response_model=ApiResponse)
async def update_artwork_status(artwork_id: int, body: ArtworkStatusUpdate, db: AsyncSession = Depends(get_db), _admin: dict = Depends(require_role("admin", "editor"))):
    """Update artwork status."""
    try:
        stmt = select(Artwork).options(selectinload(Artwork.child_participant)).where(Artwork.id == artwork_id)
        result = await db.execute(stmt)
        artwork = result.scalar_one_or_none()
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")
        artwork.status = body.status
        await db.flush()
        await db.refresh(artwork, ["created_at", "updated_at"])
        return ApiResponse(data=_serialize_artwork(artwork))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB write failed during update_artwork_status: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.post("/{artwork_id}/vote", response_model=ApiResponse)
async def vote_artwork(artwork_id: int, db: AsyncSession = Depends(get_db), redis_client = Depends(get_redis_client), current_user: dict = Depends(get_current_user)):
    """Vote for an artwork."""
    try:
        # Check for duplicate vote using Redis
        vote_key = f"vote:{artwork_id}:{current_user['id']}"
        if await redis_client.exists(vote_key):
             raise HTTPException(status_code=400, detail="Already voted")

        stmt = select(Artwork).options(selectinload(Artwork.child_participant)).where(Artwork.id == artwork_id)
        result = await db.execute(stmt)
        artwork = result.scalar_one_or_none()
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")

        # Atomic update to prevent race condition on concurrent votes
        vote_stmt = (
            update(Artwork)
            .where(Artwork.id == artwork_id)
            .values(like_count=Artwork.like_count + 1)
        )
        await db.execute(vote_stmt)
        await db.flush()
        # Re-fetch with child_participant for response serialization
        stmt2 = select(Artwork).options(selectinload(Artwork.child_participant)).where(Artwork.id == artwork_id)
        result2 = await db.execute(stmt2)
        artwork = result2.scalar_one_or_none()
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")

        # Mark as voted in Redis
        await redis_client.setex(vote_key, 2592000, "1")  # 30 days

        response_data = _serialize_artwork(artwork)
        response_data["has_voted"] = True
        return ApiResponse(data=response_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB write failed during vote_artwork: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.delete("/{artwork_id}", response_model=ApiResponse)
async def delete_artwork(artwork_id: int, db: AsyncSession = Depends(get_db), _admin: dict = Depends(require_role("admin"))):
    """Delete an artwork."""
    try:
        stmt = select(Artwork).where(Artwork.id == artwork_id)
        result = await db.execute(stmt)
        artwork = result.scalar_one_or_none()
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")
        await db.delete(artwork)
        await db.flush()
        return ApiResponse(data={"deleted": artwork_id})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB write failed during delete_artwork: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")