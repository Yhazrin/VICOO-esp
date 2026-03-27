from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, DECIMAL, func
from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    goal_amount = Column(DECIMAL(12, 2), nullable=False)
    current_amount = Column(DECIMAL(12, 2), default=0, nullable=False)
    status = Column(
        Enum("draft", "active", "completed", "cancelled", name="campaign_status"),
        default="draft",
        nullable=False,
    )
    participant_count = Column(Integer, default=0, nullable=False)
    artwork_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
