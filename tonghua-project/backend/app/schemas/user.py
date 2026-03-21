from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 chars)")
    nickname: str = Field(..., min_length=1, max_length=100, description="Display nickname")
    phone: Optional[str] = Field(None, description="Phone number (will be encrypted at rest)")


class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20, description="Phone number (will be encrypted at rest)")


class UserOut(BaseModel):
    id: int
    email: str
    nickname: str
    avatar: Optional[str] = None
    role: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserOutSensitive(UserOut):
    phone: Optional[str] = Field(None, description="Decrypted phone number (admin only)")


class UserRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(admin|editor|user)$", description="New role for the user")


class UserStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|banned)$", description="New status for the user")


class ChildParticipantCreate(BaseModel):
    child_name: str = Field(..., min_length=1, max_length=100, description="Child's real name (encrypted)")
    display_name: str = Field(..., min_length=1, max_length=100, description="Public display name")
    age: int = Field(..., ge=1, le=17, description="Child's age (must be under 18)")
    guardian_name: str = Field(..., min_length=1, max_length=100, description="Guardian's name")
    guardian_phone: Optional[str] = Field(None, description="Guardian phone (encrypted)")
    guardian_email: Optional[str] = Field(None, description="Guardian email (encrypted)")
    region: Optional[str] = Field(None, max_length=200, description="Geographic region")
    school: Optional[str] = Field(None, max_length=200, description="School name")


class ChildParticipantUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    region: Optional[str] = Field(None, max_length=200)
    school: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field(None, pattern="^(active|withdrawn|pending_review)$")


class ChildParticipantOut(BaseModel):
    id: int
    child_name: str
    display_name: str
    age: int
    guardian_name: str
    region: Optional[str] = None
    school: Optional[str] = None
    consent_given: bool
    consent_date: Optional[datetime] = None
    artwork_count: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChildParticipantFrontend(BaseModel):
    """
    Frontend-compatible ChildParticipant schema.
    Matches frontend/web-react/src/types/index.ts ChildParticipant interface.
    """
    id: str  # Frontend expects string ID
    firstName: str  # Maps to display_name
    age: int
    guardianId: Optional[str] = None  # Not in backend model, optional for frontend
    schoolName: Optional[str] = None  # Maps to school
    consentGiven: bool  # Maps to consent_given
    consentDate: Optional[str] = None  # Maps to consent_date (ISO string)
    status: Optional[str] = None

    model_config = {"from_attributes": True, "populate_by_name": True}
