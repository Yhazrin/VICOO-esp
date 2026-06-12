"""Clothing donation intake: register → process → publish as product."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.circular_commerce import ClothingIntake
from app.models.attachment import Attachment
from app.models.product import Product
from app.schemas import (
    ApiResponse,
    ClothingIntakeCreate,
    ClothingIntakeOut,
    ClothingIntakeStatusUpdate,
    PaginatedResponse,
    ProductOut,
    PublishFromIntakeBody,
)
from app.deps import get_current_user, require_role
from app.core.audit import log_audit

router = APIRouter(prefix="/clothing-intakes", tags=["Clothing Intakes"])
logger = logging.getLogger(__name__)


async def _persist_attachments(
    db: AsyncSession,
    *,
    owner_type: str,
    owner_id: int,
    urls: list[str],
    uploader_user_id: int,
) -> list[str]:
    """Materialise uploaded file URLs as Attachment rows. Returns the URLs
    that were persisted (in input order) so callers can echo them in the API
    response. URLs that don't start with ``/static/uploads/`` are rejected
    so callers can't smuggle in arbitrary paths from other tenants."""
    cleaned: list[str] = []
    for url in urls:
        if not isinstance(url, str) or not url.startswith("/static/uploads/"):
            continue
        cleaned.append(url)
    if not cleaned:
        return []
    rows = [
        Attachment(
            owner_type=owner_type,
            owner_id=owner_id,
            url=url,
            mime="image/*",
            size_bytes=0,
            original_name=None,
            uploader_user_id=uploader_user_id,
        )
        for url in cleaned
    ]
    db.add_all(rows)
    await db.flush()
    return cleaned


async def _load_image_urls(
    db: AsyncSession, owner_type: str, owner_ids: list[int]
) -> dict[int, list[str]]:
    """Bulk-load image URLs for a set of owner rows. Returns ``{owner_id:
    [url, ...]}`` (URLs in insertion order). Empty input → empty dict."""
    if not owner_ids:
        return {}
    stmt = (
        select(Attachment.owner_id, Attachment.url)
        .where(Attachment.owner_type == owner_type, Attachment.owner_id.in_(owner_ids))
        .order_by(Attachment.id.asc())
    )
    out: dict[int, list[str]] = {oid: [] for oid in owner_ids}
    for owner_id, url in (await db.execute(stmt)).all():
        out.setdefault(owner_id, []).append(url)
    return out


def _serialise(rows, urls_by_id: dict[int, list[str]]) -> list[dict]:
    payloads = []
    for r in rows:
        d = ClothingIntakeOut.model_validate(r).model_dump()
        d["image_urls"] = urls_by_id.get(r.id, [])
        payloads.append(d)
    return payloads


