import os
import base64
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings

# ── Password hashing ──────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT helpers ───────────────────────────────────────────────────
def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(subject: str, role: str = "user", extra: dict | None = None) -> str:
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": _now_utc(),
        "exp": _now_utc() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    if extra:
        payload.update(extra)

    # Select signing key based on algorithm
    if settings.JWT_ALGORITHM == "HS256":
        signing_key = settings.APP_SECRET_KEY
    else:
        # RSA, EC, etc. require private key
        signing_key = settings.JWT_PRIVATE_KEY

    return jwt.encode(payload, signing_key, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str, role: str = "user") -> str:
    payload = {
        "sub": subject,
        "role": role,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "iat": _now_utc(),
        "exp": _now_utc() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    }

    # Select signing key based on algorithm
    if settings.JWT_ALGORITHM == "HS256":
        signing_key = settings.APP_SECRET_KEY
    else:
        # RSA, EC, etc. require private key
        signing_key = settings.JWT_PRIVATE_KEY

    return jwt.encode(payload, signing_key, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode a JWT token; raises JWTError on failure."""
    # Select verification key based on algorithm
    if settings.JWT_ALGORITHM == "HS256":
        verify_key = settings.APP_SECRET_KEY
    else:
        # RSA, EC, etc. require public key for verification
        verify_key = settings.JWT_PUBLIC_KEY

    return jwt.decode(token, verify_key, algorithms=[settings.JWT_ALGORITHM])


# ── AES-256-GCM helpers ──────────────────────────────────────────
def _get_aes_key() -> bytes:
    """Get AES-256 key from environment variable.

    Security: Uses SHA-256 hash to ensure exactly 32 bytes without insecure padding.
    This prevents potential key truncation vulnerabilities.
    """
    import hashlib
    raw = settings.AES_KEY.encode("utf-8")
    # Use SHA-256 hash to generate exactly 32 bytes from any input length
    # This is more secure than zero-padding which can weaken key entropy
    return hashlib.sha256(raw).digest()


def aes_encrypt(plaintext: str) -> str:
    """Encrypt a string and return base64(nonce + ciphertext)."""
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ct).decode("utf-8")


def aes_decrypt(ciphertext_b64: str) -> str:
    """Decrypt a base64(nonce + ciphertext) string."""
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(ciphertext_b64)
    nonce = raw[:12]
    ct = raw[12:]
    return aesgcm.decrypt(nonce, ct, None).decode("utf-8")


# ── Convenience helpers ──────────────────────────────────────────
def generate_order_no() -> str:
    """Generate a unique order number like TH20260319XXXXXXXX."""
    import secrets
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    rand = secrets.randbelow(9000) + 1000  # 1000-9999
    return f"TH{ts}{rand}"
