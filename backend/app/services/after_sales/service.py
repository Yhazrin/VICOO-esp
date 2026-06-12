"""After-sales ticket business logic."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.circular_commerce import AfterSaleTicket
from app.models.order import Order, OrderItem
from app.models.payment import PaymentTransaction
from app.models.product import Product
from app.schemas import AfterSaleOut
from app.services.order.service import OrderService

logger = logging.getLogger(__name__)

STATUS_FILTER_ALIASES = {
    "pending": "open",
    "approved": "in_progress",
    "rejected": "closed",
    "completed": "resolved",
}

STRUCTURED_CATEGORIES = frozenset({"return", "exchange"})
SUPPORT_CATEGORIES = frozenset({"quality", "logistics", "other"})
ACTIVE_STATUSES = frozenset({"open", "in_progress"})


def normalize_status_filter(status: str | None) -> str | None:
    if not status:
        return None
    return STATUS_FILTER_ALIASES.get(status, status)


def parse_ticket_payload(ticket: AfterSaleTicket) -> dict[str, Any]:
    if ticket.items:
        try:
            data = json.loads(ticket.items)
            if isinstance(data, dict):
                return data
            if isinstance(data, list):
                return {"items": data}
        except json.JSONDecodeError:
            pass

    items: list[dict[str, Any]] = []
    exchange_product_id: int | None = None
    reason: str | None = None
    for line in (ticket.description or "").split("\n"):
        if line.startswith("Items: "):
            try:
                parsed = json.loads(line[7:])
                if isinstance(parsed, list):
                    items = parsed
            except json.JSONDecodeError:
                pass
        elif line.startswith("Exchange product ID: "):
            try:
                exchange_product_id = int(line.split(": ", 1)[1])
            except ValueError:
                pass
        elif line.startswith("Reason: "):
            reason = line[8:].strip() or None
    payload: dict[str, Any] = {"items": items}
    if exchange_product_id is not None:
        payload["exchange_product_id"] = exchange_product_id
    if reason:
        payload["reason"] = reason
    return payload


def extract_reason(ticket: AfterSaleTicket) -> str | None:
    payload = parse_ticket_payload(ticket)
    reason = payload.get("reason")
    if isinstance(reason, str) and reason.strip():
        return reason.strip()
    for line in (ticket.description or "").split("\n"):
        if line.startswith("Reason: "):
            value = line[8:].strip()
            if value:
                return value
    return None


def ticket_to_out(
    ticket: AfterSaleTicket,
    replacement_order: Order | None = None,
    original_order: Order | None = None,
) -> dict[str, Any]:
    payload = AfterSaleOut.model_validate(ticket).model_dump()
    if original_order is not None:
        payload["order_no"] = original_order.order_no
    reason = extract_reason(ticket)
    if reason:
        payload["reason"] = reason
    if replacement_order is not None:
        payload["replacement_order_status"] = replacement_order.status
        payload["replacement_order_no"] = replacement_order.order_no
        payload["replacement_carrier"] = getattr(replacement_order, "carrier", None)
        payload["replacement_tracking_number"] = getattr(replacement_order, "tracking_number", None)
    if ticket.refund_amount is not None:
        payload["refund_amount"] = str(ticket.refund_amount)
    return payload


async def enrich_tickets(db, tickets: list[AfterSaleTicket]) -> list[dict[str, Any]]:
    if not tickets:
        return []

    order_ids = {ticket.order_id for ticket in tickets}
    replacement_ids = {
        ticket.replacement_order_id for ticket in tickets if ticket.replacement_order_id
    }
    all_ids = order_ids | replacement_ids
    stmt = select(Order).where(Order.id.in_(all_ids))
    orders = {order.id: order for order in (await db.execute(stmt)).scalars().all()}

    return [
        ticket_to_out(
            ticket,
            orders.get(ticket.replacement_order_id) if ticket.replacement_order_id else None,
            orders.get(ticket.order_id),
        )
        for ticket in tickets
    ]


class AfterSalesService:
    """Shared validation and return/refund workflow."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_order_for_user(self, order_id: int, current_user: dict) -> Order:
        order = await self.db.get(Order, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.user_id != current_user["id"] and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Forbidden")
        return order

    async def assert_no_active_ticket(self, order_id: int, category: str) -> None:
        stmt = (
            select(AfterSaleTicket.id)
            .where(
                AfterSaleTicket.order_id == order_id,
                AfterSaleTicket.category == category,
                AfterSaleTicket.status.in_(tuple(ACTIVE_STATUSES)),
            )
            .limit(1)
        )
        existing = (await self.db.execute(stmt)).scalar_one_or_none()
        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail="An active after-sales ticket already exists for this order and category",
            )

    def _assert_within_window(self, order: Order) -> None:
        if order.status != "completed":
            return
        reference = order.updated_at or order.created_at
        if reference is None:
            return
        if reference.tzinfo is None:
            reference = reference.replace(tzinfo=timezone.utc)
        deadline = reference + timedelta(days=settings.AFTER_SALE_WINDOW_DAYS)
        if datetime.now(timezone.utc) > deadline:
            raise HTTPException(
                status_code=400,
                detail=f"After-sales window expired ({settings.AFTER_SALE_WINDOW_DAYS} days after completion)",
            )

    async def validate_structured_return(self, order: Order, category: str) -> None:
        if category not in STRUCTURED_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid category for structured return")
        if order.status != "completed":
            raise HTTPException(status_code=400, detail="Can only request returns for completed orders")
        self._assert_within_window(order)
        await self.assert_no_active_ticket(order.id, category)

    async def validate_support_ticket(self, order: Order, category: str) -> None:
        if category in STRUCTURED_CATEGORIES:
            raise HTTPException(
                status_code=400,
                detail="Return and exchange must be submitted from the order detail page",
            )
        if category not in SUPPORT_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid after-sales category")
        if order.status not in ("paid", "shipped", "completed"):
            raise HTTPException(
                status_code=400,
                detail="Order must be paid, shipped, or completed to open a support ticket",
            )
        await self.assert_no_active_ticket(order.id, category)

    async def calculate_refund_amount(self, ticket: AfterSaleTicket) -> Decimal:
        payload = parse_ticket_payload(ticket)
        line_items = payload.get("items") or []
        if not line_items:
            order = await self.db.get(Order, ticket.order_id)
            return Decimal(str(order.total_amount)) if order else Decimal("0")

        item_stmt = select(OrderItem).where(OrderItem.order_id == ticket.order_id)
        order_items = {i.id: i for i in (await self.db.execute(item_stmt)).scalars().all()}

        total = Decimal("0")
        for item in line_items:
            order_item_id = item.get("order_item_id")
            quantity = int(item.get("quantity", 0))
            if order_item_id and order_item_id in order_items:
                oi = order_items[order_item_id]
                total += Decimal(str(oi.price)) * quantity
            elif item.get("price") is not None:
                total += Decimal(str(item["price"])) * quantity
            elif item.get("product_id"):
                product_id = int(item["product_id"])
                for oi in order_items.values():
                    if oi.product_id == product_id:
                        total += Decimal(str(oi.price)) * quantity
                        break
        return total.quantize(Decimal("0.01"))

    async def restore_return_inventory(self, ticket: AfterSaleTicket) -> None:
        payload = parse_ticket_payload(ticket)
        line_items = payload.get("items") or []
        if not line_items:
            return

        item_stmt = select(OrderItem).where(OrderItem.order_id == ticket.order_id)
        order_items = {i.id: i for i in (await self.db.execute(item_stmt)).scalars().all()}

        for item in line_items:
            quantity = int(item.get("quantity", 0))
            if quantity <= 0:
                continue
            product_id = item.get("product_id")
            if not product_id and item.get("order_item_id") in order_items:
                product_id = order_items[item["order_item_id"]].product_id
            if not product_id:
                continue

            product = await self.db.get(Product, int(product_id))
            if not product:
                continue
            product.stock = int(product.stock or 0) + quantity
            if product.status == "sold_out" and product.stock > 0:
                product.status = "active"

    async def process_refund(self, ticket: AfterSaleTicket) -> AfterSaleTicket:
        if ticket.category != "return":
            raise HTTPException(status_code=400, detail="Refunds only apply to return tickets")
        if ticket.status != "in_progress":
            raise HTTPException(status_code=400, detail="Ticket must be in progress to refund")
        if not ticket.goods_received_at:
            raise HTTPException(status_code=400, detail="Confirm return receipt before refunding")
        if ticket.refund_status == "succeeded":
            raise HTTPException(status_code=400, detail="Refund already processed")

        amount = await self.calculate_refund_amount(ticket)
        ticket.refund_amount = amount
        ticket.refund_status = "pending"
        await self.db.flush()

        payment_stmt = (
            select(PaymentTransaction)
            .where(
                PaymentTransaction.order_id == ticket.order_id,
                PaymentTransaction.status == "success",
            )
            .order_by(PaymentTransaction.created_at.desc())
            .limit(1)
        )
        payment = (await self.db.execute(payment_stmt)).scalar_one_or_none()

        try:
            if payment:
                payment.status = "refunded"
                logger.info(
                    "Mock refund processed for order %s amount %s via %s",
                    ticket.order_id,
                    amount,
                    payment.method,
                )
            else:
                logger.info(
                    "Mock refund processed for order %s amount %s (no payment record)",
                    ticket.order_id,
                    amount,
                )
            ticket.refund_status = "succeeded"
            ticket.status = "resolved"
        except Exception as exc:
            logger.error("Refund failed for ticket %s: %s", ticket.id, exc)
            ticket.refund_status = "failed"
            raise HTTPException(status_code=502, detail="Refund processing failed") from exc

        await self.db.flush()
        await self.db.refresh(ticket)
        return ticket

    async def confirm_return_received(self, ticket: AfterSaleTicket) -> AfterSaleTicket:
        if ticket.category not in STRUCTURED_CATEGORIES:
            raise HTTPException(status_code=400, detail="Return receipt only applies to return/exchange")
        if ticket.status != "in_progress":
            raise HTTPException(status_code=400, detail="Ticket must be in progress")
        if ticket.goods_received_at:
            raise HTTPException(status_code=400, detail="Return already confirmed received")

        await self.restore_return_inventory(ticket)
        ticket.goods_received_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(ticket)
        return ticket

    async def approve_ticket(
        self,
        ticket: AfterSaleTicket,
        *,
        admin_note: str | None = None,
    ) -> AfterSaleTicket:
        if ticket.status != "open":
            raise HTTPException(status_code=400, detail="Ticket has already been processed")

        original_order = await self.db.get(Order, ticket.order_id)
        if not original_order:
            raise HTTPException(status_code=404, detail="Original order not found")

        if ticket.category == "exchange":
            payload = parse_ticket_payload(ticket)
            line_items = payload.get("items") or []
            if not line_items:
                raise HTTPException(status_code=400, detail="Exchange ticket has no items")
            exchange_product_id = payload.get("exchange_product_id")
            order_service = OrderService(self.db)
            replacement_order = await order_service.create_replacement_order(
                user_id=ticket.user_id,
                original_order=original_order,
                line_items=line_items,
                exchange_product_id=exchange_product_id,
            )
            ticket.replacement_order_id = replacement_order.id

        ticket.status = "in_progress"
        if admin_note:
            ticket.admin_note = admin_note.strip()
        elif ticket.category == "return":
            ticket.admin_note = (
                f"请将商品寄回以下地址：{settings.AFTER_SALE_RETURN_ADDRESS}"
            )

        await self.db.flush()
        await self.db.refresh(ticket)
        return ticket

    async def reject_ticket(
        self,
        ticket: AfterSaleTicket,
        *,
        admin_note: str | None = None,
    ) -> AfterSaleTicket:
        if ticket.status != "open":
            raise HTTPException(status_code=400, detail="Ticket has already been processed")
        ticket.status = "closed"
        if admin_note:
            ticket.admin_note = admin_note.strip()
        await self.db.flush()
        await self.db.refresh(ticket)
        return ticket
