import logging
from typing import Optional, Dict, Any

from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from app.core.errors import (
    EmailAlreadyExistsException,
    OAuthOnlyAccountException,
    ResourceNotFoundException,
    WrongCurrentPasswordException,
)
from app.models.user import User
from app.services.base import BaseService
from app.core.audit import audit_action
from app.security import aes_encrypt, hash_password, verify_password
from app.services.auth.service import _check_server_side_password_strength

logger = logging.getLogger("vicoo.user_service")

class UserService(BaseService):
    """
    Service handling user profile management and administrative actions.
    """

    async def list_users(self, page: int = 1, page_size: int = 20, search: Optional[str] = None) -> tuple[list[User], int]:
        """List users with pagination and optional search."""
        count_stmt = select(func.count(User.id))
        stmt = select(User)

        if search:
            safe = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            like = f"%{safe}%"
            count_stmt = count_stmt.where(
                User.nickname.ilike(like, escape="\\") | User.email.ilike(like, escape="\\")
            )
            stmt = stmt.where(
                User.nickname.ilike(like, escape="\\") | User.email.ilike(like, escape="\\")
            )

        total = (await self.db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        users = list(result.scalars().all())
        return users, total

    async def get_user_by_id(self, user_id: int) -> User:
        """
        Get user by ID.
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise ResourceNotFoundException(message=f"User with ID {user_id} not found")
        return user

    def _verify_current_password(self, user: User, current_password: Optional[str]) -> None:
        if not user.password_hash:
            raise OAuthOnlyAccountException()
        if not current_password or not verify_password(current_password, user.password_hash):
            raise WrongCurrentPasswordException()

    @audit_action(action="update_profile", resource_type="user")
    async def update_user_profile(self, user_id: int, update_data: Dict[str, Any]) -> User:
        """
        Update user personal profile.
        """
        user = await self.get_user_by_id(user_id)

        new_email = update_data.get("email")
        current_password = update_data.get("current_password")
        new_password = update_data.get("new_password")

        wants_email_change = (
            new_email is not None
            and (user.email or "").lower() != str(new_email).lower()
        )
        wants_password_change = new_password is not None

        if wants_email_change or wants_password_change:
            self._verify_current_password(user, current_password)

        if wants_password_change:
            _check_server_side_password_strength(new_password)
            user.password_hash = hash_password(new_password)

        if wants_email_change:
            existing = (
                await self.db.execute(
                    select(User).where(User.email == new_email, User.id != user_id)
                )
            ).scalar_one_or_none()
            if existing:
                raise EmailAlreadyExistsException()
            user.email = str(new_email).lower()

        if "nickname" in update_data and update_data["nickname"] is not None:
            user.nickname = update_data["nickname"]
        if "avatar" in update_data and update_data["avatar"] is not None:
            user.avatar = update_data["avatar"]
        if "phone" in update_data and update_data["phone"] is not None:
            user.phone_encrypted = aes_encrypt(update_data["phone"])

        try:
            await self.db.flush()
        except IntegrityError:
            await self.db.rollback()
            raise EmailAlreadyExistsException()

        await self.db.refresh(user, ["created_at", "updated_at"])
        return user

    @audit_action(action="update_role", resource_type="user")
    async def update_user_role(self, user_id: int, new_role: str) -> User:
        """
        Administrative action to update user role.
        """
        user = await self.get_user_by_id(user_id)
        user.role = new_role
        await self.db.flush()
        await self.db.refresh(user, ["created_at", "updated_at"])
        return user

    @audit_action(action="update_status", resource_type="user")
    async def update_user_status(self, user_id: int, new_status: str) -> User:
        """
        Administrative action to update user status (active/banned).
        """
        user = await self.get_user_by_id(user_id)
        user.status = new_status
        await self.db.flush()
        await self.db.refresh(user, ["created_at", "updated_at"])
        return user
