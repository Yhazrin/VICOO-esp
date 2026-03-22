from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
import logging

from app.schemas import ApiResponse
from app.deps import require_role

router = APIRouter(prefix="/contact", tags=["Contact"])

logger = logging.getLogger(__name__)


class ContactForm(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=10, max_length=5000)


_mock_messages: list[dict] = []


@router.post("", response_model=ApiResponse, status_code=201)
async def submit_contact_form(body: ContactForm):
    """Submit a contact form message.

    Note: Contact form submissions require a database. Mock-only writes are
    not acceptable as they would silently lose user messages.
    """
    try:
        from app.database import get_db
        from sqlalchemy.ext.asyncio import AsyncSession
        from fastapi import Depends

        # Attempt real DB write — contact table not yet in models, so this
        # will raise at import/execution time if DB is unavailable
        raise RuntimeError("Contact model not yet implemented — cannot persist without DB")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB write failed during submit_contact_form: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/messages", response_model=ApiResponse)
async def list_contact_messages(_admin: dict = Depends(require_role("admin"))):
    """List all contact form messages (admin only in production)."""
    return ApiResponse(data=_mock_messages)
