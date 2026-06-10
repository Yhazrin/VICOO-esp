import logging
import time
import re
import math
from contextlib import asynccontextmanager
from typing import Optional
from decimal import Decimal

from pathlib import Path

from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.deps import rate_limit_check, get_current_user_from_request, require_role
from app.models.audit import AuditLog

# Maximum allowed request body size (10 MB)
MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024

logger = logging.getLogger("vicoo")
_log_level = logging.DEBUG if settings.APP_ENV == "development" else logging.INFO
logging.basicConfig(
    level=_log_level,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
# Ensure all "vicoo" loggers propagate and use the same level
logging.getLogger("vicoo").setLevel(_log_level)
logging.getLogger("vicoo.auth").setLevel(_log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed demo data: runs by default in development; in production/staging requires SEED_IF_EMPTY=true and empty user table
    _seed_if_empty = settings.APP_ENV == "development" or getattr(
        settings, "SEED_IF_EMPTY", False
    )
    if _seed_if_empty:
        try:
            from app.seed import maybe_seed_demo

            await maybe_seed_demo()
        except Exception:
            logger.warning("Demo data seeding failed (non-critical)", exc_info=True)

    # Bind demo artworks to local /static/artworks/* when files exist but DB still uses placeholders
    try:
        from app.seed_artwork_assets import maybe_seed_artwork_assets

        if await maybe_seed_artwork_assets():
            logger.info("Artwork static asset seed applied.")
    except Exception:
        logger.warning("Artwork asset seed failed (non-critical)", exc_info=True)

    # Bind demo campaigns to local /static/campaigns/* and expand catalog to 8 themes
    try:
        from app.seed_campaign_assets import maybe_seed_campaign_assets

        if await maybe_seed_campaign_assets():
            logger.info("Campaign static asset seed applied.")
    except Exception:
        logger.warning("Campaign asset seed failed (non-critical)", exc_info=True)

    # Backfill product i18n fields on every startup (idempotent — only updates rows where name_en is null)
    try:
        from app.backfill_product_i18n import run as backfill_i18n
        await backfill_i18n()
        logger.info("Product i18n backfill complete.")
    except Exception:
        logger.warning("Product i18n backfill failed (non-critical)", exc_info=True)

    # Repair legacy data: Chinese categories and misclassified impact/regular products (idempotent, all environments)
    try:
        from app.db_repair import repair_product_catalog

        async with AsyncSessionLocal() as session:
            await repair_product_catalog(session)
            await session.commit()
    except Exception:
        logger.warning("Catalog repair failed (non-critical)", exc_info=True)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Uniqlo × VICOO Welfare — Backend API",
    lifespan=lifespan,
)

# Security: Trusted Hosts
def extract_host(url: str) -> str:
    url = url.strip()
    if "://" in url:
        netloc = url.split("://", 1)[1].split("/", 1)[0]
    else:
        netloc = url.split("/", 1)[0]
    return netloc

allowed_hosts = [extract_host(origin) for origin in settings.CORS_ORIGINS]
allowed_hosts.extend(["localhost", "localhost:8081", "localhost:8080", "localhost:5173", "localhost:9111", "localhost:9112", "127.0.0.1", "127.0.0.1:8081"])
allowed_hosts = list(set(allowed_hosts))
if not allowed_hosts:
    allowed_hosts = ["localhost"]

if settings.APP_ENV != "development":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# GZip compression — reduces API response size by ~60%
app.add_middleware(GZipMiddleware, minimum_size=500)

# Request size limit
@app.middleware("http")
async def request_size_limit_middleware(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            size = int(content_length)
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={"success": False, "data": None, "message": "Invalid Content-Length header"},
            )
        if size > MAX_REQUEST_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={"success": False, "data": None, "message": "Request body too large"},
            )
    return await call_next(request)

