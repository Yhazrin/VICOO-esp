from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, Enum, JSON, ForeignKey, func
from app.database import Base


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=True, index=True)
    amount = Column(DECIMAL(12, 2), nullable=False)
    method = Column(
        Enum("wechat", "alipay", "stripe", "paypal", name="payment_method"), nullable=False
    )
    provider_transaction_id = Column(String(200), nullable=True)
    status = Column(
        Enum("pending", "success", "failed", "refunded", name="payment_status"),
        default="pending",
        nullable=False,
    )
    payment_url = Column(String(500), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    raw_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
