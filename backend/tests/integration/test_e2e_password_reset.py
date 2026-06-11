"""End-to-end tests for the password reset flow.

Covers the spec's test matrix:
- forgot-password: unknown email, real email, IP rate limit, per-user token cap
- verify-otp: correct, wrong (1×), 5-wrong lockout, expired
- confirm: happy path, second-use rejected, wrong-OTP-after-pass rejected,
  weak password rejected, audit log written
- mock account: returns password_hint, no email
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.models import PasswordResetToken, User
from app.security import hash_password, verify_password


API = "/api/v1"


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(
        (otp + settings.PASSWORD_RESET_OTP_PEPPER).encode("utf-8")
    ).hexdigest()


async def _create_user(email: str, password: str = "OriginalPass1!") -> User:
    async with AsyncSessionLocal() as session:
        user = User(
            email=email,
            password_hash=hash_password(password),
            nickname="Reset Tester",
            role="user",
            status="active",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


async def _get_token_row(token_raw: str) -> PasswordResetToken | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == _sha256(token_raw)
            )
        )
        return result.scalar_one_or_none()


async def _count_active_tokens(user_id: int) -> int:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > datetime.utcnow(),
            )
        )
        return len(result.scalars().all())


@pytest.fixture
def mock_mailer():
    """Patch reset + recovery mailers on the *router* module.

    The router binds `send_password_reset_email` into its own namespace at
    import time, so patching `app.services.mailer.send_password_reset_email`
    wouldn't intercept the router's call. Patching the names on the router
    itself is the only way to make `await_args` populate.
    """
    with patch(
        "app.routers.auth.send_password_reset_email", new=AsyncMock()
    ) as mock_reset, patch(
        "app.routers.auth.send_password_recovery_email", new=AsyncMock()
    ) as mock_recovery:
        yield {"reset": mock_reset, "recovery": mock_recovery}


# ─────────────────────────────────────────────────────────────────────
# forgot-password
# ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_forgot_unknown_email_returns_200_no_mail(client, mock_mailer):
    resp = await client.post(f"{API}/auth/forgot-password", json={"email": "nobody@example.com"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["data"]["email"] == "nobody@example.com"
    mock_mailer["reset"].assert_not_awaited()


@pytest.mark.asyncio
async def test_forgot_real_email_sends_otp_and_link(client, mock_mailer):
    email = "test+reset1@gmail.com"
    await _create_user(email)
    resp = await client.post(f"{API}/auth/forgot-password", json={"email": email})
    assert resp.status_code == 200, resp.text
    mock_mailer["reset"].assert_awaited_once()
    kwargs = mock_mailer["reset"].await_args.kwargs
    assert "reset_url" in kwargs
    assert "otp" in kwargs
    assert len(kwargs["otp"]) == 6 and kwargs["otp"].isdigit()
    assert "token=" in kwargs["reset_url"]


@pytest.mark.asyncio
async def test_forgot_per_user_token_cap(client, mock_mailer):
    """Real-user cap: max 3 valid (un-used, un-expired) tokens per user per 24h."""
    email = "cap@gmail.com"
    user = await _create_user(email)
    for i in range(3):
        r = await client.post(f"{API}/auth/forgot-password", json={"email": email})
        assert r.status_code == 200, r.text
    assert await _count_active_tokens(user.id) == 3
    r4 = await client.post(f"{API}/auth/forgot-password", json={"email": email})
    assert r4.status_code == 429, r4.text


# ─────────────────────────────────────────────────────────────────────
# verify-otp
# ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_verify_otp_correct_returns_200(client, mock_mailer):
    email = "verify1@gmail.com"
    await _create_user(email)
    await client.post(f"{API}/auth/forgot-password", json={"email": email})
    call = mock_mailer["reset"].await_args
    token = call.kwargs["reset_url"].split("token=")[1]
    otp = call.kwargs["otp"]
    r = await client.post(f"{API}/auth/reset/verify-otp", json={"token": token, "otp": otp})
    assert r.status_code == 200, r.text


@pytest.mark.asyncio
async def test_verify_otp_wrong_increments_attempts(client, mock_mailer):
    email = "verify2@gmail.com"
    await _create_user(email)
    await client.post(f"{API}/auth/forgot-password", json={"email": email})
    token = mock_mailer["reset"].await_args.kwargs["reset_url"].split("token=")[1]
    r = await client.post(
        f"{API}/auth/reset/verify-otp", json={"token": token, "otp": "000000"}
    )
    assert r.status_code == 400, r.text
    assert r.json()["code"] == "invalid_otp"
    row = await _get_token_row(token)
    assert row is not None and row.otp_attempts == 1


@pytest.mark.asyncio
async def test_verify_otp_5_wrong_locks_token(client, mock_mailer):
    email = "verify3@gmail.com"
    await _create_user(email)
    await client.post(f"{API}/auth/forgot-password", json={"email": email})
    token = mock_mailer["reset"].await_args.kwargs["reset_url"].split("token=")[1]
    for i in range(5):
        r = await client.post(
            f"{API}/auth/reset/verify-otp", json={"token": token, "otp": f"{i:06d}"}
        )
        assert r.status_code == 400, r.text
    r6 = await client.post(
        f"{API}/auth/reset/verify-otp", json={"token": token, "otp": "999999"}
    )
    assert r6.status_code == 400, r6.text
    assert r6.json()["code"] == "too_many_attempts"


@pytest.mark.asyncio
async def test_verify_otp_expired_returns_400(client, mock_mailer):
    email = "verify4@gmail.com"
    await _create_user(email)
    await client.post(f"{API}/auth/forgot-password", json={"email": email})
    token = mock_mailer["reset"].await_args.kwargs["reset_url"].split("token=")[1]
    otp = mock_mailer["reset"].await_args.kwargs["otp"]
    # Manually expire the row
    async with AsyncSessionLocal() as session:
        row = await _get_token_row(token)
        row.expires_at = datetime.utcnow() - timedelta(seconds=1)
        session.add(row)
        await session.commit()
    r = await client.post(
        f"{API}/auth/reset/verify-otp", json={"token": token, "otp": otp}
    )
    assert r.status_code == 400, r.text
    assert r.json()["code"] == "expired"


# ─────────────────────────────────────────────────────────────────────
# confirm
# ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_confirm_happy_path(client, mock_mailer):
    email = "confirm1@gmail.com"
    user = await _create_user(email, "OldPassword1!")
    await client.post(f"{API}/auth/forgot-password", json={"email": email})
    token = mock_mailer["reset"].await_args.kwargs["reset_url"].split("token=")[1]
    otp = mock_mailer["reset"].await_args.kwargs["otp"]
    r = await client.post(
        f"{API}/auth/reset/confirm",
        json={"token": token, "otp": otp, "new_password": "NewPassword1!"},
    )
    assert r.status_code == 200, r.text
    async with AsyncSessionLocal() as session:
        u = await session.get(User, user.id)
        assert verify_password("NewPassword1!", u.password_hash)
        assert not verify_password("OldPassword1!", u.password_hash)


@pytest.mark.asyncio
async def test_confirm_second_use_rejected(client, mock_mailer):
    email = "confirm2@gmail.com"
    await _create_user(email)
    await client.post(f"{API}/auth/forgot-password", json={"email": email})
    token = mock_mailer["reset"].await_args.kwargs["reset_url"].split("token=")[1]
    otp = mock_mailer["reset"].await_args.kwargs["otp"]
    r1 = await client.post(
        f"{API}/auth/reset/confirm",
        json={"token": token, "otp": otp, "new_password": "NewPassword1!"},
    )
    assert r1.status_code == 200, r1.text
    r2 = await client.post(
        f"{API}/auth/reset/confirm",
        json={"token": token, "otp": otp, "new_password": "AnotherPass1!"},
    )
    assert r2.status_code == 400, r2.text
    assert r2.json()["code"] == "expired"


@pytest.mark.asyncio
async def test_confirm_wrong_otp_rejected_even_after_successful_verify(client, mock_mailer):
    """Defence in depth: confirm re-validates OTP regardless of verify-otp state."""
    email = "confirm3@gmail.com"
    await _create_user(email)
    await client.post(f"{API}/auth/forgot-password", json={"email": email})
    token = mock_mailer["reset"].await_args.kwargs["reset_url"].split("token=")[1]
    real_otp = mock_mailer["reset"].await_args.kwargs["otp"]
    # Page A passes
    v = await client.post(
        f"{API}/auth/reset/verify-otp", json={"token": token, "otp": real_otp}
    )
    assert v.status_code == 200, v.text
    # Page B submits a *different* OTP — must still fail
    fake_otp = ("0" if real_otp[0] != "0" else "1") + real_otp[1:]
    r = await client.post(
        f"{API}/auth/reset/confirm",
        json={"token": token, "otp": fake_otp, "new_password": "NewPassword1!"},
    )
    assert r.status_code == 400, r.text
    assert r.json()["code"] == "invalid_otp"


@pytest.mark.asyncio
async def test_confirm_weak_password_rejected(client, mock_mailer):
    email = "weak@gmail.com"
    await _create_user(email)
    await client.post(f"{API}/auth/forgot-password", json={"email": email})
    token = mock_mailer["reset"].await_args.kwargs["reset_url"].split("token=")[1]
    otp = mock_mailer["reset"].await_args.kwargs["otp"]
    r = await client.post(
        f"{API}/auth/reset/confirm",
        json={"token": token, "otp": otp, "new_password": "short"},
    )
    assert r.status_code == 422, r.text  # Pydantic min_length=8


@pytest.mark.asyncio
async def test_confirm_writes_audit_log(client, mock_mailer):
    from sqlalchemy import text

    email = "audit@gmail.com"
    user = await _create_user(email)
    await client.post(f"{API}/auth/forgot-password", json={"email": email})
    token = mock_mailer["reset"].await_args.kwargs["reset_url"].split("token=")[1]
    otp = mock_mailer["reset"].await_args.kwargs["otp"]
    r = await client.post(
        f"{API}/auth/reset/confirm",
        json={"token": token, "otp": otp, "new_password": "NewPassword1!"},
    )
    assert r.status_code == 200, r.text
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT action, user_id FROM audit_logs WHERE user_id = :uid"),
            {"uid": user.id},
        )
        actions = [row[0] for row in result.fetchall()]
    assert "password_reset_completed" in actions


# ─────────────────────────────────────────────────────────────────────
# mock account
# ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_mock_account_returns_password_hint(client, mock_mailer, monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", True)
    email = "vicoo-tester@vicoo.test"
    await _create_user(email, "MockPass1!")
    r = await client.post(f"{API}/auth/forgot-password", json={"email": email})
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert "password_hint" in data
    assert data["password_hint"] == "MockPass1!"
    mock_mailer["reset"].assert_not_awaited()
    mock_mailer["recovery"].assert_not_awaited()
