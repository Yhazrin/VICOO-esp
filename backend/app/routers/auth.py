import asyncio
import hashlib
import hmac
import logging
import random
import secrets
import time
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Cookie
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.audit import log_audit
from app.database import get_db
from app.deps import get_redis_client
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.schemas import (
    ApiResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetConfirmRequest,
    ResetVerifyOtpRequest,
    TokenResponse,
)
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
)
from app.services.auth.service import AuthService
from app.services.mailer import send_password_recovery_email, send_password_reset_email

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


@router.post("/login", response_model=ApiResponse)
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
        logger.error("Login error: %s", e)
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/register", response_model=ApiResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account.

    Returns structured `BusinessException`s (`EMAIL_ALREADY_EXISTS`,
    `WEAK_PASSWORD`, `INVALID_NICKNAME`, `INVALID_PHONE`) with a `code` field
    so the frontend can show a specific message. Pydantic validation errors
    (bad email, short password, bad phone format) come back as 422 with
    `code: VALIDATION_FAILED` and an `errors` array.

    The 500 path is reserved for genuinely unexpected errors — surface them
    loudly so we don't silently hide regressions behind a generic "Registration
    failed" message.
    """
    auth_service = AuthService(db)
    try:
        user, token, refresh = await auth_service.register_user(
            email=body.email,
            password=body.password,
            nickname=body.nickname,
            phone=body.phone,
        )
    except HTTPException:
        # BusinessException is a subclass of HTTPException; re-raise so the
        # dedicated handler at app.main:295 preserves the structured `code`.
        raise

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


@router.post("/refresh", response_model=ApiResponse)
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
        logger.error("Refresh error: %s", e)
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


def _err(status_code: int, code: str, message: str) -> JSONResponse:
    """Build a 4xx JSONResponse in the project's standard error shape.

    The global `HTTPException` handler at `app.main:354` flattens any
    dict-shaped `detail` into the `message` field, so we have to bypass it
    for endpoints that need to surface a structured error `code` to the
    frontend (e.g. `invalid_otp`, `expired`, `too_many_attempts`).
    """
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "data": None, "message": message, "code": code},
    )


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(
        (otp + settings.PASSWORD_RESET_OTP_PEPPER).encode("utf-8")
    ).hexdigest()


async def _jitter_ms() -> None:
    """Constant-ish delay to reduce timing side-channels on 404 vs success paths."""
    await asyncio.sleep(random.uniform(0.05, 0.15))


async def _enforce_ip_forgot_limit(request: Request) -> JSONResponse | None:
    """Per-IP cap of 5 forgot-password requests in a fixed 1-hour bucket.

    Returns a 429 JSONResponse if the cap is exceeded, else None.
    """
    redis = await get_redis_client()
    ip = request.client.host if request.client else "unknown"
    bucket = int(time.time() // 3600)
    key = f"pwreset:forgot:ip:{ip}:{bucket}"
    try:
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, 3600)
        if count > 5:
            return _err(
                429, "rate_limited", "Too many password reset requests. Please try again later."
            )
    except Exception as e:  # pragma: no cover - defensive
        logger.warning("forgot-password IP rate limit check failed: %s", e)
    return None


async def _enforce_ip_confirm_limit(request: Request) -> JSONResponse | None:
    """Per-IP cap of 10 reset/confirm requests per hour."""
    redis = await get_redis_client()
    ip = request.client.host if request.client else "unknown"
    bucket = int(time.time() // 3600)
    key = f"pwreset:confirm:ip:{ip}:{bucket}"
    try:
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, 3600)
        if count > 10:
            return _err(
                429, "rate_limited", "Too many reset attempts. Please try again later."
            )
    except Exception as e:  # pragma: no cover - defensive
        logger.warning("reset/confirm IP rate limit check failed: %s", e)
    return None


async def _count_active_tokens_for_user(db: AsyncSession, user_id: int) -> int:
    """Count currently active tokens (unused and unexpired) for a user."""
    stmt = select(func.count(PasswordResetToken.id)).where(
        PasswordResetToken.user_id == user_id,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > datetime.utcnow(),
    )
    return (await db.execute(stmt)).scalar_one()


def _is_mock_email(email: str) -> bool:
    """Mock-account shortcut: bypasses email for dev/test accounts when DEMO_MODE is on."""
    if not settings.DEMO_MODE:
        return False
    lower = email.lower()
    return (
        lower.endswith("@vicoo.test")
        or lower.endswith("@vicoo.org")
        or lower.startswith("vicoo-")
    )


@router.post("/forgot-password", response_model=ApiResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Recover password.

    Real users (gmail / 163 / qq / outlook / etc.) get a reset link + 6-digit OTP
    mailed to them. Mock accounts (only in DEMO_MODE) get the seed password
    back in the response so devs and tests don't need an email round-trip.
    The response shape and 200 status are identical for both branches and for
    unknown emails, to prevent email enumeration.
    """
    if (rl := await _enforce_ip_forgot_limit(request)) is not None:
        return rl

    stmt = select(User).where(User.email == body.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")[:500] or None
    _generic_msg = (
        "If an account exists with this email, a reset link has been sent."
    )

    if not user:
        await _jitter_ms()
        return ApiResponse(message=_generic_msg, data={"email": body.email})

    # Mock branch — only in DEMO_MODE, preserves the existing dev workflow.
    if _is_mock_email(body.email):
        return ApiResponse(
            message=_generic_msg,
            data={"email": body.email, "password_hint": settings.MOCK_USER_PASSWORD},
        )

    # Per-user cap: max 3 active tokens at once (unused + unexpired).
    active = await _count_active_tokens_for_user(db, user.id)
    if active >= 3:
        await _jitter_ms()
        # Log the cap-hit but respond identically to the success case.
        await log_audit(
            db=db,
            user_id=user.id,
            action="password_reset_requested",
            resource="user",
            resource_id=str(user.id),
            status="rate_limited",
            details={"reason": "active_token_cap", "active_tokens": active},
            ip_address=ip,
        )
        await db.commit()
        return ApiResponse(message=_generic_msg, data={"email": body.email})

    # Generate raw values for the URL + email. Storage gets the hashes only.
    raw_token = secrets.token_urlsafe(32)
    otp = f"{secrets.randbelow(1_000_000):06d}"
    token_hash = _hash_token(raw_token)
    otp_hash = _hash_otp(otp)
    expires_at = datetime.utcnow() + timedelta(
        seconds=settings.PASSWORD_RESET_TOKEN_TTL_SECONDS
    )

    row = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        otp_hash=otp_hash,
        ip_address=ip,
        user_agent=user_agent,
        expires_at=expires_at,
    )
    db.add(row)
    await db.flush()

    await log_audit(
        db=db,
        user_id=user.id,
        action="password_reset_requested",
        resource="user",
        resource_id=str(user.id),
        status="success",
        details={"reset_token_id": row.id},
        ip_address=ip,
    )
    await db.commit()

    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={raw_token}"
    try:
        await send_password_reset_email(
            to_email=user.email,
            reset_url=reset_url,
            otp=otp,
            locale="en",
        )
    except Exception as e:  # mailer already swallows + logs; this is belt-and-braces
        logger.error("Password reset email failed for %s: %s", user.email, e)

    return ApiResponse(message=_generic_msg, data={"email": body.email})


