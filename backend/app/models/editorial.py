from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, func
from app.database import Base


class EditorialArticle(Base):
    __tablename__ = "editorial_articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    excerpt = Column(Text, nullable=True)
    pull_quote = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)
    author = Column(String(100), nullable=True)
    published_at = Column(DateTime, nullable=True, index=True)
    read_time_minutes = Column(Integer, nullable=True)
    category = Column(Enum("impact", "fashion", "community", "education", name="editorial_category"), default="impact", nullable=False)
    status = Column(Enum("draft", "published", "archived", name="editorial_status"), default="draft", nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
