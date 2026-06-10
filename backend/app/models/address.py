from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, func
from app.database import Base


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    label = Column(String(50), nullable=True)  # e.g. "Home", "Office", "Default"
    recipient_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    province = Column(String(50), nullable=False)
    city = Column(String(50), nullable=False)
    district = Column(String(50), nullable=True)
    detail_address = Column(Text, nullable=False)
    postal_code = Column(String(20), nullable=True)
    # P1: Country fields for international support
    country = Column(String(100), nullable=True)
    country_code = Column(String(10), nullable=True)
    is_default = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
