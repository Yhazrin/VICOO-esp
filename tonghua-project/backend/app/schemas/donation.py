from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class DonationCreate(BaseModel):
    donor_name: str = Field(..., min_length=1, max_length=100, description="Donor display name")
    amount: Decimal = Field(..., gt=0, le=1000000, description="Donation amount in CNY")
    currency: str = Field("CNY", pattern="^(CNY|USD)$", description="Currency code")
    payment_method: str = Field(..., pattern="^(wechat|alipay|stripe|paypal)$", description="Payment method")
    campaign_id: Optional[int] = Field(None, description="Target campaign ID")
    is_anonymous: bool = Field(False, description="Hide donor name from public listing")
    message: Optional[str] = Field(None, max_length=500, description="Donation message")


class DonationListItem(BaseModel):
    id: int
    donor_name: str
    amount: Decimal
    currency: str
    payment_method: str
    campaign_id: Optional[int] = None
    status: str
    is_anonymous: bool
    message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DonationOut(BaseModel):
    id: int
    donor_name: str
    donor_user_id: Optional[int] = None
    amount: Decimal
    currency: str
    payment_method: str
    payment_id: Optional[str] = None
    campaign_id: Optional[int] = None
    status: str
    is_anonymous: bool
    message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
