import logging
import time
import re
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.deps import rate_limit_check, get_current_user_from_request

# Maximum allowed request body size (10 MB)
MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024

logger = logging.getLogger("tonghua")
_log_level = logging.DEBUG if settings.APP_ENV == "development" else logging.INFO
logging.basicConfig(
    level=_log_level,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
# Ensure all "tonghua" loggers propagate and use the same level
logging.getLogger("tonghua").setLevel(_log_level)
logging.getLogger("tonghua.auth").setLevel(_log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if they don't exist
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception:
        logger.warning("Database initialization failed — mock data fallback will be used", exc_info=True)
    # Auto-seed demo data on first run (only when users table is empty)
    if settings.APP_ENV == "development":
        try:
            from app.security import hash_password
            from app.models.user import User
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                result = await session.execute(select(User))
                if result.scalars().first() is None:
                    logger.info("Seeding demo data...")
                    from app.seed import seed
                    await seed()
                    logger.info("Demo data seeded successfully.")
        except Exception:
            logger.warning("Demo data seeding failed (non-critical)", exc_info=True)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Tonghua Public Welfare x Sustainable Fashion — Backend API",
    lifespan=lifespan,
)

# Security: Only allow specific hosts
# Configure allowed hosts via CORS_ORIGINS or add a dedicated setting
# TrustedHostMiddleware expects hostnames (with optional port), e.g., "example.com" or "localhost:8000"
def extract_host(url: str) -> str:
    """Extract host:port from a URL or host string."""
    url = url.strip()
    if "://" in url:
        # Remove scheme (e.g., "https://") and path
        netloc = url.split("://", 1)[1].split("/", 1)[0]
    else:
        # No scheme, assume it's just host:port or domain
        netloc = url.split("/", 1)[0]
    return netloc

allowed_hosts = [extract_host(origin) for origin in settings.CORS_ORIGINS]
# Add localhost and localhost:8081 for development
allowed_hosts.extend(["localhost", "localhost:8081", "localhost:8080", "127.0.0.1", "127.0.0.1:8081"])
# Remove duplicates
allowed_hosts = list(set(allowed_hosts))
if not allowed_hosts:
    allowed_hosts = ["localhost"]
logger.info(f"Allowed hosts: {allowed_hosts}")
# Enable TrustedHostMiddleware in non-development environments
if settings.APP_ENV != "development":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# CORS - Restrict to specific origins (no wildcard)
logger.info(f"CORS Origins: {settings.CORS_ORIGINS}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "X-Signature",
        "X-Timestamp",
        "X-Nonce",
    ],
)


# ── Request size limit middleware ─────────────────────────────────
@app.middleware("http")
async def request_size_limit_middleware(request: Request, call_next):
    """Limit request body size to prevent DoS attacks."""
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            size = int(content_length)
            if size > MAX_REQUEST_BODY_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={
                        "success": False,
                        "data": None,
                        "message": "Request body too large",
                    },
                )
        except ValueError:
            pass
    response = await call_next(request)
    return response


# ── Signature verification middleware ─────────────────────────────────
# DISABLED: HMAC signing secret was exposed in the frontend bundle.
# Auth is handled by JWT Bearer tokens + httpOnly refresh cookies instead.
# The verification helper remains available in deps.py for future server-to-server use.


# ── Rate Limiting middleware (applied before logging) ────────────
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Apply rate limiting (skip for health check endpoint)
    if request.url.path == "/health":
        return await call_next(request)

    try:
        async with AsyncSessionLocal() as db:
            current_user = await get_current_user_from_request(request, db)
            await rate_limit_check(request, current_user)
    except HTTPException:
        raise
    except Exception as e:
        if settings.APP_ENV != "development":
            logger.error(f"Rate limiting error (failing closed): {e}", exc_info=True)
            return JSONResponse(
                status_code=503,
                content={"success": False, "data": None, "message": "Service temporarily unavailable"},
            )
        logger.warning(f"Rate limiting error (development mode, failing open): {e}", exc_info=True)
    response = await call_next(request)
    return response


# ── Security headers middleware ───────────────────────────────────
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    # Content Security Policy
    # Note: This is restrictive; adjust if serving specific assets or headers.
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ── Request logging middleware ───────────────────────────────────
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = time.time() - start
    logger.info(
        "%s %s %.3fs %d",
        request.method,
        request.url.path,
        elapsed,
        response.status_code,
    )
    response.headers["X-Process-Time"] = f"{elapsed:.3f}"
    return response


# ── Exception handlers ──────────────────────────────────────────
@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": None,
            "message": "Validation error",
            "errors": exc.errors() if hasattr(exc, "errors") else str(exc),
        },
    )


@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc):
    logger.error("Internal server error: %s %s", request.method, request.url.path, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "message": "Internal server error",
        },
    )


# Health check
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


# ── Register routers ─────────────────────────────────────────────
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.artworks import router as artworks_router
from app.routers.campaigns import router as campaigns_router
from app.routers.donations import router as donations_router
from app.routers.products import router as products_router
from app.routers.orders import router as orders_router
from app.routers.payments import router as payments_router
from app.routers.admin import router as admin_router
from app.routers.supply_chain import router as supply_chain_router
from app.routers.contact import router as contact_router
from app.routers.clothing_intakes import router as clothing_intakes_router
from app.routers.reviews import router as reviews_router
from app.routers.after_sales import router as after_sales_router
from app.routers.sustainability import router as sustainability_router
from app.routers.ai_assistant import router as ai_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(artworks_router, prefix="/api/v1")
app.include_router(campaigns_router, prefix="/api/v1")
app.include_router(donations_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(supply_chain_router, prefix="/api/v1")
app.include_router(contact_router, prefix="/api/v1")
app.include_router(clothing_intakes_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(after_sales_router, prefix="/api/v1")
app.include_router(sustainability_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
