import sys
import os

# Add backend to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set environment variables
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///test.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("APP_SECRET_KEY", "test-secret-key-for-hmac-sha256")
os.environ.setdefault("ENCRYPTION_KEY", "test-encryption-key-32-bytes-long!!!")
os.environ.setdefault("SEED_ADMIN_PASSWORD", "adminpass")
os.environ.setdefault("SEED_EDITOR_PASSWORD", "editorpass")
os.environ.setdefault("SEED_USER_PASSWORD", "userpass")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("CORS_ORIGINS", '["http://localhost:3000", "http://test", "http://testserver"]')
os.environ.setdefault("WECHAT_APP_ID", "test-app-id")
os.environ.setdefault("WECHAT_APP_SECRET", "test-app-secret")
os.environ.setdefault("WECHAT_MCH_ID", "test-mch-id")
os.environ.setdefault("WECHAT_PAY_API_KEY", "test-api-key")
os.environ.setdefault("WECHAT_NOTIFY_URL", "http://localhost:8000/api/v1/payments/wechat-notify")

from app.main import app

print("Routes:")
for route in app.routes:
    if hasattr(route, "path"):
        methods = getattr(route, "methods", None)
        print(f"{methods} {route.path}")
