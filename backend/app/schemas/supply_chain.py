from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, Field


class TraceMediaItem(BaseModel):
    """Single image or video attached to a traceability node (URLs to CDN/static)."""

    type: Literal["image", "video"] = "image"
    url: str = Field(..., max_length=800)
    caption: Optional[str] = Field(None, max_length=300)


def parse_gallery_json(raw: Optional[str]) -> List[TraceMediaItem]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        if not isinstance(data, list):
            return []
        return [TraceMediaItem.model_validate(x) for x in data]
    except Exception:
        return []


class SupplyChainRecordCreate(BaseModel):
    product_id: int = Field(..., description="Associated product ID")
    stage: str = Field(
        ...,
        pattern="^(material_sourcing|processing|manufacturing|quality_check|shipping)$",
        description="Supply chain stage: material_sourcing, processing, manufacturing, quality_check, shipping",
    )
    description: Optional[str] = Field(None, description="Stage description and details")
    description_en: Optional[str] = Field(None, description="English stage description and details")
    location: Optional[str] = Field(None, max_length=300, description="Geographic location of this stage")
    location_en: Optional[str] = Field(None, max_length=300, description="English geographic location of this stage")
    certified: bool = Field(False, description="Whether this stage has certification")
    cert_image_url: Optional[str] = Field(None, max_length=500, description="Certification document image URL")
    carbon_kg: Optional[Decimal] = None
    carbon_note: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = Field(None, description="WGS84 latitude in degrees")
    longitude: Optional[float] = Field(None, description="WGS84 longitude in degrees")
    timestamp: Optional[datetime] = Field(None, description="Actual date/time of this stage")
    gallery: Optional[List[TraceMediaItem]] = Field(
        None,
        description="Optional gallery of images/videos (URLs) for this trace point",
    )


class SupplyChainRecordUpdate(BaseModel):
    stage: Optional[str] = Field(
        None,
        pattern="^(material_sourcing|processing|manufacturing|quality_check|shipping)$",
    )
    description: Optional[str] = None
    description_en: Optional[str] = None
    location: Optional[str] = Field(None, max_length=300)
    location_en: Optional[str] = Field(None, max_length=300)
    certified: Optional[bool] = None
    cert_image_url: Optional[str] = Field(None, max_length=500)
    carbon_kg: Optional[Decimal] = None
    carbon_note: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: Optional[datetime] = None
    gallery: Optional[List[TraceMediaItem]] = Field(
        None,
        description="Replace entire gallery when set (empty list clears)",
    )


class SupplyChainRecordOut(BaseModel):
    id: int
    product_id: int
    stage: str
    description: Optional[str] = None
    description_en: Optional[str] = None
    location: Optional[str] = None
    location_en: Optional[str] = None
    certified: bool
    cert_image_url: Optional[str] = None
    carbon_kg: Optional[Decimal] = None
    carbon_note: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: Optional[datetime] = None
    created_at: datetime
    gallery: List[TraceMediaItem] = []

    model_config = {"from_attributes": False}


def supply_chain_record_to_out(r: Any) -> SupplyChainRecordOut:
    """Build API output from ORM row (includes parsed gallery)."""
    stage_val = getattr(r.stage, "value", None) or str(r.stage)
    return SupplyChainRecordOut(
        id=r.id,
        product_id=r.product_id,
        stage=stage_val,
        description=r.description,
        description_en=getattr(r, "description_en", None),
        location=r.location,
        location_en=getattr(r, "location_en", None),
        certified=bool(r.certified),
        cert_image_url=r.cert_image_url,
        carbon_kg=r.carbon_kg,
        carbon_note=r.carbon_note,
        latitude=r.latitude,
        longitude=r.longitude,
        timestamp=r.timestamp,
        created_at=r.created_at,
        gallery=parse_gallery_json(r.gallery_json),
    )


class SupplyChainTrace(BaseModel):
    """Full supply chain trace for a product."""

    product_id: int
    product_name: str
    records: List[SupplyChainRecordOut] = []
