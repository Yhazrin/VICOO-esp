from decimal import Decimal
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, DECIMAL, func, Index
from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"
    __table_args__ = (
        Index("ix_campaigns_status", "status"),
        Index("ix_campaigns_start_date", "start_date"),
        Index("ix_campaigns_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    subtitle = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    goal_amount = Column(DECIMAL(12, 2), nullable=False)
    current_amount = Column(DECIMAL(12, 2), default=Decimal("0.00"), nullable=False)
    status = Column(
        Enum("draft", "active", "completed", "cancelled", name="campaign_status"),
        default="draft",
        nullable=False,
    )
    participant_count = Column(Integer, default=0, nullable=False)
    artwork_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    # Sustainability loop fields
    sustainability_eyebrow = Column(String(200), nullable=True)
    sustainability_title = Column(String(300), nullable=True)
    sustainability_subtitle = Column(Text, nullable=True)
    sustainability_p1_title = Column(String(200), nullable=True)
    sustainability_p1_body = Column(Text, nullable=True)
    sustainability_p2_title = Column(String(200), nullable=True)
    sustainability_p2_body = Column(Text, nullable=True)
    sustainability_p3_title = Column(String(200), nullable=True)
    sustainability_p3_body = Column(Text, nullable=True)
    sustainability_p4_title = Column(String(200), nullable=True)
    sustainability_p4_body = Column(Text, nullable=True)
    sustainability_footnote = Column(Text, nullable=True)
    sustainability_cta_traceability = Column(String(100), nullable=True)
    sustainability_cta_shop = Column(String(100), nullable=True)
