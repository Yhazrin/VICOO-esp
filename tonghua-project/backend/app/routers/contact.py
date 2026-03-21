from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

from app.schemas import ApiResponse
from app.deps import require_role

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactForm(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(..., min_length=5, max_length=255)
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=10, max_length=5000)


_mock_messages: list[dict] = []


@router.post("", response_model=ApiResponse, status_code=201)
async def submit_contact_form(body: ContactForm):
    """Submit a contact form message."""
    new_msg = {
        "id": len(_mock_messages) + 1,
        **body.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "status": "unread",
    }
    _mock_messages.append(new_msg)
    return ApiResponse(data={"id": new_msg["id"], "message": "Contact form submitted successfully"})


@router.get("/messages", response_model=ApiResponse)
async def list_contact_messages(_admin: dict = Depends(require_role("admin"))):
    """List all contact form messages (admin only in production)."""
    return ApiResponse(data=_mock_messages)
