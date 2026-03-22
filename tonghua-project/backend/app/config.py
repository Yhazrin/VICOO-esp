from pydantic_settings import BaseSettings
from typing import Optional, List
from pydantic import field_validator, model_validator


class Settings(BaseSettings):
    APP_NAME: str = "Tonghua API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    APP_ENV: str = "development"  # development, staging, production
    TESTING: str = "0"  # "1" for testing mode

    # Database - Read from env, no default for security
    DATABASE_URL: str
    DB_ECHO: bool = False

    # Redis - Read from env, no default for security
    REDIS_URL: str

    # App Secret - Read from env, no default for security
    APP_SECRET_KEY: str  # HMAC secret for HS256 or general usage

    # JWT Configuration
    # Default algorithm aligns with .env.example (RS256)
    JWT_ALGORITHM: str = "RS256"
    JWT_PRIVATE_KEY: Optional[str] = None  # Required for RS256, PEM format
    JWT_PUBLIC_KEY: Optional[str] = None   # Required for RS256, PEM format
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # WeChat
    WECHAT_APP_ID: Optional[str] = None
    WECHAT_APP_SECRET: Optional[str] = None
    WECHAT_MCH_ID: Optional[str] = None  # WeChat Pay Merchant ID
    WECHAT_PAY_API_KEY: Optional[str] = None  # WeChat Pay API key
    WECHAT_NOTIFY_URL: Optional[str] = None  # WeChat Pay callback URL

    # Alipay
    ALIPAY_APP_ID: Optional[str] = None
    ALIPAY_PRIVATE_KEY: Optional[str] = None  # RSA2 private key (PKCS#8 PEM)
    ALIPAY_PUBLIC_KEY: Optional[str] = None   # Alipay RSA2 public key for callback verification
    ALIPAY_NOTIFY_URL: Optional[str] = None
    ALIPAY_GATEWAY: str = "https://openapi.alipay.com/gateway.do"

    # Rate Limiting
    GLOBAL_RATE_LIMIT: int = 1000  # per minute
    USER_RATE_LIMIT: int = 60  # per minute

    # Encryption - Read from env, no default for security
    ENCRYPTION_KEY: str  # Must be 32 bytes for AES-256

    # CORS - Default to empty list, must be configured via env
    CORS_ORIGINS: List[str] = []

    # Seed data passwords (for development/testing only) - Required environment variables
    SEED_ADMIN_PASSWORD: str
    SEED_EDITOR_PASSWORD: str
    SEED_USER_PASSWORD: str
    MOCK_USER_PASSWORD: str  # Password for mock users in development

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string (comma-separated, JSON array, or list)."""
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            # Try to parse as JSON array first
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return parsed
                except json.JSONDecodeError:
                    pass
            # Fall back to comma-separated parsing
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @model_validator(mode="after")
    def validate_cors_credentials(self):
        """Reject wildcard CORS origins when credentials are enabled."""
        if "*" in self.CORS_ORIGINS:
            raise ValueError(
                "CORS_ORIGINS cannot be '*' when allow_credentials is enabled. "
                "Specify explicit origins instead."
            )
        return self

    @model_validator(mode="after")
    def validate_jwt_keys(self):
        """Ensure correct keys are provided based on the algorithm."""
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
