#!/usr/bin/env python3
"""
Smoke-test PUT /api/v1/users/{id}/role for all backend roles.

Usage (from repo root, API reachable as below):
  python tools/verify_user_role_api.py
  python tools/verify_user_role_api.py --base-url http://127.0.0.1:8000/api/v1

Env overrides:
  VICOO_API_BASE   default http://localhost/api/v1
  VICOO_ADMIN_EMAIL
  VICOO_ADMIN_PASSWORD
  VICOO_TARGET_USER_ID  default: first non-admin from GET /users

Exit 0 only if every role update returns 200 and response JSON contains matching role.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any


ROLES = ("user", "editor", "guardian", "compliance")


def http_json(
    method: str,
    url: str,
    *,
    data: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    timeout: float = 30.0,
) -> tuple[int, Any]:
    body = None
    hdrs = {"Accept": "application/json", **(headers or {})}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            payload = raw
        return e.code, payload


def main() -> int:
    p = argparse.ArgumentParser(description="Verify user role API")
    p.add_argument(
        "--base-url",
        default=os.environ.get("VICOO_API_BASE", "http://localhost/api/v1"),
        help="API root including /api/v1",
    )
    p.add_argument("--email", default=os.environ.get("VICOO_ADMIN_EMAIL", "admin@tonghua.org"))
    p.add_argument("--password", default=os.environ.get("VICOO_ADMIN_PASSWORD", "vicoo-admin"))
    p.add_argument("--target-id", type=int, default=None)
    args = p.parse_args()
    base = args.base_url.rstrip("/")

    code, login_body = http_json(
        "POST",
        f"{base}/auth/login",
        data={"email": args.email, "password": args.password},
    )
    if code != 200 or not isinstance(login_body, dict):
        print(f"FAIL login HTTP {code}: {login_body}", file=sys.stderr)
        return 1
    data = login_body.get("data") or {}
    token = (data.get("token") or {}).get("access_token")
    admin_id = (data.get("user") or {}).get("id")
    if not token:
        print(f"FAIL no access_token in login response", file=sys.stderr)
        return 1

    auth = {"Authorization": f"Bearer {token}"}

    target_id = args.target_id
    if target_id is None:
        tid_env = os.environ.get("VICOO_TARGET_USER_ID")
        if tid_env:
            target_id = int(tid_env)
    if target_id is None:
        code, page = http_json("GET", f"{base}/users?page=1&page_size=50", headers=auth)
        if code != 200 or not isinstance(page, dict):
            print(f"FAIL list users HTTP {code}: {page}", file=sys.stderr)
            return 1
        rows = page.get("data") or []
        for row in rows:
            rid = row.get("id")
            if rid is not None and int(rid) != int(admin_id):
                target_id = int(rid)
                break
        if target_id is None:
            print("FAIL could not pick a target user id (only admin in list?)", file=sys.stderr)
            return 1

    if int(target_id) == int(admin_id):
        print("FAIL target user cannot be the same as admin", file=sys.stderr)
        return 1

    code, user_before = http_json("GET", f"{base}/users/{target_id}", headers=auth)
    if code != 200 or not isinstance(user_before, dict):
        print(f"FAIL get user HTTP {code}: {user_before}", file=sys.stderr)
        return 1
    original_role = (user_before.get("data") or {}).get("role")
    print(f"Target user id={target_id}, original_role={original_role!r}")

    failures = 0
    for role in ROLES:
        code, out = http_json(
            "PUT",
            f"{base}/users/{target_id}/role",
            headers=auth,
            data={"role": role},
        )
        if code != 200:
            print(f"FAIL PUT role={role!r} HTTP {code}: {out}", file=sys.stderr)
            failures += 1
            continue
        got = (out.get("data") or {}).get("role") if isinstance(out, dict) else None
        if got != role:
            print(f"FAIL role round-trip: sent {role!r}, got {got!r} body={out}", file=sys.stderr)
            failures += 1
        else:
            print(f"OK   role={role!r}")

    if original_role and original_role in (*ROLES, "admin"):
        code, out = http_json(
            "PUT",
            f"{base}/users/{target_id}/role",
            headers=auth,
            data={"role": original_role},
        )
        if code != 200:
            print(f"WARN restore role={original_role!r} HTTP {code}: {out}", file=sys.stderr)
        else:
            print(f"OK   restored original_role={original_role!r}")

    if failures:
        print(f"\nDone with {failures} failure(s).", file=sys.stderr)
        return 1
    print("\nAll role updates passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
