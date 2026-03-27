from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ArtworkCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300, description="Artwork title")
    description: Optional[str] = Field(None, description="Artwork description")
    image_url: str = Field(..., max_length=500, description="Full-size image URL")
    thumbnail_url: Optional[str] = Field(None, max_length=500, description="Thumbnail image URL")
    child_participant_id: Optional[int] = Field(None, description="Associated child participant ID")
    artist_name: str = Field(..., min_length=1, max_length=100, description="Artist display name")
    campaign_id: Optional[int] = Field(None, description="Associated campaign ID")


class ArtworkUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = None
    image_url: Optional[str] = Field(None, max_length=500)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, pattern="^(draft|pending|approved|rejected|featured)$")


class ArtworkStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|pending|approved|rejected|featured)$", description="New moderation status")


class ArtworkListItem(BaseModel):
    id: int
    title: str
    thumbnail_url: Optional[str] = None
    artist_name: str
    status: str
    vote_count: int = Field(alias="like_count")
    view_count: int
    campaign_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class ChildParticipantForArtwork(BaseModel):
    """Child participant data for artwork (frontend-compatible format)"""
    id: str
    firstName: str
    age: int
    guardianId: Optional[str] = None
    schoolName: Optional[str] = None
    consentGiven: bool
    consentDate: Optional[str] = None
    status: Optional[str] = None

    model_config = {"from_attributes": True, "populate_by_name": True}


class ArtworkOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    image_url: str
    thumbnail_url: Optional[str] = None
    child_participant_id: Optional[int] = None
    childParticipant: Optional[ChildParticipantForArtwork] = None
    artist_name: str
    status: str
    vote_count: int = Field(alias="like_count")
    view_count: int
    campaign_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}
