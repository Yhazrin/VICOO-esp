from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    child_participant_id = Column(Integer, ForeignKey("child_participants.id"), nullable=True, index=True)
    artist_name = Column(String(100), nullable=False)
    status = Column(
        Enum("draft", "pending", "approved", "rejected", "featured", name="artwork_status"),
        default="draft",
        nullable=False,
    )
    like_count = Column(Integer, default=0, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    child_participant = relationship(
        "ChildParticipant",
        back_populates="artworks",
        lazy="joined",
        uselist=False
    )
