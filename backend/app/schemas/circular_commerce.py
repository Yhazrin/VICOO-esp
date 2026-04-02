from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class ClothingIntakeCreate(BaseModel):
    summary: str = Field(..., min_length=1, max_length=500)
    garment_types: Optional[str] = Field(None, max_length=300)
    quantity_estimate: int = Field(1, ge=1, le=999)
    condition_notes: Optional[str] = None
    pickup_address: Optional[str] = Field(None, max_length=2000)
    contact_phone: Optional[str] = Field(None, max_length=30)


class ClothingIntakeStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        pattern="^(submitted|received|processing|listed|rejected)$",
    )
    admin_note: Optional[str] = None


class ClothingIntakeOut(BaseModel):
    id: int
    user_id: int
    summary: str
    garment_types: Optional[str] = None
    quantity_estimate: int
    condition_notes: Optional[str] = None
    pickup_address: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str
    product_id: Optional[int] = None
    admin_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PublishFromIntakeBody(BaseModel):
    """由衣物受理单生成上架商品（运营/编辑）。"""

    name: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    currency: str = Field("CNY", max_length=10)
    image_url: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=100)
    stock: int = Field(0, ge=0)


class ProductReviewCreate(BaseModel):
    product_id: int
    order_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    body: Optional[str] = None


class ProductReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    order_id: Optional[int] = None
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AfterSaleCreate(BaseModel):
    order_id: int
    category: str = Field(..., pattern="^(return|exchange|quality|logistics|other)$")
    subject: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class AfterSaleStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|in_progress|resolved|closed)$")


class AfterSaleOut(BaseModel):
    id: int
    user_id: int
    order_id: int
    category: str
    status: str
    subject: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AIChatMessage(BaseModel):
    role: str = Field(..., pattern="^(system|user|assistant)$")
    content: str = Field(..., min_length=1, max_length=16000)


class AIChatRequest(BaseModel):
    messages: list[AIChatMessage] = Field(..., min_length=1, max_length=30)
    context: Optional[str] = Field(
        None,
        description="可选业务上下文：donation / shop / logistics / sustainability",
        max_length=64,
    )


class AIChatResponse(BaseModel):
    reply: str
    model: str
    source: str = Field("openai", description="openai | stub")


class ArtworkAnalysisRequest(BaseModel):
    image_url: str = Field(..., max_length=500)
    description: Optional[str] = Field(None, max_length=2000)


class ArtworkAnalysisResponse(BaseModel):
    suggested_title: Optional[str] = None
    suggested_tags: list[str] = Field(default_factory=list)
    style_description: Optional[str] = None
    safety_rating: str = Field("safe", pattern="^(safe|borderline|unsafe)$")
    moderation_notes: Optional[str] = None


class ContentModerationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)


class ContentModerationResponse(BaseModel):
    is_safe: bool
    reason: Optional[str] = None
    flagged_categories: list[str] = Field(default_factory=list)
