import enum

from sqlalchemy import Column, Integer, String, DateTime, Text, DECIMAL, Enum, ForeignKey, Boolean, JSON, func
from app.database import Base


class ProductCategory(str, enum.Enum):
    APPAREL = "apparel"
    ACCESSORIES = "accessories"
    STATIONERY = "stationery"
    PRINTS = "prints"
    LIFESTYLE = "lifestyle"
    FOOTWEAR = "footwear"
    HOME = "home"
    GIFT_BOX = "gift_box"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(300), nullable=False)
    name_en = Column(String(300), nullable=True)
    description = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
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
    # Impact / public welfare fields
    is_impact_product = Column(Boolean, default=False, nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True, index=True)
    donation_percentage = Column(DECIMAL(5, 2), nullable=True)
    # Artwork linkage — connects product to the original children's artwork
    artwork_id = Column(Integer, ForeignKey("artworks.id"), nullable=True, index=True)
    origin_country_id = Column(Integer, ForeignKey("countries.id"), nullable=True, index=True)
    origin_region_id = Column(Integer, ForeignKey("regions.id"), nullable=True, index=True)
    trace_story_title = Column(String(300), nullable=True)
    trace_story_content = Column(Text, nullable=True)
    trace_story_title_en = Column(String(300), nullable=True)
    trace_story_content_en = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
