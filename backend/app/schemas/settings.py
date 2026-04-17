from pydantic import BaseModel
from datetime import datetime
from typing import Any


class SettingsOut(BaseModel):
    key: str
    value: Any = None
    updated_at: datetime
    model_config = {"from_attributes": True}


class SettingsBulkUpdate(BaseModel):
    settings: dict[str, Any]
