from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class SupplyChainRecordCreate(BaseModel):
    product_id: int = Field(..., description="Associated product ID")
    stage: str = Field(
        ...,
        pattern="^(material_sourcing|processing|manufacturing|quality_check|shipping)$",
        description="Supply chain stage: material_sourcing, processing, manufacturing, quality_check, shipping",
    )
    description: Optional[str] = Field(None, description="Stage description and details")
    location: Optional[str] = Field(None, max_length=300, description="Geographic location of this stage")
    certified: bool = Field(False, description="Whether this stage has certification")
    cert_image_url: Optional[str] = Field(None, max_length=500, description="Certification document image URL")
    timestamp: Optional[datetime] = Field(None, description="Actual date/time of this stage")


class SupplyChainRecordUpdate(BaseModel):
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=300)
    certified: Optional[bool] = None
    cert_image_url: Optional[str] = Field(None, max_length=500)
    timestamp: Optional[datetime] = None


class SupplyChainRecordOut(BaseModel):
    id: int
    product_id: int
    stage: str
    description: Optional[str] = None
    location: Optional[str] = None
    certified: bool
    cert_image_url: Optional[str] = None
    timestamp: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SupplyChainTrace(BaseModel):
    """Full supply chain trace for a product."""
    product_id: int
    product_name: str
    records: List[SupplyChainRecordOut] = []
