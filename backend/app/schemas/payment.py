from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, model_validator


class PaymentCreate(BaseModel):
    """P2: Mutual exclusion between order_id and donation_id enforced via validator."""
    order_id: Optional[int] = Field(None, description="Order ID for product payments")
    donation_id: Optional[int] = Field(None, description="Donation ID for donation payments")
    amount: Decimal = Field(..., gt=0, le=1000000, description="Payment amount in CNY")
    method: str = Field(..., pattern="^(wechat|alipay|stripe|paypal)$", description="Payment method")

    @model_validator(mode="after")
    def check_mutual_exclusion(self) -> "PaymentCreate":
        """Ensure order_id and donation_id are mutually exclusive."""
        if self.order_id is not None and self.donation_id is not None:
            raise ValueError("order_id and donation_id cannot both be set; choose one or neither")
        if self.order_id is None and self.donation_id is None:
            raise ValueError("Either order_id or donation_id must be provided")
        return self


class PaymentCallback(BaseModel):
    """Schema for payment provider callback data."""
    transaction_id: str = Field(..., max_length=200, description="Provider transaction ID")
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


class MockPayConfirmBody(BaseModel):
    token: str = Field(..., min_length=10, description="Signed token from order create response")


class MockPayPreviewOut(BaseModel):
    order_no: str
    total_amount: str
    status: str
    payment_method: Optional[str] = None


class MockPayConfirmOut(BaseModel):
    order_no: str
    status: str
    already_paid: bool = False


class MockDonationPayPreviewOut(BaseModel):
    donation_id: int
    amount: str
    status: str
    payment_method: Optional[str] = None
    campaign_id: Optional[int] = None


class MockDonationPayConfirmOut(BaseModel):
    donation_id: int
    status: str
    already_paid: bool = False
