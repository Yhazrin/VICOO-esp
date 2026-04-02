from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.database import get_db
from app.models.user import User
from app.schemas import ApiResponse, PaginatedResponse, UserOut, UserUpdate, UserRoleUpdate, UserStatusUpdate
from app.deps import get_current_user, require_role
from app.security import aes_encrypt, hash_password

router = APIRouter(prefix="/users", tags=["Users"])

logger = logging.getLogger(__name__)

_mock_users = [
    {"id": 1, "email": "admin@tonghua.org", "nickname": "管理员", "avatar": None, "role": "admin", "status": "active", "created_at": "2025-01-01T00:00:00", "updated_at": "2025-01-01T00:00:00"},
    {"id": 2, "email": "editor@tonghua.org", "nickname": "编辑小王", "avatar": None, "role": "editor", "status": "active", "created_at": "2025-02-01T00:00:00", "updated_at": "2025-02-01T00:00:00"},
    {"id": 3, "email": "lihua@example.com", "nickname": "李华", "avatar": None, "role": "user", "status": "active", "created_at": "2025-03-01T00:00:00", "updated_at": "2025-03-01T00:00:00"},
    {"id": 4, "email": "zhangwei@example.com", "nickname": "张伟", "avatar": None, "role": "user", "status": "active", "created_at": "2025-04-01T00:00:00", "updated_at": "2025-04-01T00:00:00"},
    {"id": 5, "email": "wangfang@example.com", "nickname": "王芳", "avatar": None, "role": "user", "status": "active", "created_at": "2025-05-01T00:00:00", "updated_at": "2025-05-01T00:00:00"},
]


from app.services.user.service import UserService

@router.get("", response_model=PaginatedResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """List all users (admin only). (Refactored)"""
    user_service = UserService(db)
    try:
        users, total = await user_service.list_users(page, page_size)
        return PaginatedResponse(
            data=[UserOut.model_validate(u).model_dump() for u in users],
            total=total,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        return PaginatedResponse(data=[], total=0, page=page, page_size=page_size)

@router.get("/me", response_model=ApiResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile. (Refactored)"""
    user_service = UserService(db)
    try:
        user = await user_service.get_user_by_id(current_user["id"])
        return ApiResponse(data=UserOut.model_validate(user).model_dump())
    except HTTPException:
        raise
    except Exception:
        return ApiResponse(data=current_user)

@router.put("/me", response_model=ApiResponse)
async def update_me(
    body: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile. (Refactored)"""
    user_service = UserService(db)
    try:
        user = await user_service.update_user_profile(current_user["id"], body.model_dump())
        await db.commit()
        return ApiResponse(data=UserOut.model_validate(user).model_dump())
        raise
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{user_id}", response_model=ApiResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get a user by ID. (Refactored)"""
    if current_user.get("role") != "admin" and current_user.get("id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    user_service = UserService(db)
    try:
        user = await user_service.get_user_by_id(user_id)
        return ApiResponse(data=UserOut.model_validate(user).model_dump())
        raise
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")

@router.put("/{user_id}/role", response_model=ApiResponse)
async def update_user_role(
    user_id: int,
    body: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Update user role (admin only). (Refactored)"""
    if _current_user.get("id") == user_id:
        raise HTTPException(status_code=403, detail="Admins cannot modify their own role")
    
    user_service = UserService(db)
    try:
        user = await user_service.update_user_role(user_id, body.role)
        await db.commit()
        return ApiResponse(data=UserOut.model_validate(user).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user role: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{user_id}/status", response_model=ApiResponse)
async def update_user_status(
    user_id: int,
    body: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Update user status (admin only). (Refactored)"""
    if _current_user.get("id") == user_id:
        raise HTTPException(status_code=403, detail="Admins cannot modify their own status")
    
    user_service = UserService(db)
    try:
        user = await user_service.update_user_status(user_id, body.status)
        await db.commit()
        return ApiResponse(data=UserOut.model_validate(user).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")