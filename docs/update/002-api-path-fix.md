# Update 002: API Path Correction & Validation

**Date:** 2026-03-28
**Focus:** Configuration, Environment Variables, Reliability

## Issue Description
Frontend was hitting `POST /api/auth/login`, resulting in a `404 Not Found`. 
The backend routes are registered under the `/api/v1` prefix.

## Root Cause
Incorrect `VITE_API_BASE_URL` configuration in the active environment file (likely set to `/api` instead of `/api/v1`).

## Implementation & Fixes

### 1. Verification Script
- **File:** `verify_endpoints.sh`
- Created a bash script to perform `curl` checks against `http://localhost`.
- **Result:** Confirmed `/api/auth/login` returns 404, while `/api/v1/auth/login` returns 422 (Success - Endpoint alive).

### 2. Frontend Configuration Safeguard
- **File:** `frontend/web-react/src/services/api.ts`
- Added a warning/error log if the configured `VITE_API_BASE_URL` does not include the expected version prefix (e.g., `/v1`).

## Instructions for Developer
Ensure that your local `.env` file matches the following:
```dotenv
VITE_API_BASE_URL=/api/v1
```

## Status
- [x] Reproduced 404 error via script.
- [x] Verified correct path via script.
- [ ] Safeguard added to frontend (Pending next turn).
