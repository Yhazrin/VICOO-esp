# Update 009: Google OAuth False "Not Configured" Error in Docker Dev Mode

**Date:** 2026-03-30
**Focus:** OAuth, Configuration Resolution, Docker Development Runtime

## Overview

Resolved the runtime error:

```json
{"detail":"Google OAuth is not configured"}
```

This error persisted even after updating `deploy/easy/.env` and restarting the backend container.  
The root cause was not simply a missing Google OAuth client ID/secret. The real issue was that the running backend process resolved configuration from a different `.env` source than expected when development hot-reload and bind-mounted backend code were enabled.

## Problem Description

The failing endpoint was:

```text
http://localhost/api/v1/auth/google
```

The backend responded with:

```json
{"detail":"Google OAuth is not configured"}
```

At first glance this suggested:

- `GOOGLE_CLIENT_ID` was empty
- `GOOGLE_CLIENT_SECRET` was empty

However, `deploy/easy/.env` already contained valid values, so a normal "just fill the env file" explanation did not match the observed behavior.

## Discovery Process

### 1. Verified the Route Logic
- **File:** `backend/app/routers/oauth.py`

The Google login route explicitly fails if the settings object does not contain Google OAuth configuration:

- `GET /auth/google` checks `settings.GOOGLE_CLIENT_ID`
- `GET /auth/google/callback` checks both `settings.GOOGLE_CLIENT_ID` and `settings.GOOGLE_CLIENT_SECRET`

This confirmed the error was generated intentionally by the backend configuration layer.

### 2. Verified the Expected Settings Fields
- **File:** `backend/app/config.py`

Confirmed that the backend expects:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FRONTEND_URL`

These values are loaded through `pydantic_settings`.

### 3. Checked `deploy/easy/.env`
- **File:** `deploy/easy/.env`

Confirmed that this file already contained:

- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `FRONTEND_URL=http://localhost`

So the problem was not that the deployment env file was blank.

### 4. Inspected the Running Backend Container
Inspected both:

- the runtime environment variables inside `vicoo-backend`
- the baked `/app/.env` file inside the container

Findings:

- `/app/.env` inside the container did contain the Google OAuth values
- but the backend process still returned `"Google OAuth is not configured"`

This proved the running app was not effectively using the expected config source.

### 5. Identified the Config Shadowing
- **File:** `deploy/easy/docker-compose.yml`

The backend service includes this development bind mount:

```yaml
- ../../backend:/app/backend
```

That means the container uses the host machine's `backend/` directory at runtime.

### 6. Checked the Bind-Mounted Backend Directory
- **File:** `backend/.env`

The mounted `backend/.env` file still contained:

- empty `GOOGLE_CLIENT_ID`
- empty `GOOGLE_CLIENT_SECRET`
- `FRONTEND_URL=http://localhost:5173`

This was the real source of the problem.

When the app was evaluated from `/app/backend`, settings resolution used the bind-mounted backend directory context, and the effective OAuth configuration became empty even though `deploy/easy/.env` was populated.

### 7. Reproduced the Split Behavior Inside the Container
Two checks were run inside the same container:

1. From `/app`
   - Google settings resolved correctly

2. From `/app/backend`
   - Google settings resolved as empty

This conclusively proved the runtime configuration was path-sensitive because multiple `.env` sources existed and the bind-mounted backend directory introduced a conflicting `.env`.

## Root Cause

The Google OAuth error was caused by a **configuration resolution conflict**:

1. `deploy/easy/.env` contained valid OAuth credentials
2. the backend container also bind-mounted `../../backend` to `/app/backend` for hot reload
3. the mounted `backend/.env` contained empty OAuth values
4. the running backend process resolved settings from the mounted backend context rather than exclusively from `deploy/easy/.env`

As a result, the live app behaved as if Google OAuth were unconfigured.

## Implementation & Fix

### 1. Added Explicit OAuth Runtime Environment Variables
- **File:** `deploy/easy/docker-compose.yml`

Updated the backend service to pass the OAuth configuration directly as container environment variables:

- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

This makes the runtime configuration explicit and stable, even when:

- `/app/backend` is bind-mounted
- `backend/.env` exists
- the backend is running in development hot-reload mode

### 2. Recreated the Backend Container
Executed:

```bash
docker compose up -d backend
```

This recreated `vicoo-backend` so the new runtime environment variables would take effect.

## Verification Performed

### 1. Verified Runtime Environment in the Live Container
Confirmed that the running backend container now exposes:

- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `FRONTEND_URL=http://localhost`

through the actual container environment.

### 2. Verified the Live OAuth Endpoint
Executed a live request to:

```text
http://localhost/api/v1/auth/google
```

Result after the fix:

```text
HTTP/1.1 302 Found
```

The endpoint now correctly redirects to:

- `https://accounts.google.com/o/oauth2/v2/auth?...`

This proves the backend no longer considers Google OAuth "unconfigured".

## Final Result

- [x] `GET /api/v1/auth/google` no longer returns `500`
- [x] Runtime Google OAuth config is now injected explicitly via `docker-compose.yml`
- [x] Bind-mounted `backend/.env` no longer causes false "not configured" behavior
- [x] Google OAuth now starts the expected authorization redirect flow

## Important Note

This fix resolves the `"Google OAuth is not configured"` error only.

The next requirement for a successful end-to-end Google login is that Google Cloud Console must include the exact callback URI generated by the backend. With the current configuration, the redirect URI is:

```text
http://localhost/api/v1/auth/google/callback
```

If that URI is not registered in Google Cloud Console, the next failure will be a Google-side redirect URI mismatch rather than a backend configuration error.