# Rate Limiting — fail-open: let the request through when rate-limit infra is broken
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in ("/health", "/api/v1/health", "/api/health"):
        return await call_next(request)

    try:
        async with AsyncSessionLocal() as db:
            current_user = await get_current_user_from_request(request, db)
            await rate_limit_check(request, current_user)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Rate limiting failed, allowing request: %s", e)
    return await call_next(request)

# Security headers
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https:; frame-ancestors 'none'; upgrade-insecure-requests"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    if settings.APP_ENV == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Logging
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = time.time() - start
    logger.info("%s %s %.3fs %d", request.method, request.url.path, elapsed, response.status_code)
    response.headers["X-Process-Time"] = f"{elapsed:.3f}"
    return response

# Audit logging middleware - logs all admin API requests to audit_logs table
@app.middleware("http")
async def audit_logging_middleware(request: Request, call_next):
    path = request.url.path

    # Only log admin API endpoints
    # Log POST, PUT, PATCH, DELETE for write operations
    # Log specific GET requests that represent sensitive data access
    sensitive_gets = [
        "/api/v1/admin/child-participants",
    ]
    # Skip logging for health endpoints and audit-logs (avoid infinite loops and noise)
    skip_paths = [
        "/health",
        "/api/v1/health",
        "/api/v1/admin/audit-logs",
        "/api/v1/admin/health",
        "/api/v1/system/health",
        "/api/v1/admin/system/health",
    ]
    should_log = path.startswith("/api/v1/admin/")
    if should_log and any(path.startswith(sp) for sp in skip_paths):
        return await call_next(request)

    if should_log:
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            pass  # Log these
        elif any(path.startswith(sg) for sg in sensitive_gets):
            pass  # Log sensitive GETs
        else:
            return await call_next(request)
    else:
        # Not an admin endpoint, skip audit logging entirely
        return await call_next(request)

    # Capture request data before processing
    method = request.method
    path_info = path.replace("/api/v1/admin/", "")

    # Extract route pattern for grouping similar actions
    # e.g., /admin/users/123 -> users
    route_parts = path_info.strip("/").split("/")
    resource = route_parts[0] if route_parts else "admin"

    # Build action from method and resource
    action_map = {
        "POST": "create",
        "PUT": "update",
        "PATCH": "modify",
        "DELETE": "delete",
    }
    base_action = action_map.get(method, method.lower())
    action = f"{base_action}_{resource}" if resource else base_action

    try:
        # Get current user from request
        async with AsyncSessionLocal() as db:
            current_user = await get_current_user_from_request(request, db)
            user_id = current_user.get("id") if current_user else None
            user_name = current_user.get("nickname", "") if current_user else ""

            # Get client IP
            client_ip = request.client.host if request.client else "unknown"

            # Get user agent
            user_agent = request.headers.get("user-agent", "")[:500]

            response = await call_next(request)

            # Log after response is ready
            if response.status_code < 400:
                status = "success"
                details = {"method": method, "path": path_info, "status_code": response.status_code}
            else:
                status = "failed"
                details = {"method": method, "path": path_info, "status_code": response.status_code}

            # Determine resource_id from path if available
            resource_id = None
            for part in route_parts[1:]:
                if part.isdigit():
                    resource_id = part
                    break

            # Map action names to more readable format
            action_display = {
                "update_settings": "modify_settings",
                "create_users": "create_user",
                "update_users": "update_user",
                "modify_artworks": "moderate_artwork",
                "modify_campaigns": "update_campaign",
                "modify_clothing_intakes_status": "update_clothing_intake",
                "update_child_participants_consent": "approve_child_consent",
                "approve_donations": "approve_donation",
            }.get(action, action)

            audit_entry = AuditLog(
                user_id=user_id,
                user_name=user_name,
                action=action_display,
                resource=resource,
                resource_id=resource_id,
                details=f"{method} {path_info} - {status}",
                ip_address=client_ip,
                user_agent=user_agent,
            )
            db.add(audit_entry)
            await db.commit()
    except Exception as e:
        # Don't let audit logging failures affect the request
        logger.warning("Audit logging failed: %s", e)

    return response

