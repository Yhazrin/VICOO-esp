from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class EditorialArticleOut(BaseModel):
    id: int
    title: str
    excerpt: Optional[str] = None
    pull_quote: Optional[str] = None
    cover_image: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    read_time_minutes: Optional[int] = None
    category: str
    status: str
    model_config = {"from_attributes": True}


class EditorialArticleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    excerpt: Optional[str] = None
    pull_quote: Optional[str] = None
    cover_image: Optional[str] = None
    author: Optional[str] = None
    read_time_minutes: Optional[int] = None
    category: str = "impact"
