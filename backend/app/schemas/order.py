from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., description="Product ID to order")
    quantity: int = Field(1, ge=1, le=999, description="Quantity to order")
    price: Optional[Decimal] = Field(None, gt=0, description="Unit price (ignored - server uses database price for security)")


class OrderCreate(BaseModel):
    shipping_address: Optional[str] = Field(None, max_length=500, description="Delivery address")
    address_id: Optional[int] = Field(None, description="Saved address ID (alternative to shipping_address)")
    payment_method: Optional[str] = Field(None, pattern="^(wechat|alipay|stripe|paypal)$", description="Payment method")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order line items")


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    quantity: int
    price: Decimal

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|paid|shipped|completed|cancelled)$", description="New order status")


class OrderListItem(BaseModel):
    id: int
    user_id: int
    order_no: str
    total_amount: Decimal
    status: str
    payment_method: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LogisticsEvent(BaseModel):
    at: str
    status: str
    description: Optional[str] = None
    location: Optional[str] = None


class OrderLogisticsUpdate(BaseModel):
    carrier: Optional[str] = Field(None, max_length=100)
    tracking_number: Optional[str] = Field(None, max_length=120)
    new_event: Optional[LogisticsEvent] = None


class OrderOut(BaseModel):
    id: int
    user_id: int
    order_no: str
    total_amount: Decimal
    status: str
    shipping_address: Optional[str] = None
    payment_method: Optional[str] = None
    payment_id: Optional[str] = None
    items: List[OrderItemOut] = []
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    logistics_events: List[Any] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReturnRequestItem(BaseModel):
    order_item_id: int = Field(..., description="Order item ID to return")
    quantity: int = Field(1, ge=1, description="Quantity to return")


class ReturnRequestCreate(BaseModel):
    type: str = Field(..., pattern="^(return|exchange)$", description="Return or exchange")
    items: List[ReturnRequestItem] = Field(..., min_length=1, description="Items to return")
    reason: Optional[str] = Field(None, max_length=1000, description="Reason for return/exchange")
    exchange_product_id: Optional[int] = Field(None, description="Product ID for exchange")
    exchange_size: Optional[str] = Field(None, max_length=20, description="New size for exchange")
    exchange_color: Optional[str] = Field(None, max_length=50, description="New color for exchange")
