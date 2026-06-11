from datetime import datetime, timezone

from app.utils.campaign_phase import (
    build_campaign_status_filter,
    normalize_status_filter,
    resolve_campaign_phase,
)


def test_resolve_campaign_phase_upcoming():
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)
    phase = resolve_campaign_phase(
        "active",
        datetime(2026, 6, 1),
        datetime(2026, 12, 31),
        now=now,
    )
    assert phase == "upcoming"


def test_resolve_campaign_phase_active():
    now = datetime(2026, 6, 15, tzinfo=timezone.utc)
    phase = resolve_campaign_phase(
        "active",
        datetime(2026, 6, 1),
        datetime(2026, 12, 31),
        now=now,
    )
    assert phase == "active"


def test_resolve_campaign_phase_completed_by_date():
    now = datetime(2027, 1, 1, tzinfo=timezone.utc)
    phase = resolve_campaign_phase(
        "active",
        datetime(2026, 6, 1),
        datetime(2026, 12, 31),
        now=now,
    )
    assert phase == "completed"


def test_resolve_campaign_phase_respects_db_completed():
    now = datetime(2026, 6, 15, tzinfo=timezone.utc)
    phase = resolve_campaign_phase(
        "completed",
        datetime(2026, 6, 1),
        datetime(2026, 12, 31),
        now=now,
    )
    assert phase == "completed"


def test_normalize_status_filter_aliases():
    assert normalize_status_filter("ended") == "completed"
    assert normalize_status_filter("archived") == "cancelled"
    assert normalize_status_filter("active") == "active"


def test_build_campaign_status_filter_returns_clause():
    assert build_campaign_status_filter("active") is not None
    assert build_campaign_status_filter("upcoming") is not None
    assert build_campaign_status_filter("completed") is not None
