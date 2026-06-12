"""
End-to-end tests for the structured registration error codes.

Each failure mode should surface a specific `code` field on the response body
so the frontend can show a meaningful message instead of the legacy
"Registration failed" 400.
"""

import pytest
from httpx import AsyncClient


REGISTER_PATH = "/api/v1/auth/register"


def _payload(**overrides):
    body = {
        "email": "register_error_test@example.com",
        "password": "StrongPass1!",
        "nickname": "TestUser",
    }
    body.update(overrides)
    return body


@pytest.mark.asyncio
async def test_register_happy_path_still_works(client: AsyncClient):
    """Sanity: a valid registration still returns 201 and the structured shape."""
    response = await client.post(REGISTER_PATH, json=_payload(email="happy_path@example.com"))
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["success"] is True
    assert body["data"]["user"]["email"] == "happy_path@example.com"


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_409_with_code(client: AsyncClient):
    """Re-registering the same email should return 409 EMAIL_ALREADY_EXISTS,
    not a generic 400 'Registration failed'."""
    payload = _payload(email="dup_test@example.com")
    first = await client.post(REGISTER_PATH, json=payload)
    assert first.status_code == 201, first.text

    second = await client.post(REGISTER_PATH, json=payload)
    assert second.status_code == 409, second.text
    body = second.json()
    assert body["success"] is False
    assert body["code"] == "EMAIL_ALREADY_EXISTS"
    assert "email" in body["message"].lower() or "account" in body["message"].lower()


@pytest.mark.asyncio
async def test_register_password_too_long_returns_422(client: AsyncClient):
    """> 72 chars exceeds the bcrypt hard limit. Schema should reject with 422
    VALIDATION_FAILED before the service even runs."""
    long_password = "a" * 73
    response = await client.post(REGISTER_PATH, json=_payload(password=long_password))
    assert response.status_code == 422, response.text
    body = response.json()
    assert body["code"] == "VALIDATION_FAILED"
    # The errors array should mention the password field
    assert any("password" in (e.get("loc") or []) for e in body.get("errors", []))


@pytest.mark.asyncio
async def test_register_password_too_short_returns_422(client: AsyncClient):
    """< 8 chars: schema-level 422."""
    response = await client.post(REGISTER_PATH, json=_payload(password="short"))
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "VALIDATION_FAILED"


@pytest.mark.asyncio
async def test_register_whitespace_password_returns_422(client: AsyncClient):
    """All-whitespace password: 8 chars but no content. Should be rejected
    by the schema's model_validator, not silently accepted."""
    response = await client.post(REGISTER_PATH, json=_payload(password="        "))
    assert response.status_code == 422, response.text
    body = response.json()
    assert body["code"] == "VALIDATION_FAILED"


@pytest.mark.asyncio
async def test_register_invalid_email_returns_422(client: AsyncClient):
    """Malformed email: schema-level 422 (EmailStr)."""
    response = await client.post(REGISTER_PATH, json=_payload(email="not-an-email"))
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "VALIDATION_FAILED"


@pytest.mark.asyncio
async def test_register_invalid_phone_returns_422(client: AsyncClient):
    """Phone with letters: schema-level 422."""
    response = await client.post(REGISTER_PATH, json=_payload(phone="abc-not-a-phone"))
    assert response.status_code == 422, response.text
    body = response.json()
    assert body["code"] == "VALIDATION_FAILED"


@pytest.mark.asyncio
async def test_register_valid_phone_is_accepted(client: AsyncClient):
    """A properly-formatted phone should be accepted (sanity for the regex)."""
    response = await client.post(
        REGISTER_PATH,
        json=_payload(email="phone_ok@example.com", phone="+1 555-123-4567"),
    )
    assert response.status_code == 201, response.text


@pytest.mark.asyncio
async def test_register_blank_nickname_returns_422(client: AsyncClient):
    """Nickname that's all whitespace: 422 from the schema validator."""
    response = await client.post(REGISTER_PATH, json=_payload(nickname="   "))
    assert response.status_code == 422, response.text


@pytest.mark.asyncio
async def test_register_does_not_return_generic_registration_failed(client: AsyncClient):
    """Regression: the legacy handler used to swallow every error as 400
    'Registration failed'. None of the new error paths should produce that
    generic message."""
    # 1. Duplicate email → 409 with EMAIL_ALREADY_EXISTS
    payload = _payload(email="regression_test@example.com")
    await client.post(REGISTER_PATH, json=payload)
    dup = await client.post(REGISTER_PATH, json=payload)
    assert dup.status_code == 409
    assert dup.json()["message"] != "Registration failed"
    assert dup.json()["message"] != "Registration failed."

    # 2. Bad password → 422
    short = await client.post(REGISTER_PATH, json=_payload(password="short"))
    assert short.json()["message"] != "Registration failed"
