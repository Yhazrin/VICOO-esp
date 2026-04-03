from sqlalchemy import Column, Integer, String, DateTime, Text, DECIMAL, Enum, ForeignKey, Boolean, func
from app.database import Base


class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    donor_name = Column(String(100), nullable=False)
    donor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    amount = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(Enum("CNY", "USD", name="donation_currency"), default="CNY", nullable=False)
    payment_method = Column(
        Enum("wechat", "alipay", "stripe", "paypal", name="payment_method"), nullable=False
    )
    payment_id = Column(String(200), nullable=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True, index=True)
    status = Column(
        Enum("pending", "completed", "failed", "refunded", name="donation_status"),
        default="pending",
        nullable=False,
        index=True,
    )
    is_anonymous = Column(Boolean, default=False, nullable=False)
    message = Column(Text, nullable=True)
    certificate_no = Column(String(100), unique=True, nullable=True, index=True)
    certificate_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
