from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(1, ge=1, le=99)
    selected_size: Optional[str] = Field(None, max_length=20)
    selected_color: Optional[str] = Field(None, max_length=50)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, le=99)


class CartItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CartSyncRequest(BaseModel):
    """Client sends local cart items; server merges with existing."""
    items: list[CartItemIn]


class CartOut(BaseModel):
    items: list[CartItemOut]
