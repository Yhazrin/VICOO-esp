import hmac
import time
import logging
from typing import Optional, Tuple, Dict, Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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

logger = logging.getLogger("tonghua.auth_service")

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
            if verify_password(password, user.password_hash):
                if user.status == "banned":
                    raise HTTPException(status_code=403, detail="Account is banned")
                
                access_token = create_access_token(subject=str(user.id), role=user.role.value if hasattr(user.role, "value") else str(user.role))
                refresh_token = create_refresh_token(subject=str(user.id), role=user.role.value if hasattr(user.role, "value") else str(user.role))
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
    async def register_user(self, email: str, password: str, nickname: str) -> Tuple[User, str, str]:
        """
        Register a new user.
        """
        existing = (await self.db.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=400, detail="Registration failed. Email already exists.")

        user = User(
            email=email,
            password_hash=hash_password(password),
            nickname=nickname,
            role="user",
            status="active",
        )
        self.db.add(user)
        await self.db.flush()
        
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
            
            role = user.role.value if hasattr(user.role, "value") else str(user.role)
            
            new_access = create_access_token(subject=sub, role=role)
            new_refresh = create_refresh_token(subject=sub, role=role)
            
            return sub, role, new_access, new_refresh
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
