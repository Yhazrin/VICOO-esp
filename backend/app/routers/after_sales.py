"""售后服务工单。"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.circular_commerce import AfterSaleTicket
from app.models.order import Order
from app.schemas import (
    AfterSaleCreate,
    AfterSaleOut,
    AfterSaleStatusUpdate,
    ApiResponse,
    PaginatedResponse,
)
from app.deps import get_current_user, require_role

router = APIRouter(prefix="/after-sales", tags=["After-sales"])


@router.post("", response_model=ApiResponse, status_code=201)
async def create_ticket(
    body: AfterSaleCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ostmt = select(Order).where(Order.id == body.order_id)
    order = (await db.execute(ostmt)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    row = AfterSaleTicket(
        user_id=current_user["id"],
        order_id=body.order_id,
        category=body.category,
        subject=body.subject,
        description=body.description,
        status="open",
    )
    db.add(row)
    await db.flush()
    return ApiResponse(data=AfterSaleOut.model_validate(row).model_dump())


@router.get("/mine", response_model=ApiResponse)
async def my_tickets(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(AfterSaleTicket)
        .where(AfterSaleTicket.user_id == current_user["id"])
        .order_by(AfterSaleTicket.created_at.desc())
        .limit(100)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return ApiResponse(data=[AfterSaleOut.model_validate(r).model_dump() for r in rows])


@router.get("", response_model=PaginatedResponse)
async def list_tickets_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    _admin: dict = Depends(require_role("admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AfterSaleTicket)
    if status:
        stmt = stmt.where(AfterSaleTicket.status == status)
    count_stmt = select(func.count(AfterSaleTicket.id))
    if status:
        count_stmt = count_stmt.where(AfterSaleTicket.status == status)
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.order_by(AfterSaleTicket.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()
    return PaginatedResponse(
        data=[AfterSaleOut.model_validate(r).model_dump() for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/{ticket_id}/status", response_model=ApiResponse)
async def update_ticket_status(
    ticket_id: int,
    body: AfterSaleStatusUpdate,
    _staff: dict = Depends(require_role("admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AfterSaleTicket).where(AfterSaleTicket.id == ticket_id)
    row = (await db.execute(stmt)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
    row.status = body.status
    await db.flush()
    return ApiResponse(data=AfterSaleOut.model_validate(row).model_dump())