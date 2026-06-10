from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class AddressCreate(BaseModel):
    label: Optional[str] = Field(None, max_length=50, description="Address label, e.g. Home/Office")
    recipient_name: str = Field(..., max_length=100, description="Recipient name")
    phone: str = Field(..., max_length=30, description="Phone number")
    province: str = Field(..., max_length=50, description="Province/State")
    city: str = Field(..., max_length=50, description="City")
    district: Optional[str] = Field(None, max_length=50, description="District")
    detail_address: str = Field(..., max_length=500, description="Detailed address")
    postal_code: Optional[str] = Field(None, max_length=20, description="Postal code")
    # P1: Country field for international support
    country: Optional[str] = Field(None, max_length=100, description="Country")
    country_code: Optional[str] = Field(None, max_length=10, description="Country code (ISO 3166-1 alpha-2)")
    is_default: bool = Field(False, description="Set as default address")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """P1: Validate Chinese mobile phone format or international format."""
        import re
        # Chinese format: 1[3-9]\d{9} or International format: +[1-9]\d{1,14}
        chinese_pattern = r"^1[3-9]\d{9}$"
        international_pattern = r"^\+?[1-9]\d{1,14}$"
        if re.match(chinese_pattern, v) or re.match(international_pattern, v):
            return v
        raise ValueError("Invalid phone format. Use Chinese format (1[3-9]XXXXXXXXX) or international format (+[country code][number])")

    @field_validator("postal_code")
    @classmethod
    def validate_postal_code(cls, v: Optional[str]) -> Optional[str]:
        """P2: Validate postal code format (China: 6 digits)."""
        if v is None:
            return v
        import re
        # China: 6 digits, International: alphanumeric up to 10 chars
        if re.match(r"^\d{6}$", v):
            return v
        if re.match(r"^[A-Za-z0-9]{1,10}$", v):
            return v
        raise ValueError("Invalid postal code. Use 6 digits for China, or up to 10 alphanumeric characters for other countries")


class AddressUpdate(BaseModel):
    label: Optional[str] = Field(None, max_length=50)
    recipient_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)
    province: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=50)
    district: Optional[str] = Field(None, max_length=50)
    detail_address: Optional[str] = Field(None, max_length=500)
    postal_code: Optional[str] = Field(None, max_length=20)
    # P1: Country field for international support
    country: Optional[str] = Field(None, max_length=100)
    country_code: Optional[str] = Field(None, max_length=10)
    is_default: Optional[bool] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """P1: Validate phone format if provided."""
        if v is None:
            return v
        import re
        chinese_pattern = r"^1[3-9]\d{9}$"
        international_pattern = r"^\+?[1-9]\d{1,14}$"
        if re.match(chinese_pattern, v) or re.match(international_pattern, v):
            return v
        raise ValueError("Invalid phone format")

    @field_validator("postal_code")
    @classmethod
    def validate_postal_code(cls, v: Optional[str]) -> Optional[str]:
        """P2: Validate postal code format if provided."""
        if v is None:
            return v
        import re
        if re.match(r"^\d{6}$", v):
            return v
        if re.match(r"^[A-Za-z0-9]{1,10}$", v):
            return v
        raise ValueError("Invalid postal code format")


class AddressOut(BaseModel):
    id: int
    user_id: int
    label: Optional[str] = None
    recipient_name: str
    phone: str
    province: str
    city: str
    district: Optional[str] = None
    detail_address: str
    postal_code: Optional[str] = None
    # P1: Country field for international support
    country: Optional[str] = None
    country_code: Optional[str] = None
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