@router.post("", response_model=ApiResponse, status_code=201)
async def create_intake(
    body: ClothingIntakeCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        row = ClothingIntake(
            user_id=current_user["id"],
            summary=body.summary,
            garment_types=body.garment_types,
            quantity_estimate=body.quantity_estimate,
            condition_notes=body.condition_notes,
            pickup_address=body.pickup_address,
            contact_phone=body.contact_phone,
            status="submitted",
        )
        db.add(row)
        await db.flush()
        await _persist_attachments(
            db,
            owner_type="clothing_intake",
            owner_id=row.id,
            urls=body.image_urls,
            uploader_user_id=current_user["id"],
        )
        await db.refresh(row)
        out = ClothingIntakeOut.model_validate(row).model_dump()
        out["image_urls"] = body.image_urls
        return ApiResponse(data=out)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create clothing intake")
        raise HTTPException(status_code=500, detail="Failed to create intake")


@router.get("/mine", response_model=PaginatedResponse)
async def list_my_intakes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        total = (await db.execute(
            select(func.count(ClothingIntake.id)).where(ClothingIntake.user_id == current_user["id"])
        )).scalar() or 0
        stmt = (
            select(ClothingIntake)
            .where(ClothingIntake.user_id == current_user["id"])
            .order_by(ClothingIntake.created_at.desc())
            .offset((page - 1) * page_size).limit(page_size)
        )
        rows = (await db.execute(stmt)).scalars().all()
        urls_by_id = await _load_image_urls(db, "clothing_intake", [r.id for r in rows])
        return PaginatedResponse(
            data=_serialise(rows, urls_by_id),
            total=total, page=page, page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list user clothing intakes")
        raise HTTPException(status_code=500, detail="Failed to list intakes")


@router.get("", response_model=PaginatedResponse)
async def list_all_intakes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    _staff: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    try:
        stmt = select(ClothingIntake)
        if status:
            stmt = stmt.where(ClothingIntake.status == status)
        count_stmt = select(func.count(ClothingIntake.id))
        if status:
            count_stmt = count_stmt.where(ClothingIntake.status == status)
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(ClothingIntake.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        rows = (await db.execute(stmt)).scalars().all()
        urls_by_id = await _load_image_urls(db, "clothing_intake", [r.id for r in rows])
        data = _serialise(rows, urls_by_id)
        return PaginatedResponse(data=data, total=total, page=page, page_size=page_size)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list clothing intakes")
        raise HTTPException(status_code=500, detail="Failed to list intakes")


@router.patch("/{intake_id}/status", response_model=ApiResponse)
async def update_intake_status(
    intake_id: int,
    body: ClothingIntakeStatusUpdate,
    staff: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
):
    stmt = select(ClothingIntake).where(ClothingIntake.id == intake_id)
    row = (await db.execute(stmt)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Intake not found")
    old_status = row.status
    row.status = body.status
    if body.admin_note is not None:
        row.admin_note = body.admin_note
    await db.flush()
    await db.refresh(row)
    urls_by_id = await _load_image_urls(db, "clothing_intake", [row.id])
    payload = ClothingIntakeOut.model_validate(row).model_dump()
    payload["image_urls"] = urls_by_id.get(row.id, [])

    # Audit log
    ip = request.client.host if request else None
    await log_audit(
        db=db,
        user_id=staff.get("id"),
        action="update_clothing_intake_status",
        resource="clothing_intake",
        resource_id=str(intake_id),
        details={"old_status": old_status, "new_status": body.status, "admin_note": body.admin_note},
        ip_address=ip,
    )

    return ApiResponse(data=payload)


@router.post("/{intake_id}/publish-product", response_model=ApiResponse, status_code=201)
async def publish_product_from_intake(
    intake_id: int,
    body: PublishFromIntakeBody,
    staff: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
):
    """Link intake record to a listed product (completing the donation-to-product loop)."""
    try:
        stmt = select(ClothingIntake).where(ClothingIntake.id == intake_id)
        intake = (await db.execute(stmt)).scalar_one_or_none()
        if not intake:
            raise HTTPException(status_code=404, detail="Intake not found")
        if intake.status == "listed" and intake.product_id:
            raise HTTPException(status_code=400, detail="Intake already linked to a product")
        if intake.status == "rejected":
            raise HTTPException(status_code=400, detail="Cannot publish from rejected intake")

        product = Product(
            name=body.name,
            description=body.description,
            price=body.price,
            currency=body.currency,
            image_url=body.image_url,
            category=body.category,
            stock=body.stock,
            status="active",
        )
        db.add(product)
        await db.flush()

        intake.product_id = product.id
        intake.status = "listed"
        await db.flush()
        await db.refresh(intake)
        await db.refresh(product)
        urls_by_id = await _load_image_urls(db, "clothing_intake", [intake.id])
        intake_payload = ClothingIntakeOut.model_validate(intake).model_dump()
        intake_payload["image_urls"] = urls_by_id.get(intake.id, [])

        # Audit log
        ip = request.client.host if request else None
        await log_audit(
            db=db,
            user_id=staff.get("id"),
            action="publish_product_from_intake",
            resource="clothing_intake",
            resource_id=str(intake_id),
            details={"product_id": product.id, "product_name": body.name},
            ip_address=ip,
        )

        return ApiResponse(
            data={
                "intake": intake_payload,
                "product": ProductOut.model_validate(product).model_dump(),
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to publish product from intake")
        raise HTTPException(status_code=500, detail="Failed to publish product")