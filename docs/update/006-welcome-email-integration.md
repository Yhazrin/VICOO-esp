# Update 006: Welcome Email Integration with Resend

**Date:** 2026-03-28
**Focus:** User Engagement, Third-party Integration, Async Services

## Overview
Implemented an automated welcome email system using the **Resend** API. New users joining via GitHub or Google OAuth will now receive a stylized "Welcome to VICOO" email upon their first successful login.

## Implementation Details

### 1. External Service: Resend
- Integrated the `resend` Python SDK.
- Configured a persistent API Key in the backend environment.
- Using `onboarding@resend.dev` as the default sender for the initial development phase.

### 2. Backend Architecture
- **File:** `backend/app/services/mailer.py`
    - Created a dedicated `send_welcome_email` service.
    - Implemented **Async-safe Threading**: Since the Resend SDK is synchronous, calls are wrapped in `loop.run_in_executor` to prevent blocking the main FastAPI event loop.
    - Added a filter to skip sending to internal placeholder emails (e.g., `github_123@oauth.vicoo.org`).
- **File:** `backend/app/routers/oauth.py`
    - Updated `_find_or_create_oauth_user` to detect new user registration.
    - Triggered the email as a background task (`asyncio.create_task`) to ensure the user redirect happens instantly without waiting for the mail server.

### 3. Visual Styling
- The email is styled using an **Editorial / Magazine Aesthetic** matching the web platform:
    - Background: `--color-paper` (`#F5F0E8`)
    - Borders: `--color-warm-gray` (`#D4CFC4`)
    - Typography: References to *Playfair Display* and *IBM Plex Mono* style layouts.

## Configuration Requirements
Updated `.env` settings:
```dotenv
# Resend API Key (Retrieved from dashboard)
RESEND_API_KEY=re_TRca...
MAIL_FROM=VICOO <onboarding@resend.dev>
```

## Verification Status
- [x] Resend SDK added to `requirements.txt`.
- [x] Mailer service created with HTML template.
- [x] OAuth flow triggers email on first-time registration.
- [x] Placeholder emails correctly filtered.

## Next Steps
- Implement email verification for direct email/password signups.
- Design more specific templates for donation receipts and order confirmations.
