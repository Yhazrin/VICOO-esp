import hmac
import logging
from typing import Tuple

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import (
    EmailAlreadyExistsException,
    InvalidNicknameException,
    InvalidPhoneException,
    WeakPasswordException,
)
from app.models.user import User
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.services.base import BaseService
from app.config import settings
from app.core.audit import audit_action

import re as _re

# Mirror the schema-layer validation. Service-layer checks act as defence in
# depth in case the schema is bypassed (e.g. internal callers, future gRPC
# endpoint) — the schema raises 422, the service raises a BusinessException.
_NICKNAME_CONTROL = _re.compile(r"[\x00-\x1f\x7f]")
_PHONE_PATTERN = _re.compile(r"^\+?[\d\s-]{7,20}$")


def _check_server_side_password_strength(password: str) -> None:
    """Schema enforces length and non-whitespace; this adds the bcrypt-byte cap
    defence in depth (Python `len` is chars, not bytes — a password of 70 emoji
    could exceed 72 bytes even when under the 72-char schema max)."""
    if password and len(password.encode("utf-8")) > 72:
        raise WeakPasswordException(
            "Password is too long. Please use at most 72 bytes of password."
        )


def _check_server_side_nickname(nickname: str) -> None:
    if not nickname or not nickname.strip():
        raise InvalidNicknameException("Nickname must contain non-whitespace characters.")
    if _NICKNAME_CONTROL.search(nickname):
        raise InvalidNicknameException("Nickname contains invalid control characters.")


def _check_server_side_phone(phone: str | None) -> None:
    if phone is None or phone == "":
        return
    if not _PHONE_PATTERN.match(phone):
        raise InvalidPhoneException("Phone number format is invalid.")

logger = logging.getLogger("vicoo.auth_service")

class AuthService(BaseService):
    """
    Service handling authentication, registration, and token management.
    """

    @audit_action(action="login", resource_type="user")
    async def authenticate_user(self, email: str, password: str) -> Tuple[User, str, str]:
        """
        Authenticate user via email and password.
        Returns (User, access_token, refresh_token).
        """
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            if user.password_hash and verify_password(password, user.password_hash):
                if user.status == "banned":
                    raise HTTPException(status_code=403, detail="Account is banned")
                
                role = str(user.role)
                access_token = create_access_token(subject=str(user.id), role=role)
                refresh_token = create_refresh_token(subject=str(user.id), role=role)
                return user, access_token, refresh_token
            else:
                raise HTTPException(status_code=401, detail="Invalid credentials")

        # Mock fallback for development
        if settings.APP_ENV == "development":
            # This logic will be further refined when moving to a more formal Mock system
            # For now, it matches the existing router behavior
            mock_password = settings.MOCK_USER_PASSWORD
            if hmac.compare_digest(mock_password, password):
                # We return a transient user object for mock flows if needed, 
                # or handle it specifically in the caller.
                pass
        
        raise HTTPException(status_code=401, detail="Invalid credentials")

    @audit_action(action="register", resource_type="user")
    async def register_user(
        self,
        email: str,
        password: str,
        nickname: str,
        phone: str | None = None,
    ) -> Tuple[User, str, str]:
        """
        Register a new user.

        Raises structured `BusinessException`s so the frontend can show a
        specific message. Race conditions on the email-unique index raise
        `EmailAlreadyExistsException` (translated from `IntegrityError`).
        """
        # Defence-in-depth validation. The Pydantic schema catches these first
        # for HTTP traffic; the service layer enforces the same rules for
        # internal callers and future RPC endpoints.
        _check_server_side_password_strength(password)
        _check_server_side_nickname(nickname)
        _check_server_side_phone(phone)

        existing = (await self.db.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if existing:
            raise EmailAlreadyExistsException()

        user = User(
            email=email,
            password_hash=hash_password(password),
            nickname=nickname,
            role="user",
            status="active",
        )
        self.db.add(user)
        try:
            await self.db.flush()
        except IntegrityError:
            # Race: another request inserted the same email between our SELECT
            # and our INSERT. Roll back and surface the same structured error
            # the pre-check would have raised.
            await self.db.rollback()
            raise EmailAlreadyExistsException()

        access = create_access_token(subject=str(user.id), role="user")
        refresh = create_refresh_token(subject=str(user.id), role="user")
        return user, access, refresh

    async def refresh_tokens(self, refresh_token: str) -> Tuple[str, str, str, str]:
        """
        Validate refresh token and generate a new pair.
        Returns (sub, role, new_access, new_refresh).
        """
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise HTTPException(status_code=400, detail="Invalid token type")
            
            sub = payload["sub"]
            
            # Verify user state in DB
            user_id = int(sub)
            result = await self.db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            if user.status == "banned":
                raise HTTPException(status_code=403, detail="Account is banned")
            
            role = str(user.role)
            
            new_access = create_access_token(subject=sub, role=role)
            new_refresh = create_refresh_token(subject=sub, role=role)
            
            return sub, role, new_access, new_refresh
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
