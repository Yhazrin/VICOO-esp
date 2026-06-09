from sqlalchemy import Column, Integer, String, DateTime, Text, DECIMAL, Enum, ForeignKey, func, Index
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    total_amount = Column(DECIMAL(12, 2), nullable=False)
    status = Column(
        Enum("pending", "paid", "shipped", "completed", "cancelled", name="order_status"),
        default="pending",
        nullable=False,
        index=True,
    )
    shipping_address = Column(Text, nullable=True)
    payment_method = Column(String(50), nullable=True)
    payment_id = Column(String(200), nullable=True)
    carrier = Column(String(100), nullable=True)
    tracking_number = Column(String(120), nullable=True, index=True)
    logistics_events = Column(Text, nullable=True)
    # P1: Idempotency key to prevent duplicate orders
    idempotency_key = Column(String(100), nullable=True, index=True)
    # P1: Structured shipping address fields for international support
    recipient_name = Column(String(100), nullable=True)
    recipient_phone = Column(String(30), nullable=True)
    province = Column(String(50), nullable=True)
    city = Column(String(50), nullable=True)
    district = Column(String(50), nullable=True)
    detail_address = Column(Text, nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    country_code = Column(String(10), nullable=True)
    # Dual confirmation: only mark completed when both user AND admin have confirmed
    user_confirmed_at = Column(DateTime, nullable=True, comment="User clicked 'Confirm Receipt' timestamp")
    admin_delivered_at = Column(DateTime, nullable=True, comment="Admin clicked 'Confirm Delivery' timestamp")
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Composite index for idempotency lookups
    __table_args__ = (
        Index("ix_orders_user_idempotency", "user_id", "idempotency_key"),
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    price = Column(DECIMAL(12, 2), nullable=False)