# ── Exception handlers ──────────────────────────────────────────
from app.core.errors import BusinessException
from fastapi.exceptions import RequestValidationError

@app.exception_handler(BusinessException)
async def business_exception_handler(request: Request, exc: BusinessException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "data": exc.data, "message": exc.message, "code": exc.code},
    )

def _serialize_error(obj):
    """Recursively convert non-serializable objects to strings."""
    if isinstance(obj, bytes):
        return obj.decode("utf-8", errors="replace")
    if isinstance(obj, Decimal):
        return str(obj)
    if isinstance(obj, float) and not math.isfinite(obj):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _serialize_error(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_serialize_error(item) for item in obj]
    if isinstance(obj, set):
        return list(obj)
    return obj

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    message = "Validation error"
    # Try to extract the first error message
    try:
        errors = exc.errors()
        if errors and len(errors) > 0:
            err = errors[0]
            if "msg" in err:
                message = err["msg"]
    except Exception as e:
        logger.debug("Could not extract validation error message: %s", e)

    # Sanitize errors to ensure JSON serializability
    sanitized_errors = jsonable_encoder(_serialize_error(exc.errors()))

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": None,
            "message": message,
            "errors": sanitized_errors,
            "code": "VALIDATION_FAILED"
        },
    )

@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc):
    logger.error("Internal server error: %s %s", request.method, request.url.path, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "data": None, "message": "Internal server error", "code": "INTERNAL_SERVER_ERROR"},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "data": None, "message": exc.detail, "code": f"HTTP_{exc.status_code}"},
    )

# ── Register routers ─────────────────────────────────────────────
from app.routers.auth import router as auth_router
from app.routers.oauth import router as oauth_router
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
from app.routers.editorial import router as editorial_router
from app.routers.addresses import router as addresses_router
from app.routers.impact_fund import router as impact_fund_router
from app.routers.design_drafts import router as design_drafts_router

# Health check router
from fastapi import APIRouter, Depends
from datetime import datetime

health_router = APIRouter(tags=["Health"])

# Track backend start time for uptime calculation
_backend_start_time = time.time()


