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
from app.deps import rate_limit_check, get_current_user_from_request

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
    # Auto-seed demo data：development 默认执行；production/staging 需 SEED_IF_EMPTY=true 且库中无用户时执行
    _seed_if_empty = settings.APP_ENV == "development" or getattr(
        settings, "SEED_IF_EMPTY", False
    )
    if _seed_if_empty:
        try:
            from app.models.user import User
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                result = await session.execute(select(User))
                if result.scalars().first() is None:
                    logger.info("Seeding demo data (empty database)...")
                    from app.seed import seed
                    await seed()
                    logger.info("Demo data seeded successfully.")
        except Exception:
            logger.warning("Demo data seeding failed (non-critical)", exc_info=True)

    # Backfill product i18n fields on every startup (idempotent — only updates rows where name_en is null)
    try:
        from app.backfill_product_i18n import run as backfill_i18n
        await backfill_i18n()
        logger.info("Product i18n backfill complete.")
    except Exception:
        logger.warning("Product i18n backfill failed (non-critical)", exc_info=True)

    # 修复旧库：中文类目、is_impact_product 未维护时，公益 / 优衣库常规分流错误（幂等，全环境执行）
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
            if size > MAX_REQUEST_BODY_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={"success": False, "data": None, "message": "Request body too large"},
                )
        except ValueError:
            pass
    return await call_next(request)

# Rate Limiting — fail-open: let the request through when rate-limit infra is broken
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if "/health" in request.url.path:
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
from fastapi import APIRouter
health_router = APIRouter(tags=["Health"])

@health_router.get("/health")
async def health():
    health_data = {
        "status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION, "timestamp": time.time(),
        "services": {"database": "unknown", "redis": "unknown"}
    }
    try:
        async with AsyncSessionLocal() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
            health_data["services"]["database"] = "healthy"
    except Exception as e:
        health_data["services"]["database"] = "unhealthy"
        health_data["status"] = "degraded"
    
    if settings.REDIS_URL:
        try:
            import redis.asyncio as redis
            r = redis.from_url(settings.REDIS_URL, socket_timeout=2)
            try:
                await r.ping()
                health_data["services"]["redis"] = "healthy"
            finally:
                await r.aclose()
        except Exception as e:
            logger.debug("Redis health check failed: %s", e)
            health_data["services"]["redis"] = "unhealthy"
    return health_data

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

# 静态资源：溯源媒体上传、证书图等（/static/...）
_STATIC_ROOT = Path(__file__).resolve().parent.parent / "static"
_STATIC_ROOT.mkdir(parents=True, exist_ok=True)
(_STATIC_ROOT / "uploads" / "traceability").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_STATIC_ROOT)), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
