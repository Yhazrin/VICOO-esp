from sqlalchemy import Column, Integer, String, DateTime, Text, DECIMAL, Enum, ForeignKey, func
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
    )
    shipping_address = Column(Text, nullable=True)
    payment_method = Column(String(50), nullable=True)
    payment_id = Column(String(200), nullable=True)
    carrier = Column(String(100), nullable=True)
    tracking_number = Column(String(120), nullable=True, index=True)
    logistics_events = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    price = Column(DECIMAL(12, 2), nullable=False)
