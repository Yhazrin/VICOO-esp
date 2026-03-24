"""闭环电商扩展：衣物捐献受理、商品评价、售后工单。"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    Enum,
    ForeignKey,
    UniqueConstraint,
    func,
)
from app.database import Base


class ClothingIntake(Base):
    """用户衣物捐献登记 → 运营分拣 → 上架为再生商品。"""

    __tablename__ = "clothing_intakes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    summary = Column(String(500), nullable=False)
    garment_types = Column(String(300), nullable=True)
    quantity_estimate = Column(Integer, default=1, nullable=False)
    condition_notes = Column(Text, nullable=True)
    pickup_address = Column(Text, nullable=True)
    contact_phone = Column(String(30), nullable=True)
    status = Column(
        Enum(
            "submitted",
            "received",
            "processing",
            "listed",
            "rejected",
            name="clothing_intake_status",
        ),
        default="submitted",
        nullable=False,
        index=True,
    )
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    admin_note = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class ProductReview(Base):
    __tablename__ = "product_reviews"

    __table_args__ = (UniqueConstraint("product_id", "user_id", name="uq_review_product_user"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    rating = Column(Integer, nullable=False)
    title = Column(String(200), nullable=True)
    body = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class AfterSaleTicket(Base):
    __tablename__ = "after_sale_tickets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    category = Column(
        Enum("return", "exchange", "quality", "logistics", "other", name="after_sale_category"),
        nullable=False,
    )
    status = Column(
        Enum("open", "in_progress", "resolved", "closed", name="after_sale_status"),
        default="open",
        nullable=False,
        index=True,
    )
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
