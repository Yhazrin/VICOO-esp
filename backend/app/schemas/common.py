from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

import re

from pydantic import BaseModel, Field, EmailStr, model_validator

T = TypeVar("T")

# bcrypt (passlib CryptContext) silently truncates input at 72 bytes. Allowing
# longer passwords invites two password strings that share a 72-byte prefix to
# hash to the same value. We reject anything > 72 bytes at the schema layer so
# the user gets a clear validation error instead of an alias collision later.
_PASSWORD_MAX_BYTES = 72

# Permissive phone: optional leading +, then 7-20 chars of digits / spaces / hyphens.
_PHONE_PATTERN = re.compile(r"^\+?[\d\s-]{7,20}$")


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
    pageSize: int = 20

    @model_validator(mode="after")
    def sync_page_size_alias(self):
        # Keep both snake_case and camelCase for backward compatibility.
        self.pageSize = self.page_size
        return self


# ── Auth ──────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    wechat_code: Optional[str] = Field(None, alias="code")

    model_config = {"populate_by_name": True}


class RegisterRequest(BaseModel):
    email: EmailStr
    # bcrypt hard limit is 72 bytes — see _PASSWORD_MAX_BYTES comment above.
    password: str = Field(
        ...,
        min_length=8,
        max_length=_PASSWORD_MAX_BYTES,
        description="Password (8–72 bytes; bcrypt truncates beyond that)",
    )
    nickname: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)

    @model_validator(mode="after")
    def _validate_password_not_whitespace(self):
        # Reject passwords made entirely of whitespace (e.g. "        ") —
        # they pass `min_length=8` but provide no security.
        if self.password and not self.password.strip():
            raise ValueError("password must contain non-whitespace characters")
        return self

    @model_validator(mode="after")
    def _validate_nickname(self):
        if self.nickname and not self.nickname.strip():
            raise ValueError("nickname must contain non-whitespace characters")
        return self

    @model_validator(mode="after")
    def _validate_phone(self):
        if self.phone is None or self.phone == "":
            return self
        if not _PHONE_PATTERN.match(self.phone):
            raise ValueError("phone must be 7–20 digits (optional leading +, spaces and hyphens allowed)")
        return self


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    # Permissive: the test/dev suite uses `@vicoo.test` and other reserved
    # TLDs that EmailStr rejects. We only need a sanity check (an @, length
    # bounds) — the user lookup will tell us if the email is real.
    email: str = Field(..., min_length=3, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ResetVerifyOtpRequest(BaseModel):
    token: str = Field(..., min_length=10, max_length=200)
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class ResetConfirmRequest(BaseModel):
    token: str = Field(..., min_length=10, max_length=200)
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(..., min_length=8, max_length=128)


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
    user_agent: Optional[str] = None
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
    total_clothing_donations: int = 0
    pending_after_sales: int = 0


class SettingsUpdate(BaseModel):
    site_name: Optional[str] = Field(None, max_length=200)
    site_tagline: Optional[str] = Field(None, max_length=500)
    contact_email: Optional[str] = Field(None, max_length=200)
    donation_enabled: Optional[bool] = None
    shop_enabled: Optional[bool] = None
    registration_enabled: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
    payment_methods: Optional[Dict[str, Any]] = None


class VerifyAccessRequest(BaseModel):
    access_code: str = Field(..., min_length=1, max_length=200, alias="accessCode")

    model_config = {"populate_by_name": True}
