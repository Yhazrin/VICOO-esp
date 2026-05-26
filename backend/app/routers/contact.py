from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import time
import logging

from app.database import get_db
from app.config import settings
from app.models.contact import ContactMessage
from app.schemas import ApiResponse, PaginatedResponse
from app.schemas.contact import ContactMessageOut
from app.deps import require_role, get_redis_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact"])

_CONTACT_RATE_WINDOW = 60  # seconds
_CONTACT_RATE_MAX = 5  # max submissions per window


class ContactForm(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=5, max_length=5000)


@router.post("", response_model=ApiResponse, status_code=201)
async def submit_contact_form(body: ContactForm, request: Request, db: AsyncSession = Depends(get_db)):
    """Submit a contact form message."""
    # Per-IP rate limiting via Redis (shared across all workers)
    client_ip = request.client.host if request.client else "unknown"
    try:
        redis = await get_redis_client()
        rate_key = f"rate_limit:contact:{client_ip}"
        count = await redis.incr(rate_key)
        if count == 1:
            await redis.expire(rate_key, _CONTACT_RATE_WINDOW)
        if count > _CONTACT_RATE_MAX:
            raise HTTPException(status_code=429, detail="Too many contact form submissions. Please try again later.")
    except HTTPException:
        raise
    except Exception as e:
        if settings.APP_ENV == "production":
            logger.error(f"Redis rate limit check failed in production, rejecting request: {e}")
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        logger.warning(f"Redis rate limit check failed for contact form, allowing request: {e}")

    try:
        msg = ContactMessage(
            name=body.name,
            email=body.email,
            subject=body.subject,
            message=body.message,
        )
        db.add(msg)
        await db.flush()
        return ApiResponse(data={"id": msg.id, "message": "Contact form submitted successfully"})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to submit contact form")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/messages", response_model=PaginatedResponse)
async def list_contact_messages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin")),
):
    """List all contact form messages (admin only, paginated)."""
    try:
        count_stmt = select(func.count(ContactMessage.id))
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = (
            select(ContactMessage)
            .order_by(ContactMessage.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(stmt)
        messages = result.scalars().all()
        return PaginatedResponse(
            data=[ContactMessageOut.model_validate(m).model_dump() for m in messages],
            total=total,
            page=page,
            page_size=page_size,
        )
    except Exception as e:
        logger.exception("Failed to list contact messages")
        raise HTTPException(status_code=500, detail="Internal server error")
