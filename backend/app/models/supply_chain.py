from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Enum, ForeignKey, func
from app.database import Base


class SupplyChainRecord(Base):
    __tablename__ = "supply_chain_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    stage = Column(
        Enum(
            "material_sourcing",
            "processing",
            "manufacturing",
            "quality_check",
            "shipping",
            name="supply_chain_stage",
        ),
        nullable=False,
    )
    description = Column(Text, nullable=True)
    location = Column(String(300), nullable=True)
    certified = Column(Boolean, default=False, nullable=False)
    cert_image_url = Column(String(500), nullable=True)
    timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
