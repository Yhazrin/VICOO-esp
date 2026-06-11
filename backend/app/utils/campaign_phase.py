"""Time-based campaign lifecycle phase (upcoming / active / completed)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import and_, or_
from sqlalchemy.sql.elements import ColumnElement

from app.models.campaign import Campaign

STATUS_ALIASES = {
    "ended": "completed",
    "archived": "cancelled",
}


def normalize_status_filter(status: Optional[str]) -> Optional[str]:
    if not status:
        return None
    key = status.strip().lower()
    return STATUS_ALIASES.get(key, key)


def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def resolve_campaign_phase(
    status: str,
    start_date: datetime,
    end_date: datetime,
    now: Optional[datetime] = None,
) -> str:
    """
    Derive user-facing phase from DB status and campaign dates.

    DB status draft/cancelled/completed take precedence; otherwise use dates.
    """
    db_status = (status or "draft").lower()
    if db_status == "draft":
        return "draft"
    if db_status == "cancelled":
        return "cancelled"
    if db_status == "completed":
        return "completed"

    now_utc = ensure_utc(now or datetime.now(timezone.utc))
    start = ensure_utc(start_date)
    end = ensure_utc(end_date)

    if now_utc < start:
        return "upcoming"
    if now_utc > end:
        return "completed"
    return "active"


def build_campaign_status_filter(status: str, now: Optional[datetime] = None) -> ColumnElement[bool]:
    """SQLAlchemy WHERE clause for list_campaigns status query param."""
    now_utc = ensure_utc(now or datetime.now(timezone.utc))
    normalized = normalize_status_filter(status) or status

    if normalized == "draft":
        return Campaign.status == "draft"
    if normalized == "cancelled":
        return Campaign.status == "cancelled"

    non_terminal = Campaign.status.notin_(["draft", "cancelled", "completed"])

    if normalized == "upcoming":
        return and_(non_terminal, Campaign.start_date > now_utc)
    if normalized == "active":
        return and_(
            non_terminal,
            Campaign.start_date <= now_utc,
            Campaign.end_date >= now_utc,
        )
    if normalized == "completed":
        return or_(
            Campaign.status == "completed",
            and_(
                Campaign.status.notin_(["draft", "cancelled"]),
                Campaign.end_date < now_utc,
            ),
        )

    return Campaign.status == normalized
