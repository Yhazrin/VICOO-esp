from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    order_id: Optional[int] = Field(None, description="Order ID for product payments")
    donation_id: Optional[int] = Field(None, description="Donation ID for donation payments")
    amount: Decimal = Field(..., gt=0, le=1000000, description="Payment amount in CNY")
    method: str = Field(..., pattern="^(wechat|alipay|stripe|paypal)$", description="Payment method")


class PaymentCallback(BaseModel):
    """Schema for payment provider callback data."""
    transaction_id: str = Field(..., description="Provider transaction ID")
    payment_id: Optional[int] = Field(None, description="Our payment record ID")
    status: str = Field(..., pattern="^(success|failed|refunded)$", description="Callback status")
    raw_data: Optional[Dict[str, Any]] = Field(None, description="Raw callback payload")


class PaymentListItem(BaseModel):
    id: int
    order_id: Optional[int] = None
    donation_id: Optional[int] = None
    amount: Decimal
    method: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentOut(BaseModel):
    id: int
    order_id: Optional[int] = None
    donation_id: Optional[int] = None
    amount: Decimal
    method: str
    provider_transaction_id: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
