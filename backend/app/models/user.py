from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, Text, func
from sqlalchemy.orm import relationship
from app.database import Base
from app.security import aes_encrypt, aes_decrypt


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)  # Nullable for OAuth users
    nickname = Column(String(100), nullable=False, default="用户")
    avatar = Column(String(500), nullable=True)
    role = Column(Enum("admin", "editor", "user", name="user_role"), default="user", nullable=False)
    phone_encrypted = Column(Text, nullable=True)  # AES-256-GCM encrypted
    status = Column(Enum("active", "banned", name="user_status"), default="active", nullable=False)

    # OAuth — GitHub
    github_id = Column(String(128), unique=True, nullable=True, index=True)
    # OAuth — Google
    google_id = Column(String(128), unique=True, nullable=True, index=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class ChildParticipant(Base):
    __tablename__ = "child_participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    child_name = Column(Text, nullable=False)  # AES-256-GCM encrypted
    display_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    guardian_name = Column(Text, nullable=False)  # AES-256-GCM encrypted
    guardian_phone_encrypted = Column(Text, nullable=True)  # AES-256-GCM encrypted
    guardian_email_encrypted = Column(Text, nullable=True)  # AES-256-GCM encrypted
    region = Column(String(200), nullable=True)
    school = Column(String(200), nullable=True)
    consent_given = Column(Boolean, default=False, nullable=False)
    consent_date = Column(DateTime, nullable=True)
    artwork_count = Column(Integer, default=0, nullable=False)
    status = Column(
        Enum("active", "withdrawn", "pending_review", name="child_status"),
        default="pending_review",
        nullable=False,
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    artworks = relationship("Artwork", back_populates="child_participant", lazy="dynamic")

    @property
    def child_name_decrypted(self) -> str:
        """Decrypt child_name for authorized access."""
        return aes_decrypt(self.child_name) if self.child_name else None

    @property
    def guardian_name_decrypted(self) -> str:
        """Decrypt guardian_name for authorized access."""
        return aes_decrypt(self.guardian_name) if self.guardian_name else None

    @property
    def guardian_phone_decrypted(self) -> str:
        """Decrypt guardian_phone for authorized access."""
        return aes_decrypt(self.guardian_phone_encrypted) if self.guardian_phone_encrypted else None

    @property
    def guardian_email_decrypted(self) -> str:
        """Decrypt guardian_email for authorized access."""
        return aes_decrypt(self.guardian_email_encrypted) if self.guardian_email_encrypted else None

    @classmethod
    def create_with_encryption(cls, **kwargs):
        """Create a new ChildParticipant with encrypted fields."""
        if "child_name" in kwargs and kwargs["child_name"]:
            kwargs["child_name"] = aes_encrypt(kwargs["child_name"])
        if "guardian_name" in kwargs and kwargs["guardian_name"]:
            kwargs["guardian_name"] = aes_encrypt(kwargs["guardian_name"])
        if "guardian_phone_encrypted" in kwargs and kwargs["guardian_phone_encrypted"]:
            kwargs["guardian_phone_encrypted"] = aes_encrypt(kwargs["guardian_phone_encrypted"])
        if "guardian_email_encrypted" in kwargs and kwargs["guardian_email_encrypted"]:
            kwargs["guardian_email_encrypted"] = aes_encrypt(kwargs["guardian_email_encrypted"])
        return cls(**kwargs)
