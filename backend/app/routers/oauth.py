"""OAuth authentication routes for GitHub and Google."""
import hmac
import logging
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas import ApiResponse, TokenResponse
from app.security import create_access_token, create_refresh_token

logger = logging.getLogger("vicoo.oauth")

router = APIRouter(prefix="/auth", tags=["OAuth"])

# ── Helper ────────────────────────────────────────────────────────

def _set_auth_cookies(response: JSONResponse, access_token: str, refresh_token: str) -> JSONResponse:
    is_secure = settings.APP_ENV != "development"
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, secure=is_secure, samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    response.set_cookie(
        key="access_token", value=access_token,
        httponly=True, secure=is_secure, samesite="lax",
        max_age=15 * 60,
    )
    return response


async def _find_or_create_oauth_user(
    db: AsyncSession,
    provider: str,
    provider_id: str,
    email: str | None,
    nickname: str,
    avatar: str | None = None,
    email_verified: bool = True,
) -> User:
    """Find existing user by OAuth provider ID or email, or create a new one.

    Args:
        email_verified: Only auto-link to existing accounts when the email
            has been verified by the OAuth provider.  Unverified emails
            (e.g. GitHub public email) are used only for new account creation.
    """
    id_column = User.github_id if provider == "github" else User.google_id

    # 1. Try to find by OAuth provider ID
    result = await db.execute(select(User).where(id_column == provider_id))
    user = result.scalar_one_or_none()

    if not user and email and email_verified:
        # 2. Try by email (link accounts) — only for verified emails
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Link OAuth provider to existing account
            setattr(user, f"{provider}_id", provider_id)
            if avatar and not user.avatar:
                user.avatar = avatar
            await db.flush()

    is_new_user = False
    if not user:
        # 3. Create new user
        user = User(
            email=email or f"{provider}_{provider_id}@oauth.vicoo.org",
            password_hash="",  # OAuth users have no password
            nickname=nickname,
            avatar=avatar,
            role="user",
            status="active",
        )
        setattr(user, f"{provider}_id", provider_id)
        db.add(user)
        await db.flush()
        is_new_user = True
        logger.info(f"New OAuth user created: {user.email}")
    else:
        logger.info(f"Existing OAuth user logged in: {user.email}")

    # 4. Trigger welcome email only for new users
    if is_new_user and user.email and not user.email.endswith("@oauth.vicoo.org"):
        import asyncio
        from app.services.mailer import send_welcome_email
        logger.info(f"Triggering welcome email for new user {user.email}")
        asyncio.create_task(send_welcome_email(user.email, user.nickname))

    return user



def _build_auth_redirect(user: User) -> RedirectResponse:
    """Build redirect to frontend with auth tokens."""
    access = create_access_token(subject=str(user.id), role=user.role)
    refresh = create_refresh_token(subject=str(user.id), role=user.role)

    # Redirect to frontend callback page with token in URL fragment (never sent to servers)
    redirect_url = f"{settings.FRONTEND_URL}/auth/callback#access_token={access}"

    response = RedirectResponse(url=redirect_url, status_code=302)
    _set_auth_cookies(response, access, refresh)
    return response


# ── GitHub OAuth ──────────────────────────────────────────────────

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


@router.get("/github")
async def github_login(request: Request):
    """Redirect to GitHub authorization page."""
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth is not configured")

    state = secrets.token_urlsafe(32)
    # Store state in cookie for CSRF protection
    params = urlencode({
        "client_id": settings.GITHUB_CLIENT_ID,
        "scope": "read:user user:email",
        "state": state,
        "redirect_uri": f"{settings.FRONTEND_URL}/api/v1/auth/github/callback",
    })
    response = RedirectResponse(url=f"{GITHUB_AUTHORIZE_URL}?{params}", status_code=302)
    response.set_cookie(key="oauth_state", value=state, httponly=True, samesite="lax", max_age=600)
    return response


