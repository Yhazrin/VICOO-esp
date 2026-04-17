from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class ContactFormCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=10, max_length=5000)


class ContactMessageOut(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}
