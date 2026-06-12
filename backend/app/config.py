from pydantic_settings import BaseSettings
from typing import Optional, List
from pydantic import model_validator
import logging
import os
import secrets
import json

_config_logger = logging.getLogger("vicoo.config")
_DEV_PASSWORD_RESET_OTP_PEPPER = "vicoo-dev-pepper-do-not-use-in-prod"


def _gen_secret(length: int = 32) -> str:
    """Generate a random hex secret."""
    return secrets.token_hex(length)


class Settings(BaseSettings):
    APP_NAME: str = "VICOO API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    APP_ENV: str = "development"  # development, staging, production
    TESTING: str = "0"  # "1" for testing mode

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:////data/vicoo.db"
    DB_ECHO: bool = False

    # Redis (optional -- app gracefully handles unavailability)
    REDIS_URL: str = "redis://localhost:6379/0"

    # App Secret
    APP_SECRET_KEY: str = _gen_secret()

    # JWT Configuration
    JWT_ALGORITHM: str = "HS256"
    JWT_PRIVATE_KEY: Optional[str] = None
    JWT_PUBLIC_KEY: Optional[str] = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # WeChat
    WECHAT_APP_ID: Optional[str] = None
    WECHAT_APP_SECRET: Optional[str] = None
    WECHAT_MCH_ID: Optional[str] = None
    WECHAT_PAY_API_KEY: Optional[str] = None
    WECHAT_NOTIFY_URL: Optional[str] = None

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_API_BASE: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Alipay
    ALIPAY_APP_ID: Optional[str] = None
    ALIPAY_PRIVATE_KEY: Optional[str] = None
    ALIPAY_PUBLIC_KEY: Optional[str] = None
    ALIPAY_NOTIFY_URL: Optional[str] = None
    ALIPAY_GATEWAY: str = "https://openapi.alipay.com/gateway.do"

    # OAuth — GitHub
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None

    # OAuth — Google
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Resend (Mailer)
    RESEND_API_KEY: Optional[str] = None
    MAIL_FROM: str = "VICOO <onboarding@vicoo.yhazrin.xyz>"

    # Frontend URL (for OAuth callback redirect)
    FRONTEND_URL: str = "http://localhost"

    # Rate Limiting
    GLOBAL_RATE_LIMIT: int = 1000
    USER_RATE_LIMIT: int = 60

    # Encryption
    ENCRYPTION_KEY: str = _gen_secret(32)

    # CORS - receives raw string from env, parsed to list in model_validator
    CORS_ORIGINS: str = "http://localhost,http://localhost:5173,http://localhost:9111,http://localhost:9112"

    # For first production deployment with empty DB: set to true to run app.seed when user table is empty (same as development behavior)
    SEED_IF_EMPTY: bool = False

    # Seed passwords
    SEED_ADMIN_PASSWORD: str = "vicoo-admin"
    SEED_EDITOR_PASSWORD: str = "vicoo-editor"
    SEED_USER_PASSWORD: str = "vicoo-user"
    MOCK_USER_PASSWORD: str = "vicoo-mock"

    # Demo mode -- when True, uncontrolled mock fallbacks are allowed on DB failures
    DEMO_MODE: bool = False

    # After-sales: days after order completion when return/exchange is allowed
    AFTER_SALE_WINDOW_DAYS: int = 15
    AFTER_SALE_RETURN_ADDRESS: str = "VICOO 售后中心，上海市浦东新区示例路 100 号，邮编 200120，电话 400-000-0000"

    # Password reset — REQUIRED in production
    # Pepper used when hashing the 6-digit OTP. Any random string. NEVER commit.
    PASSWORD_RESET_OTP_PEPPER: str = os.getenv("PASSWORD_RESET_OTP_PEPPER", _DEV_PASSWORD_RESET_OTP_PEPPER)
    PASSWORD_RESET_TOKEN_TTL_SECONDS: int = 60 * 60  # 1 hour
    PASSWORD_RESET_OTP_MAX_ATTEMPTS: int = 5

    @model_validator(mode="before")
    @classmethod
    def parse_cors_before(cls, values):
        """Store raw CORS value before pydantic_settings processes it."""
        raw = values.get("CORS_ORIGINS")
        if raw is not None and isinstance(raw, str):
            # We'll parse this in the after validator
            pass
        return values

    @model_validator(mode="after")
    def parse_cors_origins(self):
        """Parse CORS_ORIGINS from string to list."""
        raw = self.CORS_ORIGINS
        if isinstance(raw, list):
            return self  # Already parsed (e.g. from .env file)

        if raw == "*":
            self.CORS_ORIGINS = ["*"]
        elif raw.startswith("[") and raw.endswith("]"):
            try:
                self.CORS_ORIGINS = json.loads(raw)
            except json.JSONDecodeError:
                self.CORS_ORIGINS = [o.strip() for o in raw.split(",") if o.strip()]
        else:
            self.CORS_ORIGINS = [o.strip() for o in raw.split(",") if o.strip()]
        return self

    @model_validator(mode="after")
    def validate_secret_key_env(self):
        """Warn if APP_SECRET_KEY was auto-generated (not set via env/.env)."""
        if "APP_SECRET_KEY" not in self.model_fields_set:
            if self.APP_ENV == "production":
                raise ValueError(
                    "APP_SECRET_KEY must be explicitly set in production. "
                    "Auto-generated keys invalidate JWT tokens on every restart."
                )
            _config_logger.warning(
                "APP_SECRET_KEY not set via env — using auto-generated key. "
                "JWT tokens will be invalidated on restart. "
                "Set APP_SECRET_KEY in .env for stable tokens."
            )
        return self

    @model_validator(mode="after")
    def validate_encryption_key_env(self):
        """Warn if ENCRYPTION_KEY was auto-generated (not set via env/.env)."""
        if "ENCRYPTION_KEY" not in self.model_fields_set:
            if self.APP_ENV == "production":
                raise ValueError(
                    "ENCRYPTION_KEY must be explicitly set in production. "
                    "Auto-generated keys make previously encrypted data permanently undecryptable after restart."
                )
            _config_logger.warning(
                "ENCRYPTION_KEY not set via env — using auto-generated key. "
                "Encrypted data (phone numbers, etc.) will be lost on restart. "
                "Set ENCRYPTION_KEY in .env for persistent encryption."
            )
        return self

    @model_validator(mode="after")
    def validate_cors_security(self):
        if "*" in self.CORS_ORIGINS:
            if self.APP_ENV == "production":
                raise ValueError("CORS_ORIGINS cannot contain '*' in production.")
        return self

    @model_validator(mode="after")
    def validate_jwt_keys(self):
        if self.JWT_ALGORITHM in ["RS256", "ES256", "PS256"]:
            if not self.JWT_PRIVATE_KEY:
                raise ValueError(f"JWT_PRIVATE_KEY is required for algorithm {self.JWT_ALGORITHM}")
            if not self.JWT_PUBLIC_KEY:
                raise ValueError(f"JWT_PUBLIC_KEY is required for algorithm {self.JWT_ALGORITHM}")
        elif self.JWT_ALGORITHM == "HS256":
            if not self.APP_SECRET_KEY:
                raise ValueError("APP_SECRET_KEY is required for HS256 algorithm")
        return self

    # Backwards compatibility aliases
    @property
    def SECRET_KEY(self):
        return self.JWT_PRIVATE_KEY or self.APP_SECRET_KEY

    @property
    def AES_KEY(self):
        return self.ENCRYPTION_KEY

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()

# Production guard: warn if password-reset security knobs are unset in prod.
# The OTP pepper being the dev default means anyone with DB read access can
# brute-force the OTP; the FRONTEND_URL being localhost means reset emails
# would send a broken link.
if settings.APP_ENV == "production":
    if (
        "PASSWORD_RESET_OTP_PEPPER" not in os.environ
        or settings.PASSWORD_RESET_OTP_PEPPER == _DEV_PASSWORD_RESET_OTP_PEPPER
    ):
        raise ValueError(
            "PASSWORD_RESET_OTP_PEPPER must be configured to a non-default value in production."
        )
    if "FRONTEND_URL" not in os.environ or settings.FRONTEND_URL.startswith("http://localhost"):
        _config_logger.warning(
            "FRONTEND_URL is not configured for production (current=%r). "
            "Password reset emails will contain localhost links.",
            settings.FRONTEND_URL,
        )
