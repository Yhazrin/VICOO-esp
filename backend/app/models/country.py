from sqlalchemy import Column, DateTime, Integer, String, func

from app.database import Base


class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(8), nullable=False, unique=True, index=True)
    name_zh = Column(String(100), nullable=False)
    name_en = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
