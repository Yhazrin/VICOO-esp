"""After-sales service tickets."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.attachment import Attachment
from app.models.circular_commerce import AfterSaleTicket
from app.models.order import Order
from app.schemas import (
    AfterSaleCreate,
    AfterSaleOut,
    AfterSaleReviewRequest,
    AfterSaleReturnShipmentUpdate,
    AfterSaleStatusUpdate,
    ApiResponse,
    PaginatedResponse,
)
from app.deps import get_current_user, require_role
from app.services.after_sales.service import (
    AfterSalesService,
    enrich_tickets,
    normalize_status_filter,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/after-sales", tags=["After-sales"])

VALID_STATUSES = frozenset({"open", "in_progress", "resolved", "closed"})


def _resolve_status(status: str) -> str:
    mapped = normalize_status_filter(status) or status
    if mapped not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    return mapped


async def _load_image_urls_for_tickets(
    db: AsyncSession, ticket_ids: list[int]
) -> dict[int, list[str]]:
    if not ticket_ids:
        return {}
    stmt = (
        select(Attachment.owner_id, Attachment.url)
        .where(
            Attachment.owner_type == "after_sale_ticket",
            Attachment.owner_id.in_(ticket_ids),
        )
        .order_by(Attachment.id.asc())
    )
    out: dict[int, list[str]] = {tid: [] for tid in ticket_ids}
    for tid, url in (await db.execute(stmt)).all():
        out.setdefault(tid, []).append(url)
    return out


async def _enrich_with_images(
    db: AsyncSession, rows: list[AfterSaleTicket]
) -> list[dict]:
    payloads = await enrich_tickets(db, list(rows))
    urls_by_id = await _load_image_urls_for_tickets(db, [r.id for r in rows])
    for ticket, payload in zip(rows, payloads):
        payload["image_urls"] = urls_by_id.get(ticket.id, [])
    return payloads


@router.post("", response_model=ApiResponse, status_code=201)
async def create_ticket(
    body: AfterSaleCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AfterSalesService(db)
    order = await service.get_order_for_user(body.order_id, current_user)
    await service.validate_support_ticket(order, body.category)

    row = AfterSaleTicket(
        user_id=order.user_id,
        order_id=body.order_id,
        category=body.category,
        subject=body.subject,
        description=body.description,
        status="open",
    )
    db.add(row)
    await db.flush()

    image_urls: list[str] = []
    for url in body.image_urls:
        if isinstance(url, str) and url.startswith("/static/uploads/"):
            image_urls.append(url)
    if image_urls:
        db.add_all(
            [
                Attachment(
                    owner_type="after_sale_ticket",
                    owner_id=row.id,
                    url=url,
                    mime="image/*",
                    size_bytes=0,
                    original_name=None,
                    uploader_user_id=current_user["id"],
                )
                for url in image_urls
            ]
        )
        await db.flush()

    await db.refresh(row)
    payload = (await enrich_tickets(db, [row]))[0]
    payload["image_urls"] = image_urls
    return ApiResponse(data=payload)


@router.get("/mine", response_model=PaginatedResponse)
async def my_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base = select(AfterSaleTicket).where(AfterSaleTicket.user_id == current_user["id"])
    count_stmt = select(func.count(AfterSaleTicket.id)).where(
        AfterSaleTicket.user_id == current_user["id"]
    )
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = (
        base.order_by(AfterSaleTicket.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.execute(stmt)).scalars().all()
    data = await _enrich_with_images(db, list(rows))
    return PaginatedResponse(
        data=data,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/by-order/{order_id}", response_model=ApiResponse)
async def tickets_for_order(
    order_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AfterSalesService(db)
    await service.get_order_for_user(order_id, current_user)

    stmt = (
        select(AfterSaleTicket)
        .where(AfterSaleTicket.order_id == order_id)
        .order_by(AfterSaleTicket.created_at.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return ApiResponse(data=await _enrich_with_images(db, list(rows)))


@router.get("", response_model=PaginatedResponse)
async def list_tickets_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    _admin: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    normalized_status = normalize_status_filter(status)
    stmt = select(AfterSaleTicket)
    if normalized_status:
        stmt = stmt.where(AfterSaleTicket.status == normalized_status)
    count_stmt = select(func.count(AfterSaleTicket.id))
    if normalized_status:
        count_stmt = count_stmt.where(AfterSaleTicket.status == normalized_status)
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.order_by(AfterSaleTicket.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()

    data = await _enrich_with_images(db, list(rows))

    return PaginatedResponse(
        data=data,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/{ticket_id}/review", response_model=ApiResponse)
async def review_ticket(
    ticket_id: int,
    body: AfterSaleReviewRequest,
    _staff: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AfterSaleTicket).where(AfterSaleTicket.id == ticket_id)
    row = (await db.execute(stmt)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")

    service = AfterSalesService(db)
    if body.action == "reject":
        row = await service.reject_ticket(row, admin_note=body.admin_note)
    else:
        row = await service.approve_ticket(row, admin_note=body.admin_note)

    return ApiResponse(data=(await _enrich_with_images(db, [row]))[0])


@router.post("/{ticket_id}/confirm-received", response_model=ApiResponse)
async def confirm_return_received(
    ticket_id: int,
    _staff: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(select(AfterSaleTicket).where(AfterSaleTicket.id == ticket_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
    service = AfterSalesService(db)
    row = await service.confirm_return_received(row)
    return ApiResponse(data=(await _enrich_with_images(db, [row]))[0])


@router.post("/{ticket_id}/refund", response_model=ApiResponse)
async def process_refund(
    ticket_id: int,
    _staff: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(select(AfterSaleTicket).where(AfterSaleTicket.id == ticket_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
    service = AfterSalesService(db)
    row = await service.process_refund(row)
    return ApiResponse(data=(await _enrich_with_images(db, [row]))[0])


@router.patch("/{ticket_id}/return-shipment", response_model=ApiResponse)
async def submit_return_shipment(
    ticket_id: int,
    body: AfterSaleReturnShipmentUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(select(AfterSaleTicket).where(AfterSaleTicket.id == ticket_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if row.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if row.category not in ("return", "exchange"):
        raise HTTPException(status_code=400, detail="Return shipment only applies to return/exchange tickets")
    if row.status != "in_progress":
        raise HTTPException(status_code=400, detail="Ticket must be approved before submitting return shipment")

    row.return_carrier = body.return_carrier.strip()
    row.return_tracking_no = body.return_tracking_no.strip()
    await db.flush()
    await db.refresh(row)
    return ApiResponse(data=(await _enrich_with_images(db, [row]))[0])


@router.patch("/{ticket_id}/status", response_model=ApiResponse)
async def update_ticket_status(
    ticket_id: int,
    body: AfterSaleStatusUpdate,
    _staff: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AfterSaleTicket).where(AfterSaleTicket.id == ticket_id)
    row = (await db.execute(stmt)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
    row.status = _resolve_status(body.status)
    await db.flush()
    await db.refresh(row)
    return ApiResponse(data=(await _enrich_with_images(db, [row]))[0])


@router.patch("/{ticket_id}", response_model=ApiResponse)
async def update_ticket_status_legacy(
    ticket_id: int,
    body: AfterSaleStatusUpdate,
    _staff: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await update_ticket_status(ticket_id, body, _staff, db)
