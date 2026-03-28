# Update 001: Robust User Logout & Token Blacklisting

**Date:** 2026-03-28
**Focus:** Security, Authentication, State Management

## Overview
Implemented a production-grade logout mechanism using server-side token blacklisting (Redis) and corrected frontend integration to ensure sessions are invalidated both locally and on the server.

## Changes

### 1. Backend: Token Uniqueness & Blacklisting
- **File:** `backend/app/security.py`
    - Added `jti` (JWT ID) to both Access and Refresh tokens using `uuid4`.
    - This allows each token instance to be uniquely identified and tracked.
- **File:** `backend/app/deps.py`
    - Implemented `is_token_blacklisted(jti: str)` helper using Redis.
    - Updated `get_current_user` and related dependencies to reject requests if the token's `jti` exists in the `blacklist:` prefix in Redis.
- **File:** `backend/app/routers/auth.py`
    - **Logout Endpoint:** Now extracts `jti` from both the `refresh_token` cookie and the `Authorization` header. These JTIs are added to the Redis blacklist with a TTL matching the token's remaining expiry.
    - **Refresh Endpoint:** 
        - Now checks the blacklist before issuing new tokens.
        - Implemented **Token Rotation Blacklisting**: Once a refresh token is used to get a new pair, the old refresh token's `jti` is immediately blacklisted to prevent reuse/replay attacks.

### 2. Frontend: Correct Logout Invocation
- **File:** `frontend/web-react/src/components/layout/Header.tsx`
- **File:** `frontend/web-react/src/components/layout/MobileNav.tsx`
- **File:** `frontend/web-react/src/pages/Profile/index.tsx`
    - Replaced direct calls to `authStore.logout()` (which only cleared local state) with `logout()` from the `useAuth` hook.
    - This ensures that the `/auth/logout` API is called, the server-side tokens are blacklisted, and the React Query cache is cleared.

## Verification Status
- [x] Tokens now contain `jti` field.
- [x] Logout API correctly identifies and blacklists active tokens.
- [x] Authenticated routes reject blacklisted tokens with `401 Unauthorized`.
- [x] Frontend Header/Nav/Profile correctly trigger the backend logout process.

## Next Steps
- Implement logic to handle Admin logout similarly once the Admin API is fully transitioned from mock data.
- Standardize i18n keys for logout-related error messages.
