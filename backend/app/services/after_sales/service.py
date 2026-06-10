"""After-sales ticket helpers."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import select

from app.models.circular_commerce import AfterSaleTicket
from app.models.order import Order
from app.schemas import AfterSaleOut

STATUS_FILTER_ALIASES = {
    "pending": "open",
    "approved": "in_progress",
    "rejected": "closed",
    "completed": "resolved",
}


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
    payload: dict[str, Any] = {"items": items}
    if exchange_product_id is not None:
        payload["exchange_product_id"] = exchange_product_id
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
