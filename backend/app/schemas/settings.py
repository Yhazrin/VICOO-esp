from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Any, Optional


class SettingsOut(BaseModel):
    key: str
    value: Any = None
    updated_at: datetime
    model_config = {"from_attributes": True}


_ALLOWED_SETTING_KEYS = frozenset({
    "site_name", "site_tagline", "contact_email", "donation_enabled",
    "shop_enabled", "registration_enabled", "maintenance_mode", "payment_methods",
})


class SettingsBulkUpdate(BaseModel):
    settings: dict[str, Any]

    @field_validator("settings")
    @classmethod
    def restrict_keys(cls, v: dict[str, Any]) -> dict[str, Any]:
        unknown = set(v.keys()) - _ALLOWED_SETTING_KEYS
        if unknown:
            raise ValueError(f"Unknown setting keys: {', '.join(sorted(unknown))}")
        return v
