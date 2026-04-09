from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AddressCreate(BaseModel):
    label: Optional[str] = Field(None, max_length=50, description="Address label, e.g. Home/Office")
    recipient_name: str = Field(..., max_length=100, description="Recipient name")
    phone: str = Field(..., max_length=30, description="Phone number")
    province: str = Field(..., max_length=50, description="Province/State")
    city: str = Field(..., max_length=50, description="City")
    district: Optional[str] = Field(None, max_length=50, description="District")
    detail_address: str = Field(..., description="Detailed address")
    postal_code: Optional[str] = Field(None, max_length=20, description="Postal code")
    is_default: bool = Field(False, description="Set as default address")


class AddressUpdate(BaseModel):
    label: Optional[str] = Field(None, max_length=50)
    recipient_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)
    province: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=50)
    district: Optional[str] = Field(None, max_length=50)
    detail_address: Optional[str] = None
    postal_code: Optional[str] = Field(None, max_length=20)
    is_default: Optional[bool] = None


class AddressOut(BaseModel):
    id: int
    user_id: int
    label: Optional[str] = None
    recipient_name: str
    phone: str
    province: str
    city: str
    district: Optional[str] = None
    detail_address: str
    postal_code: Optional[str] = None
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
