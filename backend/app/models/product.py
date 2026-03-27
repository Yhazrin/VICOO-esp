from sqlalchemy import Column, Integer, String, DateTime, Text, DECIMAL, Enum, ForeignKey, JSON, func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(String(10), default="CNY", nullable=False)
    image_url = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    stock = Column(Integer, default=0, nullable=False)
    status = Column(
        Enum("active", "inactive", "sold_out", name="product_status"),
        default="active",
        nullable=False,
    )
    # Circular commerce: sustainability fields
    source_clothing_intake_id = Column(Integer, ForeignKey("clothing_intakes.id"), nullable=True, index=True)
    sustainability_score = Column(DECIMAL(3, 2), nullable=True)
    sustainability_details = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
