from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CampaignCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300, description="Campaign title")
    description: Optional[str] = Field(None, description="Campaign description (supports rich text)")
    cover_image: Optional[str] = Field(None, max_length=500, description="Cover image URL")
    start_date: datetime = Field(..., description="Campaign start date")
    end_date: datetime = Field(..., description="Campaign end date")
    goal_amount: Decimal = Field(..., gt=0, description="Fundraising goal in CNY")


class CampaignUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = None
    cover_image: Optional[str] = Field(None, max_length=500)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    goal_amount: Optional[Decimal] = Field(None, gt=0)
    status: Optional[str] = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: object) -> Optional[str]:
        """Admin UI uses ended/archived; DB + API use completed/cancelled."""
        if v is None or v == "":
            return None
        if not isinstance(v, str):
            raise ValueError("status must be a string")
        key = v.strip().lower()
        aliases = {"ended": "completed", "archived": "cancelled"}
        normalized = aliases.get(key, key)
        allowed = frozenset({"draft", "active", "completed", "cancelled"})
        if normalized not in allowed:
            raise ValueError(f"Invalid status: {v!r}")
        return normalized


class CampaignListItem(BaseModel):
    id: int
    title: str
    cover_image: Optional[str] = None
    start_date: datetime
    end_date: datetime
    goal_amount: Decimal
    current_amount: Decimal
    status: str
    participant_count: int
    artwork_count: int

    model_config = {"from_attributes": True}


class CampaignOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    start_date: datetime
    end_date: datetime
    goal_amount: Decimal
    current_amount: Decimal
    status: str
    participant_count: int
    artwork_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
