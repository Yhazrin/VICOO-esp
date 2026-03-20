from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field, EmailStr

T = TypeVar("T")


# ── Generic API wrappers ──────────────────────────────────────────
class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T] = []
    total: int = 0
    page: int = 1
    page_size: int = 20


# ── Auth ──────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    wechat_code: Optional[str] = Field(None, alias="code")

    model_config = {"populate_by_name": True}


class RegisterRequest(BaseModel):
    email: str
    password: str
    nickname: str
    phone: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Audit / Admin ─────────────────────────────────────────────────
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    resource: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class DashboardMetrics(BaseModel):
    total_users: int
    total_artworks: int
    total_campaigns: int
    total_donations: int
    total_donation_amount: str
    total_products: int
    total_orders: int
    active_campaigns: int


class SettingsUpdate(BaseModel):
    settings: Dict[str, Any] = Field(..., description="Key-value settings to update")
