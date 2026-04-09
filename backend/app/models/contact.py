from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, func
from app.database import Base


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum("unread", "read", "replied", name="contact_status"), default="unread", nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
