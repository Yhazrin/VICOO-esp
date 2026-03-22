from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
import time

from app.schemas import ApiResponse
from app.deps import require_role

router = APIRouter(prefix="/contact", tags=["Contact"])

# Simple per-IP rate limiter for contact form submissions
_contact_rate_limit: dict[str, float] = {}
_CONTACT_RATE_WINDOW = 60  # seconds
_CONTACT_RATE_MAX = 5  # max submissions per window


class ContactForm(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=10, max_length=5000)


_mock_messages: list[dict] = []


@router.post("", response_model=ApiResponse, status_code=201)
async def submit_contact_form(body: ContactForm, request: Request):
    """Submit a contact form message."""
    # Per-IP rate limiting
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
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
