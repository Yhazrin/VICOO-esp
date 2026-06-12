"""Polymorphic attachments owned by any user-submittable record (intake, after-sale).

The ``owner_type`` column discriminates which parent table the row belongs to
(``clothing_intake`` or ``after_sale_ticket``); ``owner_id`` is the FK into that
table. We intentionally do not declare SQL FKs into the owners — the same row
shape serves many parents, and we enforce ownership via the API layer plus the
``(owner_type, owner_id)`` composite index. The ``url`` is the relative path
returned by ``/api/v1/uploads/image`` (always served under ``/static/...``).
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    BigInteger,
    Index,
    ForeignKey,
    func,
)
from app.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    owner_type = Column(String(40), nullable=False)
    owner_id = Column(Integer, nullable=False)
    url = Column(String(500), nullable=False)
    mime = Column(String(100), nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    original_name = Column(String(255), nullable=True)
    uploader_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_attachments_owner", "owner_type", "owner_id"),
    )
