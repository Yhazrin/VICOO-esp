import logging
import hmac

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
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


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login via email+password or WeChat code."""
    logger.debug("Login attempt")

    # ── WeChat login ──
    if body.wechat_code:
        logger.debug("Processing WeChat login")
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
                logger.warning(f"WeChat code2session error: errcode={session_data.get('errcode')}")
                raise HTTPException(status_code=401, detail="WeChat authentication failed")

            openid = session_data.get("openid")
            if not openid:
                raise HTTPException(status_code=401, detail="WeChat authentication failed")

            # 使用 openid 创建 JWT token
            token = create_access_token(subject=openid, role="user", extra={"openid": openid})
            refresh = create_refresh_token(subject=openid, role="user")

            response_data = ApiResponse(
                success=True,
                data={
                    "user": {"id": openid, "email": "", "nickname": "", "role": "user"},
                    "token": TokenResponse(access_token=token, refresh_token=refresh, expires_in=900).model_dump(),
                },
            )

            json_response = JSONResponse(
                status_code=200,
                content=response_data.model_dump(),
            )
            _set_auth_cookies(json_response, token, refresh)
            return json_response

    if not body.email or not body.password:
        logger.debug("Missing email or password")
        raise HTTPException(status_code=400, detail="Email and password are required")

    # ── DB lookup ──
    logger.debug("DB lookup for user")
    try:
        stmt = select(User).where(User.email == body.email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        logger.debug(f"DB user found: {user is not None}")
        if user:
            if verify_password(body.password, user.password_hash):
                if user.status == "banned":
                    raise HTTPException(status_code=403, detail="Account is banned")
                token = create_access_token(subject=str(user.id), role=user.role)
                refresh = create_refresh_token(subject=str(user.id), role=user.role)
                response_data = ApiResponse(
                    success=True,
                    data={
                        "user": {"id": user.id, "email": user.email, "nickname": user.nickname, "role": user.role},
                        "token": TokenResponse(access_token=token, refresh_token=refresh, expires_in=900).model_dump(),
                    },
                )

                json_response = JSONResponse(
                    status_code=200,
                    content=response_data.model_dump(),
                )
                _set_auth_cookies(json_response, token, refresh)
                return json_response
            else:
                # User exists but password is wrong
                logger.debug("Password verification failed")
                raise HTTPException(status_code=401, detail="Invalid credentials")
        # User not found in DB - continue to mock fallback in development mode
        logger.debug("User not found in DB, checking mock fallback")
    except HTTPException:
        raise
    except Exception:
        # DB error - continue to mock fallback in development mode
        logger.debug("DB error during user lookup", exc_info=True)
        pass

    # ── Mock fallback (development only) ──
    # Only use mock users in explicit development mode
    logger.debug(f"Mock fallback: APP_ENV={settings.APP_ENV}")
    if settings.APP_ENV == "development":
        logger.debug("Development mode, checking mock users")
        mock = _get_mock_user(body.email)
        logger.debug("Mock lookup initiated")
        if mock:
            logger.debug(f"Mock user found: id={mock['id']}, role={mock['role']}")
            # Security: Validate password even for mock users
            # Use environment variable for mock password (no default)
            mock_password = settings.MOCK_USER_PASSWORD
            logger.debug("Verifying mock password")
            if not hmac.compare_digest(mock_password, body.password):
                logger.debug("Mock password verification failed")
                raise HTTPException(status_code=401, detail="Invalid credentials")
            logger.debug("Mock password verification passed")
            token = create_access_token(subject=str(mock["id"]), role=mock["role"])
            refresh = create_refresh_token(subject=str(mock["id"]), role=mock["role"])
            response_data = ApiResponse(
                success=True,
                data={
                    "user": {"id": mock["id"], "email": mock["email"], "nickname": mock["nickname"], "role": mock["role"]},
                    "token": TokenResponse(access_token=token, refresh_token=refresh, expires_in=900).model_dump(),
                },
                message="Warning: Using development mock user",
            )

            json_response = JSONResponse(
                status_code=200,
                content=response_data.model_dump(),
            )
            _set_auth_cookies(json_response, token, refresh)
            return json_response
    else:
        # Production: no mock fallback, strict authentication
        pass
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/register", status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    try:
        # Check for existing user
        existing = (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
        if existing:
            # SECURITY: Use generic error message to prevent email enumeration
            # Don't reveal whether email exists; ask to try login or contact support
            raise HTTPException(status_code=400, detail="Registration failed. If you already have an account, please log in.")

        user = User(
            email=body.email,
            password_hash=hash_password(body.password),
            nickname=body.nickname,
            role="user",
            status="active",
        )
        db.add(user)
        await db.flush()
        token = create_access_token(subject=str(user.id), role=user.role)
        refresh = create_refresh_token(subject=str(user.id), role=user.role)

        response_data = ApiResponse(
            success=True,
            data={
                "user": {"id": user.id, "email": user.email, "nickname": user.nickname, "role": user.role},
                "token": TokenResponse(access_token=token, refresh_token=refresh, expires_in=900).model_dump(),
            },
            message="Registration successful",
        )

        json_response = JSONResponse(
            status_code=201,
            content=response_data.model_dump(),
        )
        logger.info("User registered successfully")
        _set_auth_cookies(json_response, token, refresh)
        return json_response
    except HTTPException:
        raise
    except Exception:
        # Mock fallback (development only)
        if settings.APP_ENV != "development":
            raise HTTPException(status_code=500, detail="Database unavailable")

        # Check if email already exists in mock users
        for u in _mock_users:
            if u["email"] == body.email:
                # SECURITY: Use generic error message to prevent email enumeration
                raise HTTPException(status_code=400, detail="Registration failed. If you already have an account, please log in.")

        # Add to mock users (note: no password stored, only for development)
        new_id = max(u["id"] for u in _mock_users) + 1
        new_user = {"id": new_id, "email": body.email, "nickname": body.nickname, "role": "user"}
        _mock_users.append(new_user)
        token = create_access_token(subject=str(new_id), role="user")
        refresh = create_refresh_token(subject=str(new_id), role="user")

        response_data = ApiResponse(
            success=True,
            data={
                "user": {"id": new_id, "email": body.email, "nickname": body.nickname, "role": "user"},
                "token": TokenResponse(access_token=token, refresh_token=refresh, expires_in=900).model_dump(),
            },
            message="Registration successful (mock development mode)",
        )

        json_response = JSONResponse(
            status_code=201,
            content=response_data.model_dump(),
        )
        logger.info("Mock user registered successfully")
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

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid refresh token")
        sub = payload["sub"]
        role = payload.get("role", "user")

        # Verify user is not banned before issuing new tokens
        try:
            user_id = int(sub)
            stmt = select(User).where(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            if user and user.status == "banned":
                raise HTTPException(status_code=403, detail="Account is banned")
        except HTTPException:
            raise
        except (ValueError, Exception):
            pass  # sub is not an integer (e.g. WeChat openid) or DB unavailable

        new_access = create_access_token(subject=sub, role=role)
        new_refresh = create_refresh_token(subject=sub, role=role)

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
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post("/logout")
async def logout():
    """Invalidate the current session (client-side token discard)."""
    # Clear the refresh token and access token cookies
    response_data = ApiResponse(success=True, data={"message": "Logged out successfully"})

    json_response = JSONResponse(
        status_code=200,
        content=response_data.model_dump(),
    )
    json_response.delete_cookie(key="refresh_token")
    json_response.delete_cookie(key="access_token")
    return json_response