async def _load_token_row(db: AsyncSession, raw_token: str) -> PasswordResetToken | None:
    return (
        await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == _hash_token(raw_token)
            )
        )
    ).scalar_one_or_none()


@router.post("/reset/verify-otp", response_model=ApiResponse)
async def verify_reset_otp(
    body: ResetVerifyOtpRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Page A: validate the 6-digit OTP for a given reset token.

    Returns 200 on a correct OTP, 400 on wrong/expired/used/locked tokens.
    Increments `otp_attempts` on each failure; locks the row at 5.
    """
    await _jitter_ms()
    row = await _load_token_row(db, body.token)

    if row is None:
        return _err(400, "expired", "Reset link is invalid or has expired.")

    if row.used_at is not None or row.expires_at <= datetime.utcnow():
        return _err(400, "expired", "Reset link is invalid or has expired.")

    if row.otp_attempts >= settings.PASSWORD_RESET_OTP_MAX_ATTEMPTS:
        return _err(
            400,
            "too_many_attempts",
            "Too many incorrect attempts. Please request a new link.",
        )

    expected = row.otp_hash
    actual = _hash_otp(body.otp)
    if not hmac.compare_digest(expected, actual):
        row.otp_attempts = (row.otp_attempts or 0) + 1
        await db.commit()
        if row.otp_attempts >= settings.PASSWORD_RESET_OTP_MAX_ATTEMPTS:
            return _err(
                400,
                "too_many_attempts",
                "Too many incorrect attempts. Please request a new link.",
            )
        return _err(400, "invalid_otp", "Incorrect verification code.")

    return ApiResponse(message="OTP verified.", data={"verified": True})


@router.post("/reset/confirm", response_model=ApiResponse)
async def confirm_password_reset(
    body: ResetConfirmRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Page B: re-validate token+OTP and set the new password.

    Defence in depth: a successful verify-otp does NOT bypass the OTP check
    here. We re-run the same lookup, expiry, lockout, and OTP comparison
    inside this transaction so a used/stale token can never commit a password
    change.
    """
    if (rl := await _enforce_ip_confirm_limit(request)) is not None:
        return rl
    await _jitter_ms()

    row = await _load_token_row(db, body.token)

    if row is None or row.used_at is not None or row.expires_at <= datetime.utcnow():
        return _err(400, "expired", "Reset link is invalid or has expired.")

    if row.otp_attempts >= settings.PASSWORD_RESET_OTP_MAX_ATTEMPTS:
        return _err(
            400,
            "too_many_attempts",
            "Too many incorrect attempts. Please request a new link.",
        )

    if not hmac.compare_digest(row.otp_hash, _hash_otp(body.otp)):
        # Clamp at MAX so a stale or parallel attempt can't push the counter past
        # the lockout boundary and desync with verify-otp's view.
        row.otp_attempts = min(
            (row.otp_attempts or 0) + 1,
            settings.PASSWORD_RESET_OTP_MAX_ATTEMPTS,
        )
        await db.commit()
        return _err(400, "invalid_otp", "Incorrect verification code.")

    user = await db.get(User, row.user_id)
    if user is None:
        return _err(400, "expired", "Reset link is invalid or has expired.")

    user.password_hash = hash_password(body.new_password)
    row.used_at = datetime.utcnow()
    ip = request.client.host if request.client else None

    # TODO(password-reset-followup): blacklist this user's outstanding refresh
    # tokens. The spec asks for `redis.setex("blacklist:{jti}", ...)` per
    # token, but refresh tokens are stateless JWTs that aren't tracked
    # server-side today. The proper fix is a `password_changed_at` column
    # checked in `decode_token` — model + migration + token decode change.
    # Out of scope for this round; logged here as a known gap.

    await log_audit(
        db=db,
        user_id=user.id,
        action="password_reset_completed",
        resource="user",
        resource_id=str(user.id),
        status="success",
        details={"reset_token_id": row.id},
        ip_address=ip,
    )
    await db.commit()

    return ApiResponse(
        message="Password has been reset. Please log in with your new password.",
        data={"user_id": user.id},
    )


@router.post("/logout", response_model=ApiResponse)
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
                logger.warning("Failed to blacklist token during logout: %s", e)

    json_response = JSONResponse(
        status_code=200,
        content=ApiResponse(success=True, data={"message": "Logged out successfully"}).model_dump(),
    )
    json_response.delete_cookie(key="refresh_token")
    json_response.delete_cookie(key="access_token")
    return json_response
