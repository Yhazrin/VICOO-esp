from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class ImpactFundEntryOut(BaseModel):
    id: int
    order_id: int
    order_item_id: Optional[int] = None
    product_id: int
    artwork_id: Optional[int] = None
    child_participant_id: Optional[int] = None
    beneficiary_type: str
    beneficiary_name: Optional[str] = None
    sale_amount: Decimal
    donation_percentage: Decimal
    allocated_amount: Decimal
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
