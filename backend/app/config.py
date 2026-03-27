from pydantic_settings import BaseSettings
from typing import Optional, List
from pydantic import field_validator, model_validator
import secrets


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

    # Rate Limiting
    GLOBAL_RATE_LIMIT: int = 1000
    USER_RATE_LIMIT: int = 60

    # Encryption
    ENCRYPTION_KEY: str = _gen_secret(32)

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    # Seed passwords
    SEED_ADMIN_PASSWORD: str = "vicoo-admin"
    SEED_EDITOR_PASSWORD: str = "vicoo-editor"
    SEED_USER_PASSWORD: str = "vicoo-user"
    MOCK_USER_PASSWORD: str = "vicoo-mock"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string (comma-separated, JSON array, or list)."""
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return parsed
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @model_validator(mode="after")
    def validate_cors_security(self):
        if "*" in self.CORS_ORIGINS:
            # Allow wildcard only in development -- override to list for safety
            if self.APP_ENV == "production":
                raise ValueError(
                    "CORS_ORIGINS cannot contain '*' in production."
                )
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
        # Prefer private key for signing if available, otherwise fallback to APP_SECRET_KEY
        return self.JWT_PRIVATE_KEY or self.APP_SECRET_KEY

    @property
    def AES_KEY(self):
        return self.ENCRYPTION_KEY

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
