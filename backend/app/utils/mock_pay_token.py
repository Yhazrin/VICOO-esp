"""Signed, time-limited token for demo mobile payment (scan QR → confirm)."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import time
from typing import Any

logger = logging.getLogger(__name__)

_PADDING = "="


def issue_mock_pay_token(
    order_id: int,
    order_no: str,
    user_id: int,
    secret: str | bytes | None,
    ttl_seconds: int = 7200,
) -> str:
    if isinstance(secret, bytes):
        secret_s = secret.decode("utf-8", errors="replace")
    else:
        secret_s = str(secret) if secret is not None else ""

    payload = {
        "oid": order_id,
        "ono": order_no,
        "uid": user_id,
        "exp": int(time.time()) + ttl_seconds,
    }
    body = json.dumps(payload, separators=(",", ":")).encode()
    b64 = base64.urlsafe_b64encode(body).decode().rstrip(_PADDING)
    sig = hmac.new(secret_s.encode("utf-8"), b64.encode("utf-8"), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip(_PADDING)
    return f"{b64}.{sig_b64}"


def parse_mock_pay_token(token: str, secret: str | bytes | None) -> dict[str, Any] | None:
    if isinstance(secret, bytes):
        secret_s = secret.decode("utf-8", errors="replace")
    else:
        secret_s = str(secret) if secret is not None else ""

    try:
        parts = token.split(".", 1)
        if len(parts) != 2:
            return None
        b64, sig_b64 = parts
        sig = base64.urlsafe_b64decode(sig_b64 + _PADDING * ((4 - len(sig_b64) % 4) % 4))
        expected = hmac.new(secret_s.encode("utf-8"), b64.encode("utf-8"), hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected):
            return None
        pad = _PADDING * ((4 - len(b64) % 4) % 4)
        payload = json.loads(base64.urlsafe_b64decode(b64 + pad))
        if int(time.time()) > int(payload.get("exp", 0)):
            return None
        return payload
    except Exception as e:
        logger.debug("Mock pay token parse failed: %s", e)
        return None
