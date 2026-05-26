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
from app.schemas import (
    ApiResponse,
    LoginRequest,
    RegisterRequest,
    RefreshRequest,
    TokenResponse,
    ForgotPasswordRequest
)
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.services.auth.service import AuthService
from app.services.mailer import send_welcome_email, send_password_recovery_email
from app.core.errors import ServiceUnavailableException

logger = logging.getLogger("vicoo.auth")

router = APIRouter(prefix="/auth", tags=["Auth"])

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
    auth_service = AuthService(db)

    # ── Input validation ──
    has_wechat = bool(body.wechat_code)
    has_email = bool(body.email)
    has_password = bool(body.password)

    if has_wechat:
        raise HTTPException(status_code=501, detail="WeChat login not implemented")
    elif has_email and has_password:
        pass
    elif has_email or has_password:
        raise HTTPException(status_code=422, detail="Both email and password are required")
    else:
        raise HTTPException(status_code=422, detail="Either WeChat code or email+password is required")

    try:
        user, token, refresh = await auth_service.authenticate_user(body.email, body.password)

        response_data = ApiResponse(
            success=True,
            data={
                "user": {"id": user.id, "email": user.email, "nickname": user.nickname, "role": user.role.value if hasattr(user.role, "value") else str(user.role)},
                "token": TokenResponse(access_token=token, refresh_token=refresh, expires_in=900).model_dump(),
            },
        )

        json_response = JSONResponse(status_code=200, content=response_data.model_dump())
        _set_auth_cookies(json_response, token, refresh)
        return json_response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/register", status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    auth_service = AuthService(db)
    try:
        user, token, refresh = await auth_service.register_user(body.email, body.password, body.nickname)

        response_data = ApiResponse(
            success=True,
            data={
                "user": {"id": user.id, "email": user.email, "nickname": user.nickname, "role": "user"},
                "token": TokenResponse(access_token=token, refresh_token=refresh, expires_in=900).model_dump(),
            },
            message="Registration successful",
        )

        json_response = JSONResponse(status_code=201, content=response_data.model_dump())
        _set_auth_cookies(json_response, token, refresh)
        return json_response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Register error: {e}")
        raise HTTPException(status_code=400, detail="Registration failed")


@router.post("/refresh")
async def refresh(request: Request, db: AsyncSession = Depends(get_db)):
    """Refresh access token."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    auth_service = AuthService(db)
    try:
        payload = decode_token(refresh_token)
        from app.deps import is_token_blacklisted
        if await is_token_blacklisted(payload.get("jti")):
            raise HTTPException(status_code=401, detail="Token has been invalidated")

        sub, role, new_access, new_refresh = await auth_service.refresh_tokens(refresh_token)

        # Blacklist rotation
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
            data=TokenResponse(access_token=new_access, refresh_token=new_refresh, expires_in=900).model_dump(),
        )

        json_response = JSONResponse(status_code=200, content=response_data.model_dump())
        _set_auth_cookies(json_response, new_access, new_refresh)
        return json_response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refresh error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Recover password.
    - If mock user: returns password directly.
    - If real user: sends email via Resend.
    - If user not found: returns 404 error.
    """
    stmt = select(User).where(User.email == body.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Always return the same message to prevent email enumeration
    _generic_msg = "If an account exists with this email, a recovery email has been sent."

    if not user:
        return ApiResponse(message=_generic_msg, data={"email": body.email, "is_mock": False})

    # 1. Logic for Mock / Test accounts (only in DEMO_MODE)
    is_mock = False

    if settings.DEMO_MODE and (body.email.endswith("@vicoo.test") or body.email.endswith("@vicoo.org") or body.email.startswith("vicoo-")):
        is_mock = True

    if is_mock:
        return ApiResponse(
            message=_generic_msg,
            data={"email": body.email, "is_mock": True, "password_hint": "See SEED_*_PASSWORD in .env"}
        )

    # 2. Logic for Real accounts
    # Generate per-request random hint — never use a static shared secret
    import secrets
    recovery_hint = f"VICOO-{secrets.token_hex(8).upper()}"
    try:
        await send_password_recovery_email(
            to_email=user.email,
            password_hint=recovery_hint,
            locale="zh"
        )
    except Exception as e:
        logger.error(f"Recovery mail failed: {e}")
    # Always return success regardless of email send outcome
    return ApiResponse(message=_generic_msg, data={"email": body.email, "is_mock": False})


@router.post("/logout")
async def logout(request: Request):
    """Invalidate the current session."""
    from app.deps import get_redis_client
    redis = await get_redis_client()
    
    for token_source in ["cookie", "header"]:
        token = None
        if token_source == "cookie":
            token = request.cookies.get("refresh_token")
        else:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ", 1)[1]
        
        if token:
            try:
                payload = decode_token(token)
                jti = payload.get("jti")
                exp = payload.get("exp")
                if jti and exp:
                    ttl = max(int(exp - time.time()), 60)
                    await redis.setex(f"blacklist:{jti}", ttl, "1")
            except Exception as e:
                logger.warning(f"Failed to blacklist token during logout: {e}")

    json_response = JSONResponse(
        status_code=200,
        content=ApiResponse(success=True, data={"message": "Logged out successfully"}).model_dump(),
    )
    json_response.delete_cookie(key="refresh_token")
    json_response.delete_cookie(key="access_token")
    return json_response
