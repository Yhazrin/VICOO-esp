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
    excerpt: Optional[str] = Field(None, max_length=2000)
    pull_quote: Optional[str] = Field(None, max_length=1000)
    cover_image: Optional[str] = Field(None, max_length=500)
    author: Optional[str] = Field(None, max_length=100)
    read_time_minutes: Optional[int] = None
    category: str = "impact"
