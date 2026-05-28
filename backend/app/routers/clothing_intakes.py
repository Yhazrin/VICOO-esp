"""衣物捐献受理：登记 → 运营处理 → 发布为商品。"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.circular_commerce import ClothingIntake
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


@router.post("", response_model=ApiResponse, status_code=201)
async def create_intake(
    body: ClothingIntakeCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
    await db.refresh(row)
    return ApiResponse(data=ClothingIntakeOut.model_validate(row).model_dump())


@router.get("/mine", response_model=ApiResponse)
async def list_my_intakes(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ClothingIntake)
        .where(ClothingIntake.user_id == current_user["id"])
        .order_by(ClothingIntake.created_at.desc())
        .limit(100)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return ApiResponse(data=[ClothingIntakeOut.model_validate(r).model_dump() for r in rows])


@router.get("", response_model=PaginatedResponse)
async def list_all_intakes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    _staff: dict = Depends(require_role("admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ClothingIntake)
    if status:
        stmt = stmt.where(ClothingIntake.status == status)
    count_stmt = select(func.count(ClothingIntake.id))
    if status:
        count_stmt = count_stmt.where(ClothingIntake.status == status)
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.order_by(ClothingIntake.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()
    data = [ClothingIntakeOut.model_validate(r).model_dump() for r in rows]
    return PaginatedResponse(data=data, total=total, page=page, page_size=page_size)


@router.patch("/{intake_id}/status", response_model=ApiResponse)
async def update_intake_status(
    intake_id: int,
    body: ClothingIntakeStatusUpdate,
    staff: dict = Depends(require_role("admin", "editor")),
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

    return ApiResponse(data=ClothingIntakeOut.model_validate(row).model_dump())


@router.post("/{intake_id}/publish-product", response_model=ApiResponse, status_code=201)
async def publish_product_from_intake(
    intake_id: int,
    body: PublishFromIntakeBody,
    staff: dict = Depends(require_role("admin", "editor")),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
):
    """将受理单关联为已上架商品（完成 捐献→商品 闭环）。"""
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
            "intake": ClothingIntakeOut.model_validate(intake).model_dump(),
            "product": ProductOut.model_validate(product).model_dump(),
        }
    )