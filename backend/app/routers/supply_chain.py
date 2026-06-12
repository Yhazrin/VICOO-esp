import json
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.supply_chain import SupplyChainRecord
from app.models.product import Product
from app.schemas import (
    ApiResponse,
    SupplyChainRecordCreate,
    SupplyChainRecordUpdate,
    PaginatedResponse,
    supply_chain_record_to_out,
)
from app.utils.content_locale import localize_product_name, localize_supply_chain_row
from app.deps import require_role

router = APIRouter(prefix="/supply-chain", tags=["Supply Chain"])

logger = logging.getLogger(__name__)

STAGES_ORDER = ["material_sourcing", "processing", "manufacturing", "quality_check", "shipping"]

_STATIC_ROOT = Path(__file__).resolve().parent.parent.parent / "static"
_TRACE_UPLOAD_DIR = _STATIC_ROOT / "uploads" / "traceability"
_MAX_TRACE_UPLOAD = 10 * 1024 * 1024
_ALLOWED_TRACE_MEDIA = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}

from app.services.supply_chain.service import SupplyChainService


@router.post("/media/upload", response_model=ApiResponse)
async def upload_trace_media(
    file: UploadFile = File(...),
    _current_user: dict = Depends(require_role("admin")),
):
    """Upload traceability node image/video to local static, returns relative URL for gallery (/static/...)."""
    body = await file.read()
    if len(body) > _MAX_TRACE_UPLOAD:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")
    ct = (file.content_type or "").split(";")[0].strip().lower()
    ext = _ALLOWED_TRACE_MEDIA.get(ct)
    if not ext:
        raise HTTPException(
            status_code=400,
            detail="Unsupported type; use jpeg/png/webp/gif or mp4/webm/mov",
        )
    _TRACE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    path = _TRACE_UPLOAD_DIR / name
    path.write_bytes(body)
    url = f"/static/uploads/traceability/{name}"
    return ApiResponse(data={"url": url, "mime": ct})

@router.get("/records", response_model=PaginatedResponse)
async def list_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: int | None = Query(None),
    stage: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List supply chain records with optional filters. (Refactored)"""
    sc_service = SupplyChainService(db)
    try:
        # Mirror /trace lazy-backfill so admin sees the same nodes as the storefront.
        if product_id is not None:
            await sc_service.ensure_supply_chain_records(product_id)

        stmt = select(SupplyChainRecord)
        if product_id is not None:
            stmt = stmt.where(SupplyChainRecord.product_id == product_id)
        if stage:
            stmt = stmt.where(SupplyChainRecord.stage == stage)
        
        count_stmt = select(func.count(SupplyChainRecord.id))
        if product_id is not None:
            count_stmt = count_stmt.where(SupplyChainRecord.product_id == product_id)
        if stage:
            count_stmt = count_stmt.where(SupplyChainRecord.stage == stage)
            
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(SupplyChainRecord.timestamp.asc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        records = result.scalars().all()
        
        return PaginatedResponse(
            data=[supply_chain_record_to_out(r).model_dump() for r in records],
            total=total,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error listing records: %s", e)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")

@router.get("/trace/{product_id}", response_model=ApiResponse)
async def trace_product(
    product_id: int,
    locale: str = Query("zh", pattern="^(zh|en)$"),
    db: AsyncSession = Depends(get_db),
):
    """Get full supply chain trace for a product. (Refactored)"""
    sc_service = SupplyChainService(db)
    try:
        # Check product existence
        product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        timeline = await sc_service.get_sustainability_timeline(product_id)
        product_name = product.name or ""
        display_name = localize_product_name(product_name, getattr(product, "name_en", None), locale)
        records = [localize_supply_chain_row(row, product_name, locale) for row in timeline]
        return ApiResponse(data={
            "product_id": product_id,
            "product_name": display_name,
            "records": records,
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Tracing failed: %s", e)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")

@router.post("/records", response_model=ApiResponse, status_code=201)
async def create_record(
    body: SupplyChainRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Create a new supply chain record (admin only). (Refactored)"""
    sc_service = SupplyChainService(db)
    try:
        payload = body.model_dump()
        if payload.get("gallery"):
            payload["gallery_json"] = json.dumps(payload["gallery"])
        payload.pop("gallery", None)
        record = await sc_service.add_record(body.product_id, payload, current_user=current_user)
        return ApiResponse(data=supply_chain_record_to_out(record).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create record: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/records/{record_id}", response_model=ApiResponse)
async def patch_record(
    record_id: int,
    body: SupplyChainRecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Update a supply chain record (admin). Gallery replaces entire list when sent."""
    sc_service = SupplyChainService(db)
    try:
        payload = body.model_dump(exclude_unset=True)
        record = await sc_service.update_record(record_id, payload, current_user=current_user)
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        return ApiResponse(data=supply_chain_record_to_out(record).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update record: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/records/{record_id}", response_model=ApiResponse)
async def delete_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Delete a supply chain record (admin/editor)."""
    sc_service = SupplyChainService(db)
    try:
        deleted = await sc_service.delete_record(record_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Record not found")
        return ApiResponse(data={"deleted": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete record: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")