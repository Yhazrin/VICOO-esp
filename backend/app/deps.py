from typing import Optional
import asyncio
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
_redis_lock = asyncio.Lock()


async def get_redis_client():
    """Get or create Redis client for rate limiting."""
    global redis_client
    if redis_client is None:
        async with _redis_lock:
            if redis_client is None:
                redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client


async def is_token_blacklisted(jti: str) -> bool:
    """Check if a token's JTI is in the Redis blacklist.

    Fail-closed: raise on Redis errors so logged-out tokens are never
    accepted during a Redis outage.
    """
    if not jti:
        return False
    try:
        client = await get_redis_client()
        return await client.exists(f"blacklist:{jti}")
    except Exception as e:
        logger.error(f"Redis error during blacklist check: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


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
        
        # Check blacklist
        if await is_token_blacklisted(payload.get("jti")):
            raise HTTPException(status_code=401, detail="Token has been invalidated (logged out)")
            
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
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.status == "banned":
            raise HTTPException(status_code=403, detail="User is banned")
        
        # Return the actual user object or a dict with the role value
        role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
        return {
            "id": user.id, 
            "email": user.email, 
            "role": role_value, 
            "nickname": user.nickname,
            "user_obj": user  # Include the full object for complex checks
        }
    except HTTPException:
        raise
    except Exception as e:
        # Fail closed: do not fall back to token payload when DB is unavailable
        logger.error("get_current_user failed: %s", e)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


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
        public_endpoints = [
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/auth/wx-login",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/api/v1/auth/wx-login",
        ]
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
            
        # Check blacklist
        if await is_token_blacklisted(payload.get("jti")):
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
                role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
                return {"id": user.id, "email": user.email, "role": role_value, "nickname": user.nickname}
        except Exception as e:
            # Fail closed: do not fall back to token payload when DB is unavailable
            logger.warning("get_current_user_from_request DB lookup failed: %s", e)
            return None

        # User not found in DB — reject
        return None
    except Exception as e:
        logger.warning("get_current_user_from_request token parse failed: %s", e)
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
            
        # Check blacklist
        if await is_token_blacklisted(payload.get("jti")):
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
            role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
            return {"id": user.id, "email": user.email, "role": role_value, "nickname": user.nickname}
    except Exception as e:
        logger.warning("get_optional_current_user failed: %s", e)
        return None
    return None


async def verify_request_signature(request: Request) -> tuple[bool, Optional[str]]:
    """Verify request signature (HMAC-SHA256) and prevent replay attacks.

    Steps:
    1. Check required headers: X-Signature, X-Timestamp, X-Nonce
    2. Validate timestamp (5-minute window)
    3. Validate nonce (replay prevention)
    4. Verify HMAC-SHA256 signature

    Returns:
        tuple[bool, Optional[str]]: (passed, failure reason message)
    """
    # Check required headers
    signature = request.headers.get("X-Signature")
    timestamp_str = request.headers.get("X-Timestamp")
    nonce = request.headers.get("X-Nonce")

    if not signature:
        return False, "Missing X-Signature header"
    if not timestamp_str:
        return False, "Missing X-Timestamp header"
    if not nonce:
        return False, "Missing X-Nonce header"

    # 1. Validate timestamp (anti-replay window: 5 minutes)
    try:
        timestamp = int(timestamp_str)
        current_time = int(time.time())
        if abs(current_time - timestamp) > 300:  # 5-minute window
            logger.warning(
                f"Signature timestamp expired: {timestamp}, current: {current_time}, "
                f"path: {request.method} {request.url.path}"
            )
            return False, "Request expired"
    except ValueError:
        logger.warning(f"Invalid timestamp format: {timestamp_str}")
        return False, "Invalid timestamp format"

    # 2. Validate nonce (replay attack prevention)
    try:
        redis_client = await get_redis_client()
        nonce_key = f"nonce:{nonce}"

        # Check if nonce already exists (replay attack)
        if await redis_client.exists(nonce_key):
            logger.warning(f"Duplicate nonce detected: {nonce}, path: {request.method} {request.url.path}")
            return False, "Duplicate request (replay attack detected)"

        # Set nonce expiry (matches timestamp window)
        await redis_client.setex(nonce_key, 300, "1")
    except Exception as e:
        logger.error(f"Redis error during nonce check: {e}")
        # Reject request when Redis is unavailable for safety
        return False, "Service temporarily unavailable"

    # 3. Verify signature (HMAC-SHA256)
    try:
        body_bytes = await request.body()
        body = body_bytes.decode("utf-8")
    except UnicodeDecodeError:
        # Use empty string for non-UTF-8 bodies (binary data needs special handling)
        body = ""

    # Build signing string: method + "\n" + path + "\n" + timestamp + "\n" + nonce + "\n" + body
    string_to_sign = f"{request.method}\n{request.url.path}\n{timestamp_str}\n{nonce}\n{body}"

    # HMAC-SHA256 computation
    secret_key = settings.APP_SECRET_KEY
    if isinstance(secret_key, str):
        secret_key = secret_key.encode('utf-8')

    expected_signature = hmac.new(
        secret_key,
        string_to_sign.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Use constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(expected_signature, signature):
        logger.warning(
            f"Invalid signature for {request.method} {request.url.path}"
        )
        return False, "Invalid signature"

    # 所有验证通过
    logger.info(f"Signature verified successfully for {request.method} {request.url.path}")
    return True, None
