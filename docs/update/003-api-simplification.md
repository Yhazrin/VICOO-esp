# Update 003: API Path Simplification (Removal of /v1)

**Date:** 2026-03-28
**Focus:** Architecture, Routing, Developer Experience

## Changes
- **Backend:** Removed the `/v1` version prefix from all router registrations in `backend/app/main.py`.
    - Routes are now registered under the `/api` prefix (e.g., `/api/auth/login`).
- **Frontend:** Updated the environment configuration and service logic.
    - Set `VITE_API_BASE_URL=/api` in `deploy/easy/.env.example`.
    - Removed the `/v1` safeguard warning from `frontend/web-react/src/services/api.ts`.

## Deployment Requirement
Since the backend runs inside a Docker container, **a restart is required** for the routing changes to take effect.

**Command:**
```bash
docker compose restart backend
```

## Status
- [x] Backend code updated to `/api`.
- [x] Frontend code updated to `/api`.
- [x] Documentation updated.
