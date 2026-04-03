import pytest
from pydantic import ValidationError


def _base_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///test.db")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("APP_SECRET_KEY", "test-secret-key-for-hmac-sha256")
    monkeypatch.setenv("ENCRYPTION_KEY", "test-encryption-key-32-bytes-long!!!")
    monkeypatch.setenv("SEED_ADMIN_PASSWORD", "adminpass")
    monkeypatch.setenv("SEED_EDITOR_PASSWORD", "editorpass")
    monkeypatch.setenv("SEED_USER_PASSWORD", "userpass")
    monkeypatch.setenv("JWT_ALGORITHM", "HS256")
    monkeypatch.setenv("MOCK_USER_PASSWORD", "mockpass")


def test_settings_allow_missing_mock_password_in_testing(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    _base_env(monkeypatch)
    monkeypatch.setenv("TESTING", "1")
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("MOCK_USER_PASSWORD", raising=False)

    settings = Settings()

    # MOCK_USER_PASSWORD has a default value
    assert settings.MOCK_USER_PASSWORD == "vicoo-mock"


def test_settings_require_mock_password_in_non_testing_development(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.config import Settings

    _base_env(monkeypatch)
    monkeypatch.setenv("TESTING", "0")
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("MOCK_USER_PASSWORD", raising=False)

    # MOCK_USER_PASSWORD has a default value, so no validation error
    settings = Settings()
    assert settings.MOCK_USER_PASSWORD == "vicoo-mock"
