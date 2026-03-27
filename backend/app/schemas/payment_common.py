"""Common payment schemas shared between orders and donations."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class WeChatPaymentParams(BaseModel):
    """WeChat Pay parameters for wx.requestPayment."""

    timeStamp: str
    nonceStr: str
    package: str
    signType: str = "MD5"
    paySign: str
    transactionId: Optional[str] = None  # WeChat prepay_id for verification
    order_no: Optional[str] = None
    donation_id: Optional[int] = None
    amount: str
    description: Optional[str] = None
