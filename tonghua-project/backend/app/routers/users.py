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


@router.get("", response_model=PaginatedResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """List all users (admin only)."""
    try:
        stmt = select(User).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        users = result.scalars().all()
        count_stmt = select(func.count(User.id))
        total = (await db.execute(count_stmt)).scalar() or 0
        return PaginatedResponse(
            data=[UserOut.model_validate(u).model_dump() for u in users],
            total=total,
            page=page,
            page_size=page_size,
        )
    except Exception:
        start = (page - 1) * page_size
        end = start + page_size
        return PaginatedResponse(
            data=_mock_users[start:end],
            total=len(_mock_users),
            page=page,
            page_size=page_size,
        )


@router.get("/me", response_model=ApiResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile."""
    try:
        stmt = select(User).where(User.id == current_user["id"])
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            return ApiResponse(data=UserOut.model_validate(user).model_dump())
    except Exception:
        pass
    return ApiResponse(data=current_user)


@router.put("/me", response_model=ApiResponse)
async def update_me(
    body: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile."""
    try:
        stmt = select(User).where(User.id == current_user["id"])
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if body.nickname is not None:
            user.nickname = body.nickname
        if body.avatar is not None:
            user.avatar = body.avatar
        if body.phone is not None:
            user.phone_encrypted = aes_encrypt(body.phone)
        await db.flush()
        return ApiResponse(data=UserOut.model_validate(user).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB write failed during update_me: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/{user_id}", response_model=ApiResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get a user by ID.

    Security: Only admins or the user themselves can access user details.
    Prevents IDOR (Insecure Direct Object Reference) attacks.
    """
    # Authorization check: only admin or user themselves can access
    if current_user.get("role") != "admin" and current_user.get("id") != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied. You can only view your own profile or must be an administrator."
        )

    try:
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return ApiResponse(data=UserOut.model_validate(user).model_dump())
    except HTTPException:
        raise
    except Exception:
        for u in _mock_users:
            if u["id"] == user_id:
                return ApiResponse(data=u)
        raise HTTPException(status_code=404, detail="User not found")


@router.put("/{user_id}/role", response_model=ApiResponse)
async def update_user_role(
    user_id: int,
    body: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Update user role (admin only)."""
    # Prevent self-modification to avoid privilege escalation / lock-out
    if _current_user.get("id") == user_id:
        raise HTTPException(status_code=403, detail="Admins cannot modify their own role")
    try:
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.role = body.role
        await db.flush()
        return ApiResponse(data=UserOut.model_validate(user).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB write failed during update_user_role: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.put("/{user_id}/status", response_model=ApiResponse)
async def update_user_status(
    user_id: int,
    body: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Update user status (admin only)."""
    # Prevent self-modification to avoid lock-out
    if _current_user.get("id") == user_id:
        raise HTTPException(status_code=403, detail="Admins cannot modify their own status")
    try:
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.status = body.status
        await db.flush()
        return ApiResponse(data=UserOut.model_validate(user).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB write failed during update_user_status: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
