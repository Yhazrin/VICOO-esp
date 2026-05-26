from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DesignDraftCreate(BaseModel):
    artwork_id: int
    title: str
    description: Optional[str] = None
    target_category: Optional[str] = None


class DesignDraftUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_category: Optional[str] = None
    design_image_url: Optional[str] = None
    prompt_used: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(draft|ai_generated|review|approved|rejected|published)$")
    review_note: Optional[str] = None


class DesignDraftOut(BaseModel):
    id: int
    artwork_id: int
    product_id: Optional[int] = None
    created_by_user_id: int
    title: str
    description: Optional[str] = None
    target_category: Optional[str] = None
    original_artwork_url: Optional[str] = None
    design_image_url: Optional[str] = None
    prompt_used: Optional[str] = None
    status: str
    review_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
