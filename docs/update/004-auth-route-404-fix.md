# Update 004: Login 404 Root Cause Analysis & Dual-Prefix Route Compatibility

**Date:** 2026-03-28
**Focus:** Authentication, Routing, Deployment, Test Reliability

## Overview
Resolved the browser error:

```text
POST http://localhost/api/auth/login 404 (Not Found)
```

The issue was not a frontend typo alone. The repository had already started migrating from `/api/v1` to `/api`, but the running backend container on `localhost:8000` was still serving an older route layout. This created a mismatch between:

- Frontend requests using `/api/auth/login`
- Tests and some backend assumptions still using `/api/v1/...`
- The live backend container still returning `404` for `/api/auth/login`

To eliminate the mismatch safely, the backend was updated to support **both** `/api/...` and `/api/v1/...` during the transition.

## Problem Discovery Process

### 1. Reviewed Existing Update Notes
- **File:** `docs/update/002-api-path-fix.md`
    - Documented the earlier assumption that the correct backend path was `/api/v1/auth/login`.
- **File:** `docs/update/003-api-simplification.md`
    - Documented a later architectural change to remove `/v1` and use `/api/...` instead.

These two updates revealed that the codebase was in the middle of an API prefix transition.

### 2. Checked Current Source Code
- **File:** `frontend/web-react/src/services/api.ts`
- **File:** `frontend/web-react/src/services/auth.ts`
- **File:** `backend/app/main.py`

Findings:
- Frontend was configured to call `/api/...`
- Backend source code had been changed toward `/api`
- But tests and some backend logic still referenced `/api/v1/...`

### 3. Checked Tests for Expected Behavior
- **File:** `tests/api-tests/reproduce_404.py`
- **File:** `tests/api-tests/test_api.py`
- **File:** `tests/api-tests/test_endpoints.py`

Findings:
- Existing test coverage still treated `/api/v1/...` as the main valid path
- `reproduce_404.py` still assumed `/api/auth/login` should return `404`
- This no longer matched the intended architecture

### 4. Verified the Live Docker Stack
Inspected the active containers and confirmed:
- `vicoo-backend` was running
- `vicoo-frontend` was proxying requests to the backend
- Browser-visible `404` responses were coming from the backend itself, not from a frontend-only bug

Live verification against the running services showed:
- `POST http://localhost:8000/api/auth/login` -> `404 Not Found`
- `POST http://localhost/api/auth/login` -> `404 Not Found`

This proved the running backend container had not picked up the new routing logic yet.

## Root Cause

The login `404` was caused by a combination of three factors:

1. **Incomplete route migration**
   - Source code, tests, and client assumptions were split between `/api/v1` and `/api`.

2. **Runtime container drift**
   - The Docker backend container was still serving an older build that did not expose `/api/auth/login`.

3. **Transition without compatibility layer**
   - The project had removed `/v1` in some places, but had not yet added a safe compatibility bridge for older tests and clients.

## Implementation & Fixes

### 1. Added Dual Route Registration During Migration
- **File:** `backend/app/main.py`

Instead of exposing routers under only one prefix, all routers are now registered under both:

- `/api`
- `/api/v1`

This allows:
- Current web frontend requests to work immediately
- Existing tests and older clients to continue functioning
- Safer migration across environments that may not all be rebuilt at the same time

### 2. Updated Rate-Limit Public Endpoint Matching
- **File:** `backend/app/deps.py`

The auth rate-limit whitelist previously only recognized `/api/v1/...` endpoints.  
It was updated to include both:

- `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/auth/wx-login`
- `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/refresh`, `/api/v1/auth/wx-login`

This keeps rate-limiting behavior correct regardless of which prefix the client uses.

### 3. Corrected Donation Certificate URLs
- **File:** `backend/app/routers/donations.py`

Response payloads still returned certificate URLs using `/api/v1/...`.  
These were updated to return the simplified `/api/...` path so newly generated links match the current preferred API shape.

### 4. Rewrote the 404 Reproduction Test as a Compatibility Test
- **File:** `tests/api-tests/reproduce_404.py`

The old test encoded an outdated assumption:
- `/api/auth/login` should return `404`

That was replaced with two compatibility assertions:
- `/api/auth/login` must **not** return `404`
- `/api/v1/auth/login` must **not** return `404`

This makes the test useful during the migration instead of preserving the old failure.

## Deployment / Runtime Fix

### Rebuilt the Backend Container
The backend image is built by copying source code into the image rather than bind-mounting backend code from the host.  
That means source edits do **not** affect the running backend until the image is rebuilt.

Executed:

```bash
docker compose up -d --build backend
```

This recreated `vicoo-backend` with the updated routing code.

## Verification Performed

### Static Verification
- `python3 -m py_compile` succeeded for:
  - `backend/app/main.py`
  - `backend/app/deps.py`
  - `backend/app/routers/donations.py`
  - `tests/api-tests/reproduce_404.py`

### Live Endpoint Verification After Rebuild
Confirmed the following no longer return `404`:

- `POST http://localhost/api/auth/login` -> `401 Invalid credentials`
- `POST http://localhost:8000/api/auth/login` -> `401 Invalid credentials`
- `POST http://localhost:8000/api/v1/auth/login` -> `401 Invalid credentials`
- `POST http://localhost/api/auth/refresh` -> `401 Missing refresh token`

These results are correct for unauthenticated requests and prove the routes are alive.

### Test Verification
Ran the targeted regression test inside the backend Docker image:

```bash
docker run --rm --entrypoint python \
  -v /Users/tian/Desktop/VICOO-esp:/workspace \
  -w /workspace \
  -e PYTHONPATH=/workspace/backend \
  easy-backend -m pytest -q tests/api-tests/reproduce_404.py
```

Result:

```text
2 passed
```

## Final Result

- [x] `POST /api/auth/login` no longer returns `404`
- [x] `POST /api/auth/refresh` no longer returns `404`
- [x] Legacy `/api/v1/...` auth routes remain usable
- [x] Backend container rebuilt and serving the corrected routes
- [x] Regression test updated and passing

## Notes

- A `401` response is now the expected result when invalid credentials or missing refresh cookies are supplied. That means routing is fixed and any remaining login issue is now at the credential/session layer, not the route layer.
- The project still contains many `/api/v1/...` references in broader tests and non-web clients. The dual-prefix compatibility layer prevents breakage for now, but a later cleanup pass should standardize all clients and docs on one canonical prefix.
