from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DesignDraftCreate(BaseModel):
    artwork_id: int
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    target_category: Optional[str] = Field(None, max_length=100)


class DesignDraftUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    target_category: Optional[str] = Field(None, max_length=100)
    design_image_url: Optional[str] = Field(None, max_length=500)
    prompt_used: Optional[str] = Field(None, max_length=5000)
    status: Optional[str] = Field(None, pattern=r"^(draft|ai_generated|review|approved|rejected|published)$")
    review_note: Optional[str] = Field(None, max_length=2000)


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