@router.get("/github/callback")
async def github_callback(code: str, state: str = "", request: Request = None, db: AsyncSession = Depends(get_db)):
    """Handle GitHub OAuth callback."""
    # CSRF protection: verify state parameter matches cookie
    expected_state = request.cookies.get("oauth_state", "")
    if not expected_state or not hmac.compare_digest(state, expected_state):
        raise HTTPException(status_code=403, detail="Invalid OAuth state parameter")
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth is not configured")

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GITHUB_TOKEN_URL,
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )

        if token_resp.status_code != 200:
            logger.error(f"GitHub token exchange failed: {token_resp.status_code}")
            raise HTTPException(status_code=401, detail="GitHub authentication failed")

        token_data = token_resp.json()
        gh_access_token = token_data.get("access_token")
        if not gh_access_token:
            logger.error(f"GitHub token missing: {token_data}")
            raise HTTPException(status_code=401, detail="GitHub authentication failed")

        # Fetch user profile
        headers = {"Authorization": f"Bearer {gh_access_token}", "Accept": "application/json"}
        user_resp = await client.get(GITHUB_USER_URL, headers=headers)
        if user_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch GitHub profile")

        gh_user = user_resp.json()
        github_id = str(gh_user["id"])
        nickname = gh_user.get("name") or gh_user.get("login") or f"gh_{github_id}"
        avatar = gh_user.get("avatar_url")

        # Always prefer verified email from /user/emails endpoint.
        # The public profile email is unverified — anyone can set it to
        # any address, so we must NOT trust it for account auto-linking.
        email = None
        email_verified = False
        emails_resp = await client.get(GITHUB_EMAILS_URL, headers=headers)
        if emails_resp.status_code == 200:
            for em in emails_resp.json():
                if em.get("primary") and em.get("verified"):
                    email = em["email"]
                    email_verified = True
                    break
            # No primary verified email — fall back to any verified email
            if not email:
                for em in emails_resp.json():
                    if em.get("verified"):
                        email = em["email"]
                        email_verified = True
                        break
        # Last resort: use public profile email but mark as unverified
        if not email:
            email = gh_user.get("email")

    try:
        user = await _find_or_create_oauth_user(
            db, "github", github_id, email, nickname, avatar,
            email_verified=email_verified,
        )
        if user.status == "banned":
            raise HTTPException(status_code=403, detail="Account is banned")
        return _build_auth_redirect(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GitHub OAuth DB error: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Authentication service unavailable")


# ── Google OAuth ──────────────────────────────────────────────────

GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google")
async def google_login(request: Request):
    """Redirect to Google authorization page."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    state = secrets.token_urlsafe(32)
    params = urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": f"{settings.FRONTEND_URL}/api/v1/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    })
    response = RedirectResponse(url=f"{GOOGLE_AUTHORIZE_URL}?{params}", status_code=302)
    response.set_cookie(key="oauth_state", value=state, httponly=True, samesite="lax", max_age=600)
    return response


@router.get("/google/callback")
async def google_callback(code: str, state: str = "", request: Request = None, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback."""
    # CSRF protection: verify state parameter matches cookie
    expected_state = request.cookies.get("oauth_state", "")
    if not expected_state or not hmac.compare_digest(state, expected_state):
        raise HTTPException(status_code=403, detail="Invalid OAuth state parameter")
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{settings.FRONTEND_URL}/api/v1/auth/google/callback",
            },
        )

        if token_resp.status_code != 200:
            logger.error(f"Google token exchange failed: {token_resp.status_code}")
            raise HTTPException(status_code=401, detail="Google authentication failed")

        token_data = token_resp.json()
        g_access_token = token_data.get("access_token")
        if not g_access_token:
            raise HTTPException(status_code=401, detail="Google authentication failed")

        # Fetch user info
        user_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {g_access_token}"},
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch Google profile")

        g_user = user_resp.json()
        google_id = g_user["id"]
        email = g_user.get("email")
        email_verified = bool(g_user.get("email_verified", True))  # Google typically marks verified
        nickname = g_user.get("name") or email or f"google_{google_id}"
        avatar = g_user.get("picture")

    try:
        user = await _find_or_create_oauth_user(
            db, "google", google_id, email, nickname, avatar,
            email_verified=email_verified,
        )
        if user.status == "banned":
            raise HTTPException(status_code=403, detail="Account is banned")
        return _build_auth_redirect(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google OAuth DB error: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Authentication service unavailable")