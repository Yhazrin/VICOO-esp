import logging
from typing import Optional, List, Dict, Any, Tuple

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.base import BaseService
from app.core.audit import audit_action
from app.security import aes_encrypt

logger = logging.getLogger("tonghua.user_service")

class UserService(BaseService):
    """
    Service handling user profile management and administrative actions.
    """

    async def list_users(self, page: int = 1, page_size: int = 20) -> Tuple[List[User], int]:
        """
        List all users with pagination.
        """
        stmt = select(User).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        users = result.scalars().all()
        
        count_stmt = select(func.count(User.id))
        total = (await self.db.execute(count_stmt)).scalar() or 0
        return users, total

    async def get_user_by_id(self, user_id: int) -> User:
        """
        Get user by ID.
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    @audit_action(action="update_profile", resource_type="user")
    async def update_user_profile(self, user_id: int, update_data: Dict[str, Any]) -> User:
        """
        Update user personal profile.
        """
        user = await self.get_user_by_id(user_id)
        
        if "nickname" in update_data and update_data["nickname"] is not None:
            user.nickname = update_data["nickname"]
        if "avatar" in update_data and update_data["avatar"] is not None:
            user.avatar = update_data["avatar"]
        if "phone" in update_data and update_data["phone"] is not None:
            user.phone_encrypted = aes_encrypt(update_data["phone"])
            
        await self.db.flush()
        return user

    @audit_action(action="update_role", resource_type="user")
    async def update_user_role(self, user_id: int, new_role: str) -> User:
        """
        Administrative action to update user role.
        """
        user = await self.get_user_by_id(user_id)
        user.role = new_role
        await self.db.flush()
        return user

    @audit_action(action="update_status", resource_type="user")
    async def update_user_status(self, user_id: int, new_status: str) -> User:
        """
        Administrative action to update user status (active/banned).
        """
        user = await self.get_user_by_id(user_id)
        user.status = new_status
        await self.db.flush()
        return user