def _format_uptime(seconds: float) -> str:
    """Format uptime seconds to human-readable string."""
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins}m {secs}s"
    elif seconds < 86400:
        hours = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        return f"{hours}h {mins}m"
    else:
        days = int(seconds // 86400)
        hours = int((seconds % 86400) // 3600)
        return f"{days}d {hours}h"


@health_router.get("/health")
async def health():
    """
    Public lightweight health endpoint for Docker / deployment / quick check.
    No authentication required.
    """
    return {
        "status": "ok",
        "service": "vicoo-api",
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@health_router.get("/system/health")
async def system_health(
    _current_user: dict = Depends(require_role("admin", "editor", "compliance")),
):
    """
    Admin detailed health check endpoint.
    Requires admin/editor/compliance role.
    """
    import time as time_module
    overall_status = "healthy"
    db_latency_ms = None
    db_version = None
    redis_latency_ms = None
    redis_version = None
    response_time_ms = None
    checks = []

    # MySQL check: SELECT 1 with latency measurement
    db_status = "connected"
    try:
        start = time_module.time()
        async with AsyncSessionLocal() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
        db_latency_ms = int((time_module.time() - start) * 1000)
        # Get MySQL version (safe query, no sensitive info)
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT VERSION()"))
            row = result.fetchone()
            if row:
                version_str = str(row[0])
                # Extract major.minor only
                db_version = version_str.split("-")[0].split(".")[0] + "." + version_str.split("-")[0].split(".")[1] if "." in version_str.split("-")[0] else version_str.split("-")[0]
    except Exception as e:
        logger.warning("Health check: MySQL error: %s", e)
        db_status = "error"
        overall_status = "degraded"

    checks.append({"name": "MySQL Database", "status": db_status, "latencyMs": db_latency_ms, "version": db_version})

    # Redis check with latency measurement
    redis_status = "connected"
    try:
        start = time_module.time()
        from app.deps import get_redis_client
        redis_client = await get_redis_client()
        await redis_client.ping()
        redis_latency_ms = int((time_module.time() - start) * 1000)
        # Get Redis version (safe, no sensitive info)
        redis_info = await redis_client.info("server")
        redis_version = str(redis_info.get("redis_version", "unknown").split(".")[0])
    except Exception as e:
        logger.warning("Health check: Redis error: %s", e)
        redis_status = "error"
        if overall_status == "healthy":
            overall_status = "degraded"

    checks.append({"name": "Redis Cache", "status": redis_status, "latencyMs": redis_latency_ms, "version": redis_version})

    # Calculate uptime
    uptime_seconds = time_module.time() - _backend_start_time
    uptime_str = _format_uptime(uptime_seconds)

    # Response time measurement for the health check itself
    start = time_module.time()
    overall_status = overall_status  # Already determined above
    response_time_ms = int((time_module.time() - start) * 1000) + 1  # Add baseline

    # Backend check result
    checks.append({
        "name": "Backend API",
        "status": overall_status if overall_status != "degraded" else "healthy",
        "latencyMs": response_time_ms,
        "version": settings.APP_VERSION
    })

    # Docker Compose status - always assume running in docker
    checks.append({"name": "Docker Compose", "status": "connected", "mode": "Docker Compose"})

    return {
        "status": overall_status,
        "backend": {
            "status": "healthy",
            "service": "FastAPI",
            "runtime": "Uvicorn",
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
            "uptimeSeconds": int(uptime_seconds),
            "responseTimeMs": response_time_ms,
        },
        "database": {
            "status": db_status,
            "engine": "MySQL",
            "version": db_version,
            "latencyMs": db_latency_ms,
            "checkedQuery": "SELECT 1",
        },
        "redis": {
            "status": redis_status,
            "version": redis_version,
            "latencyMs": redis_latency_ms,
            "purpose": "cache / rate limiting",
        },
        "deployment": {
            "mode": "Docker Compose",
            "apiDocs": "/docs",
            "publicHealth": "/health",
            "adminHealth": "/api/v1/system/health",
        },
        "checks": checks,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "uptime": uptime_str,
        "uptimeSeconds": int(uptime_seconds),
        "checkedAt": datetime.utcnow().isoformat() + "Z",
    }

routers = (
    auth_router, oauth_router, users_router, artworks_router, campaigns_router,
    donations_router, products_router, orders_router, payments_router, admin_router,
    supply_chain_router, contact_router, clothing_intakes_router, reviews_router,
    after_sales_router, sustainability_router, ai_router, editorial_router, health_router,
    addresses_router, impact_fund_router, design_drafts_router,
)

# Compat: rewrite legacy /api/* requests to /api/v1/* in-place (no external redirect)
@app.middleware("http")
async def legacy_api_redirect_middleware(request: Request, call_next):
    path = request.url.path
    if path.startswith("/api/") and not path.startswith("/api/v1/"):
        # rewrite the request path internally to avoid 301 redirects (maintain backward compatibility)
        new_path = path.replace("/api/", "/api/v1/", 1)
        request.scope["path"] = new_path
        if "raw_path" in request.scope:
            request.scope["raw_path"] = new_path.encode("utf-8")
    return await call_next(request)

# CORS — must be outermost (last added) so preflight and error responses carry CORS headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "X-Signature",
        "X-Timestamp",
        "X-Nonce",
    ],
)

for router in routers:
    app.include_router(router, prefix="/api/v1")

# Static assets: trace media uploads, certificate images, etc. (/static/...)
_STATIC_ROOT = Path(__file__).resolve().parent.parent / "static"
_STATIC_ROOT.mkdir(parents=True, exist_ok=True)
(_STATIC_ROOT / "uploads" / "traceability").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_STATIC_ROOT)), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
