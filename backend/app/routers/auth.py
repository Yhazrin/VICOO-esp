import logging
import hmac
import time

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Cookie
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas import ApiResponse, LoginRequest, RegisterRequest, RefreshRequest, TokenResponse
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

logger = logging.getLogger("tonghua.auth")
# Ensure the logger has a handler and level set
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG if settings.APP_ENV == "development" else logging.INFO)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.DEBUG if settings.APP_ENV == "development" else logging.INFO)
logger.propagate = True

router = APIRouter(prefix="/auth", tags=["Auth"])

# Mock user fallback (for development/testing only)
# Note: These are in-memory mock users with no passwords stored.
# In production, real users should be in the database.
# This fallback is disabled by default and only used when database is unavailable.
_mock_users = [
    {"id": 1, "email": "admin@tonghua.org", "nickname": "管理员", "role": "admin"},
    {"id": 2, "email": "editor@tonghua.org", "nickname": "编辑", "role": "editor"},
]


def _get_mock_user(email: str) -> dict | None:
    """Get mock user by email (for development only)."""
    for u in _mock_users:
        if u["email"] == email:
            return u
    return None


def _set_auth_cookies(response: JSONResponse, access_token: str, refresh_token: str) -> JSONResponse:
    """Set auth tokens as httpOnly cookies."""
    is_secure = settings.APP_ENV != "development"
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=15 * 60,  # 15 minutes
    )
    return response


from app.services.auth.service import AuthService

@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login via email+password or WeChat code."""
    logger.debug("Login attempt")
    auth_service = AuthService(db)

    # ── WeChat login ──
    if body.wechat_code:
        # WeChat logic still in router for now as it's highly IO-specific, 
        # but in next pass we move it to AuthService too.
        # (Keeping existing implementation for safety during first refactor)
        pass

    # ── Email Login (Refactored to Service) ──
    try:
        user, token, refresh = await auth_service.authenticate_user(body.email, body.password)
        
        response_data = ApiResponse(
            success=True,
            data={
                "user": {"id": user.id, "email": user.email, "nickname": user.nickname, "role": user.role.value if hasattr(user.role, "value") else str(user.role)},
                "token": TokenResponse(access_token=token, refresh_token=refresh, expires_in=900).model_dump(),
            },
        )

        json_response = JSONResponse(
            status_code=200,
            content=response_data.model_dump(),
        )
        _set_auth_cookies(json_response, token, refresh)
        return json_response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/register", status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account (Refactored to Service)."""
    auth_service = AuthService(db)
    user, token, refresh = await auth_service.register_user(body.email, body.password, body.nickname)
    await db.commit()

    response_data = ApiResponse(
        success=True,
        data={
            "user": {"id": user.id, "email": user.email, "nickname": user.nickname, "role": "user"},
            "token": TokenResponse(access_token=token, refresh_token=refresh, expires_in=900).model_dump(),
        },
        message="Registration successful",
    )

    json_response = JSONResponse(
        status_code=201,
        content=response_data.model_dump(),
    )
    _set_auth_cookies(json_response, token, refresh)
    return json_response


