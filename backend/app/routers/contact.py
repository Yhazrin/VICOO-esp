from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import time
import logging

from app.database import get_db
from app.models.contact import ContactMessage
from app.schemas import ApiResponse, PaginatedResponse
from app.schemas.contact import ContactMessageOut
from app.deps import require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact"])

# Simple per-IP rate limiter for contact form submissions
_contact_rate_limit: dict[str, float] = {}
_CONTACT_RATE_WINDOW = 60  # seconds
_CONTACT_RATE_MAX = 5  # max submissions per window


def _evict_expired_entries(now: float) -> None:
    """Remove expired rate limit entries to prevent unbounded memory growth."""
    cutoff = now - _CONTACT_RATE_WINDOW
    expired = [k for k, v in _contact_rate_limit.items() if not k.endswith("_count") and v < cutoff]
    for k in expired:
        _contact_rate_limit.pop(k, None)
        _contact_rate_limit.pop(f"{k}_count", None)


class ContactForm(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=5, max_length=5000)


@router.post("", response_model=ApiResponse, status_code=201)
async def submit_contact_form(body: ContactForm, request: Request, db: AsyncSession = Depends(get_db)):
    """Submit a contact form message."""
    # Per-IP rate limiting
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    _evict_expired_entries(now)
    window_start = _contact_rate_limit.get(client_ip, 0)
    if now - window_start < _CONTACT_RATE_WINDOW:
        # Same window — count submissions
        count_key = f"{client_ip}_count"
        count = _contact_rate_limit.get(count_key, 0) + 1
        if count > _CONTACT_RATE_MAX:
            raise HTTPException(status_code=429, detail="Too many contact form submissions. Please try again later.")
        _contact_rate_limit[count_key] = count
    else:
        # New window
        _contact_rate_limit[client_ip] = now
        _contact_rate_limit[f"{client_ip}_count"] = 1

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
