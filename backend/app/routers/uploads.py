"""User-facing media upload endpoint.

Mirrors ``supply_chain.upload_trace_media`` but requires only an authenticated
user (any role) and writes to ``static/uploads/intake/yyyy/mm/dd/`` so that
clothing intake / after-sale attachments stay segregated from admin-managed
traceability media.
"""

import logging
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.deps import get_current_user
from app.schemas import ApiResponse

router = APIRouter(prefix="/uploads", tags=["Uploads"])
logger = logging.getLogger(__name__)

_STATIC_ROOT = Path(__file__).resolve().parent.parent.parent / "static"
_MAX_USER_UPLOAD = 10 * 1024 * 1024
_ALLOWED_USER_IMAGES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


@router.post("/image", response_model=ApiResponse)
async def upload_user_image(
    file: UploadFile = File(...),
    _current_user: dict = Depends(get_current_user),
):
    """Upload an image for a user-submitted record (intake, after-sale).

    Returns the relative URL — callers must pass the returned value to the
    creating endpoint (e.g. ``POST /clothing-intakes``) as part of
    ``image_urls``. The server does not create attachment rows on its own;
    that happens when the parent record is created, which keeps file uploads
    and the parent write atomic.
    """
    body = await file.read()
    if len(body) > _MAX_USER_UPLOAD:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")
    ct = (file.content_type or "").split(";")[0].strip().lower()
    ext = _ALLOWED_USER_IMAGES.get(ct)
    if not ext:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type; use jpeg/png/webp/gif",
        )

    today = datetime.utcnow()
    day_dir = _STATIC_ROOT / "uploads" / "intake" / f"{today.year:04d}" / f"{today.month:02d}" / f"{today.day:02d}"
    day_dir.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    path = day_dir / name
    path.write_bytes(body)

    url = f"/static/uploads/intake/{today.year:04d}/{today.month:02d}/{today.day:02d}/{name}"
    return ApiResponse(data={"url": url, "mime": ct, "size_bytes": len(body)})
