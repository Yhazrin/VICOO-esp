from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.database import get_db
from app.models.editorial import EditorialArticle
from app.schemas import ApiResponse
from app.schemas.editorial import EditorialArticleOut, EditorialArticleCreate
from app.deps import require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/editorial", tags=["Editorial"])


@router.get("/feed", response_model=ApiResponse)
async def get_editorial_feed(limit: int = Query(10, ge=1, le=20), db: AsyncSession = Depends(get_db)):
    """Lightweight editorial feed for Stories page integration."""
    safe_limit = limit
    result = await db.execute(
        select(EditorialArticle)
        .where(EditorialArticle.status == "published")
        .order_by(EditorialArticle.published_at.desc())
        .limit(safe_limit)
    )
    articles = result.scalars().all()
    items = [EditorialArticleOut.model_validate(a).model_dump() for a in articles]
    return ApiResponse(data={"items": items, "total": len(items)})


@router.post("", response_model=ApiResponse, status_code=201)
async def create_editorial_article(
    body: EditorialArticleCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin", "editor")),
):
    """Create a new editorial article (admin/editor only)."""
    try:
        from datetime import datetime, timezone
        article = EditorialArticle(
            title=body.title,
            excerpt=body.excerpt,
            pull_quote=body.pull_quote,
            cover_image=body.cover_image,
            author=body.author,
            read_time_minutes=body.read_time_minutes,
            category=body.category,
            status="published",
            published_at=datetime.now(timezone.utc),
        )
        db.add(article)
        await db.flush()
        return ApiResponse(data=EditorialArticleOut.model_validate(article).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create editorial article")
        raise HTTPException(status_code=500, detail="Internal server error")
