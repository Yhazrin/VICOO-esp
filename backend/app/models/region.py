from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from app.database import Base


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False, index=True)
    name_zh = Column(String(120), nullable=False)
    name_en = Column(String(120), nullable=False)
    region_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
