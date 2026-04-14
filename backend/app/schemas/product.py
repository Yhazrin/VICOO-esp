from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=300, description="Product name")
    description: Optional[str] = Field(None, description="Product description")
    price: Decimal = Field(..., gt=0, description="Price in CNY")
    currency: str = Field("CNY", description="Currency code")
    image_url: Optional[str] = Field(None, max_length=500, description="Product image URL")
    category: Optional[str] = Field(None, max_length=100, description="Product category. Valid values: apparel, accessories, stationery, prints, lifestyle, footwear, home, gift_box")
    stock: int = Field(0, ge=0, description="Available stock quantity")
    is_impact_product: bool = Field(False, description="Whether this product belongs to the impact/charity shop")
    campaign_id: Optional[int] = Field(None, description="Linked campaign ID for impact products")
    donation_percentage: Optional[Decimal] = Field(None, ge=0, le=100, description="Percentage of sale price donated")
    artwork_id: Optional[int] = Field(None, description="Linked original artwork ID")


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    image_url: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=100, description="Product category. Valid values: apparel, accessories, stationery, prints, lifestyle, footwear, home, gift_box")
    stock: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern="^(active|inactive|sold_out)$")
    is_impact_product: Optional[bool] = None
    campaign_id: Optional[int] = None
    donation_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    artwork_id: Optional[int] = None


class ProductListItem(BaseModel):
    id: int
    name: str
    price: Decimal
    currency: str
    image_url: Optional[str] = None
    category: Optional[str] = None
    stock: int
    status: str

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    currency: str
    image_url: Optional[str] = None
    category: Optional[str] = None
    stock: int
    status: str
    # Circular commerce: sustainability fields
    source_clothing_intake_id: Optional[int] = None
    sustainability_score: Optional[float] = None
    sustainability_details: Optional[dict] = None
    # Impact / public welfare fields
    is_impact_product: bool = False
    campaign_id: Optional[int] = None
    donation_percentage: Optional[float] = None
    artwork_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
