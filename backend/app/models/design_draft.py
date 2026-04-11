from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, func
from app.database import Base


class DesignDraft(Base):
    __tablename__ = "design_drafts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    artwork_id = Column(Integer, ForeignKey("artworks.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    target_category = Column(String(100), nullable=True)

    original_artwork_url = Column(String(500), nullable=True)
    design_image_url = Column(String(500), nullable=True)
    prompt_used = Column(Text, nullable=True)

    status = Column(
        Enum("draft", "ai_generated", "review", "approved", "rejected", "published", name="design_draft_status"),
        default="draft",
        nullable=False,
        index=True,
    )
    review_note = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