@router.post("/wx-login")
async def wx_login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """WeChat mini-program login (code2Session flow).

    In production:
    1. Client calls wx.login() to get a temporary code
    2. Client sends code to this endpoint
    3. Server exchanges code via https://api.weixin.qq.com/sns/jscode2session
    4. Server creates/returns user with WeChat openid
    """
    if not body.wechat_code:
        raise HTTPException(status_code=400, detail="wechat_code is required")

    # 调用微信 code2Session 接口验证 Code 的有效性
    if not settings.WECHAT_APP_ID or not settings.WECHAT_APP_SECRET:
        raise HTTPException(status_code=500, detail="WeChat configuration is missing")

    async with httpx.AsyncClient() as client:
        wx_response = await client.post(
            "https://api.weixin.qq.com/sns/jscode2session",
            data={
                "appid": settings.WECHAT_APP_ID,
                "secret": settings.WECHAT_APP_SECRET,
                "js_code": body.wechat_code,
                "grant_type": "authorization_code",
            },
        )

        if wx_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid WeChat code")

        session_data = wx_response.json()

        # 检查微信 API 返回的错误
        if "errcode" in session_data and session_data["errcode"] != 0:
            raise HTTPException(status_code=401, detail="WeChat authentication failed")

        openid = session_data.get("openid")
        if not openid:
            raise HTTPException(status_code=401, detail="WeChat authentication failed")

        # 查找或创建用户
        # 这里简化处理，实际应用中应查询数据库是否存在该 openid 用户
        # 如果不存在，则创建新用户

        # 使用 openid 创建 JWT token
        token = create_access_token(subject=openid, role="user", extra={"openid": openid})
        refresh = create_refresh_token(subject=openid, role="user")

        response_data = ApiResponse(
            success=True,
            data=TokenResponse(
                access_token=token, refresh_token=refresh, expires_in=900
            ).model_dump(),
            message="WeChat login successful",
        )

        json_response = JSONResponse(
            status_code=200,
            content=response_data.model_dump(),
        )
        _set_auth_cookies(json_response, token, refresh)
        return json_response


@router.post("/refresh")
async def refresh(request: Request, db: AsyncSession = Depends(get_db)):
    """Refresh access token using a valid refresh token from httpOnly cookie."""
    # Read refresh token from httpOnly cookie
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    auth_service = AuthService(db)
    try:
        # Check blacklist before service call
        from app.security import decode_token
        payload = decode_token(refresh_token)
        from app.deps import is_token_blacklisted
        if await is_token_blacklisted(payload.get("jti")):
            raise HTTPException(status_code=401, detail="Token has been invalidated (logged out)")

        sub, role, new_access, new_refresh = await auth_service.refresh_tokens(refresh_token)

        # Blacklist the old refresh token so it can't be reused (token rotation)
        from app.deps import get_redis_client
        redis = await get_redis_client()
        old_jti = payload.get("jti")
        if old_jti:
            exp = payload.get("exp")
            if exp:
                ttl = max(int(exp - time.time()), 60)
                await redis.setex(f"blacklist:{old_jti}", ttl, "1")

        response_data = ApiResponse(
            success=True,
            data=TokenResponse(
                access_token=new_access, refresh_token=new_refresh, expires_in=900
            ).model_dump(),
        )

        json_response = JSONResponse(
            status_code=200,
            content=response_data.model_dump(),
        )
        _set_auth_cookies(json_response, new_access, new_refresh)
        return json_response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refresh error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post("/forgot-password")
async def forgot_password(request: Request):
    """Request a password reset email.

    Security: Always returns success to prevent email enumeration.
    In production, this would send an actual reset email.
    """
    # Note: In production, validate email and send reset link via email service
    # For now, always return success for security (prevent email enumeration)
    return JSONResponse(
        status_code=200,
        content=ApiResponse(
            success=True,
            data={"message": "If an account exists with that email, a reset link has been sent."},
        ).model_dump(),
    )


@router.post("/logout")
async def logout(request: Request):
    """Invalidate the current session and blacklist tokens."""
    from app.deps import get_redis_client
    redis = await get_redis_client()
    
    # 1. Blacklist the refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                ttl = max(int(exp - time.time()), 60)
                await redis.setex(f"blacklist:{jti}", ttl, "1")
            raise
        except HTTPException:
            raise
        except Exception:
            pass

    # 2. Blacklist the access token from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                ttl = max(int(exp - time.time()), 60)
                await redis.setex(f"blacklist:{jti}", ttl, "1")
            raise
        except HTTPException:
            raise
        except Exception:
            pass

    response_data = ApiResponse(success=True, data={"message": "Logged out successfully"})

    json_response = JSONResponse(
        status_code=200,
        content=response_data.model_dump(),
    )
    json_response.delete_cookie(key="refresh_token")
    json_response.delete_cookie(key="access_token")
    return json_response