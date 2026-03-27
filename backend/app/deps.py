from typing import Optional
import logging
import hmac
import hashlib

from fastapi import Depends, HTTPException, Header, Request
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import time

from app.database import get_db
from app.models.user import User
from app.security import decode_token
from app.config import settings

# Configure logger
logger = logging.getLogger(__name__)

# Redis client for rate limiting
redis_client = None


async def get_redis_client():
    """Get or create Redis client for rate limiting."""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Extract the current user from the JWT token in the Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Try DB lookup
    sub = payload["sub"]
    try:
        user_id = int(sub)
    except (ValueError, TypeError):
        # WeChat openid (non-numeric subject) — no DB lookup possible
        raise HTTPException(status_code=401, detail="User not found")

    try:
        from sqlalchemy import select

        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user and user.status == "banned":
            raise HTTPException(status_code=403, detail="User is banned")
        if user:
            return {"id": user.id, "email": user.email, "role": user.role, "nickname": user.nickname}
    except HTTPException:
        raise
    except Exception:
        # Fail closed: do not fall back to token payload when DB is unavailable
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")

    # User not found in DB — reject rather than trusting the token payload
    raise HTTPException(status_code=401, detail="User not found")


def require_role(*roles: str):
    """Dependency factory that enforces the current user has one of the specified roles."""

    async def _check(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user

    return _check


async def rate_limit_check(request: Request, current_user: Optional[dict] = None) -> bool:
    """Rate limiting using Redis sliding window algorithm.

    Limits:
    - Global: 1000 requests per minute (for all requests)
    - User: 60 requests per minute (for authenticated users)
    - Public endpoints: 20 requests per minute per IP (for login/register/reset)

    Returns True if the request is allowed, raises HTTPException 429 if rate limited.
    """
    # Skip rate limiting in development mode when Redis is not available
    is_development = settings.APP_ENV == "development"

    try:
        redis_client = await get_redis_client()

        # Get client IP for global rate limiting
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host or "unknown"

        current_time = time.time()

        # Global rate limit: 1000 requests per minute
        global_key = f"rate_limit:global:{int(current_time // 60)}"
        try:
            global_count = await redis_client.incr(global_key)
            if global_count == 1:
                await redis_client.expire(global_key, 60)  # 1 minute window
            if global_count > settings.GLOBAL_RATE_LIMIT:
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests. Please slow down."
                )
        except redis.RedisError as e:
            # Fail open in development mode, fail closed in production
            if is_development:
                logger.warning(f"Redis connection failed during global rate limiting (development mode): {e}")
            else:
                logger.error(f"Redis connection failed during global rate limiting: {e}")
                raise HTTPException(status_code=503, detail="Service temporarily unavailable")

        # Public endpoint rate limit: 20 requests per minute per IP for auth endpoints
        public_endpoints = ["/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh", "/api/v1/auth/wx-login"]
        if request.url.path in public_endpoints:
            public_key = f"rate_limit:public:{client_ip}:{int(current_time // 60)}"
            try:
                public_count = await redis_client.incr(public_key)
                if public_count == 1:
                    await redis_client.expire(public_key, 60)  # 1 minute window
                if public_count > 20:
                    raise HTTPException(
                        status_code=429,
                        detail="Too many requests. Please try again later."
                    )
            except redis.RedisError as e:
                # Fail open in development mode, fail closed in production
                if is_development:
                    logger.warning(f"Redis connection failed during public endpoint rate limiting (development mode): {e}")
                else:
                    logger.error(f"Redis connection failed during public endpoint rate limiting: {e}")
                    raise HTTPException(status_code=503, detail="Service temporarily unavailable")

        # User-specific rate limit: 60 requests per minute (if authenticated)
        if current_user and "id" in current_user:
            user_id = current_user["id"]
            user_key = f"rate_limit:user:{user_id}:{int(current_time // 60)}"
            try:
                user_count = await redis_client.incr(user_key)
                if user_count == 1:
                    await redis_client.expire(user_key, 60)  # 1 minute window
                if user_count > settings.USER_RATE_LIMIT:
                    raise HTTPException(
                        status_code=429,
                        detail="Too many requests. Please slow down."
                    )
            except redis.RedisError as e:
                # Fail open in development mode, fail closed in production
                if is_development:
                    logger.warning(f"Redis connection failed during user rate limiting (development mode): {e}")
                else:
                    logger.error(f"Redis connection failed during user rate limiting: {e}")
                    raise HTTPException(status_code=503, detail="Service temporarily unavailable")

        return True
    except HTTPException:
        raise
    except Exception as e:
        # Fail closed in production: deny request when rate limiting is broken
        if is_development:
            logger.warning(f"Rate limiting error (development mode, failing open): {e}", exc_info=True)
            return True
        logger.error(f"Rate limiting error (failing closed): {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


async def get_current_user_from_request(request: Request, db: AsyncSession) -> Optional[dict]:
    """Try to extract current user from request without raising exceptions."""
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        return None

    parts = authorization.split(" ", 1)
    if len(parts) < 2:
        return None
    token = parts[1]
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None

        # Try DB lookup
        sub = payload["sub"]
        try:
            user_id = int(sub)
        except (ValueError, TypeError):
            # WeChat openid (non-numeric subject) — no DB lookup possible
            return None

        try:
            from sqlalchemy import select
            stmt = select(User).where(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            if user and user.status == "banned":
                return None
            if user:
                return {"id": user.id, "email": user.email, "role": user.role, "nickname": user.nickname}
        except Exception:
            # Fail closed: do not fall back to token payload when DB is unavailable
            return None

        # User not found in DB — reject
        return None
    except Exception:
        return None


async def get_optional_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[dict]:
    """Return the current user dict or None if not authenticated (no exception)."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        sub = payload["sub"]
        try:
            user_id = int(sub)
        except (ValueError, TypeError):
            return None
        from sqlalchemy import select
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user and user.status == "banned":
            return None
        if user:
            return {"id": user.id, "email": user.email, "role": user.role, "nickname": user.nickname}
    except Exception:
        return None
    return None


async def verify_request_signature(request: Request) -> tuple[bool, Optional[str]]:
    """验证请求签名 (HMAC-SHA256) 和防重放攻击。

    验证步骤：
    1. 检查必需的请求头：X-Signature, X-Timestamp, X-Nonce
    2. 验证时间戳（5分钟窗口）
    3. 验证 nonce（防重放）
    4. 验证 HMAC-SHA256 签名

    Returns:
        tuple[bool, Optional[str]]: (是否验证通过, 失败原因 message)
    """
    # 检查必需的请求头
    signature = request.headers.get("X-Signature")
    timestamp_str = request.headers.get("X-Timestamp")
    nonce = request.headers.get("X-Nonce")

    if not signature:
        return False, "Missing X-Signature header"
    if not timestamp_str:
        return False, "Missing X-Timestamp header"
    if not nonce:
        return False, "Missing X-Nonce header"

    # 1. 验证时间戳 (防重放窗口：5分钟)
    try:
        timestamp = int(timestamp_str)
        current_time = int(time.time())
        if abs(current_time - timestamp) > 300:  # 5分钟窗口
            logger.warning(
                f"Signature timestamp expired: {timestamp}, current: {current_time}, "
                f"path: {request.method} {request.url.path}"
            )
            return False, "Request expired"
    except ValueError:
        logger.warning(f"Invalid timestamp format: {timestamp_str}")
        return False, "Invalid timestamp format"

    # 2. 验证 Nonce (防重放攻击)
    try:
        redis_client = await get_redis_client()
        nonce_key = f"nonce:{nonce}"

        # 检查 nonce 是否已存在（重放攻击）
        if await redis_client.exists(nonce_key):
            logger.warning(f"Duplicate nonce detected: {nonce}, path: {request.method} {request.url.path}")
            return False, "Duplicate request (replay attack detected)"

        # 设置 nonce 过期时间（与时间戳窗口一致）
        await redis_client.setex(nonce_key, 300, "1")
    except Exception as e:
        logger.error(f"Redis error during nonce check: {e}")
        # Redis 不可用时，为了安全起见拒绝请求
        return False, "Service temporarily unavailable"

    # 3. 验证签名 (HMAC-SHA256)
    try:
        body_bytes = await request.body()
        body = body_bytes.decode("utf-8")
    except UnicodeDecodeError:
        # 如果 body 不是 UTF-8，使用空字符串（对于二进制数据需特殊处理）
        body = ""

    # 构建签名字符串：method + "\n" + path + "\n" + timestamp + "\n" + nonce + "\n" + body
    string_to_sign = f"{request.method}\n{request.url.path}\n{timestamp_str}\n{nonce}\n{body}"

    # HMAC-SHA256 计算
    secret_key = settings.APP_SECRET_KEY
    if isinstance(secret_key, str):
        secret_key = secret_key.encode('utf-8')

    expected_signature = hmac.new(
        secret_key,
        string_to_sign.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # 使用 constant-time comparison 防止时序攻击
    if not hmac.compare_digest(expected_signature, signature):
        logger.warning(
            f"Invalid signature for {request.method} {request.url.path}"
        )
        return False, "Invalid signature"

    # 所有验证通过
    logger.info(f"Signature verified successfully for {request.method} {request.url.path}")
    return True, None
