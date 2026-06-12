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
    AfterSaleStatusUpdate,
    ApiResponse,
    PaginatedResponse,
)
from app.deps import get_current_user, require_role
from app.services.after_sales.service import (
    enrich_tickets,
    normalize_status_filter,
    parse_ticket_payload,
)
from app.services.order.service import OrderService

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
    """Bulk-load image URLs for a batch of after-sale tickets. Returns
    ``{ticket_id: [url, ...]}`` (URLs in insertion order)."""
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
    """Wrap :func:`enrich_tickets` so each payload also carries ``image_urls``
    loaded from the attachments table."""
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

    # Materialise any uploaded image URLs into attachment rows. Same
    # path-prefix guard as the clothing-intake path.
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
    stmt = (
        select(AfterSaleTicket)
        .where(AfterSaleTicket.user_id == current_user["id"])
        .order_by(AfterSaleTicket.created_at.desc())
        .limit(100)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return ApiResponse(data=await _enrich_with_images(db, list(rows)))


@router.get("/by-order/{order_id}", response_model=ApiResponse)
async def tickets_for_order(
    order_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List after-sales tickets linked to an order (for order detail progress UI)."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

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
    if row.status != "open":
        raise HTTPException(status_code=400, detail="Ticket has already been processed")

    if body.action == "reject":
        row.status = "closed"
        if body.admin_note:
            row.description = "\n".join(
                part for part in [row.description, f"Admin note: {body.admin_note}"] if part
            )
        await db.flush()
        await db.refresh(row)
        return ApiResponse(data=(await _enrich_with_images(db, [row]))[0])

    original_order = await db.get(Order, row.order_id)
    if not original_order:
        raise HTTPException(status_code=404, detail="Original order not found")

    replacement_order = None
    if row.category == "exchange":
        payload = parse_ticket_payload(row)
        line_items = payload.get("items") or []
        if not line_items:
            raise HTTPException(status_code=400, detail="Exchange ticket has no items")
        exchange_product_id = payload.get("exchange_product_id")
        order_service = OrderService(db)
        replacement_order = await order_service.create_replacement_order(
            user_id=row.user_id,
            original_order=original_order,
            line_items=line_items,
            exchange_product_id=exchange_product_id,
        )
        row.replacement_order_id = replacement_order.id

    row.status = "in_progress"
    if body.admin_note:
        row.description = "\n".join(
            part for part in [row.description, f"Admin note: {body.admin_note}"] if part
        )
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
    """Legacy admin path alias for status updates."""
    return await update_ticket_status(ticket_id, body, _staff, db)
