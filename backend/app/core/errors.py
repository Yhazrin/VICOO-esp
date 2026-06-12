from typing import Any, Dict, Optional
from fastapi import HTTPException

class BusinessException(HTTPException):
    """
    Base class for all business-related exceptions.
    Ensures a consistent structure for error responses.
    """
    def __init__(
        self,
        status_code: int,
        message: str,
        code: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=message)
        self.message = message
        self.code = code or f"ERR_{status_code}"
        self.data = data or {}

class ResourceNotFoundException(BusinessException):
    def __init__(self, message: str = "Resource not found", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=404, message=message, code="RESOURCE_NOT_FOUND", data=data)

class ForbiddenException(BusinessException):
    def __init__(self, message: str = "Access denied", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=403, message=message, code="ACCESS_DENIED", data=data)

class UnauthorizedException(BusinessException):
    def __init__(self, message: str = "Unauthorized", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=401, message=message, code="UNAUTHORIZED", data=data)

class ValidationException(BusinessException):
    def __init__(self, message: str = "Validation failed", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=422, message=message, code="VALIDATION_FAILED", data=data)

class ConflictException(BusinessException):
    def __init__(self, message: str = "Resource conflict", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=409, message=message, code="CONFLICT", data=data)

class ServiceUnavailableException(BusinessException):
    def __init__(self, message: str = "Service temporarily unavailable", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=503, message=message, code="SERVICE_UNAVAILABLE", data=data)


# ── Auth / registration-specific errors ─────────────────────────
# These are the structured codes the frontend keys on. Keep them in sync with
# frontend/web-react/src/i18n/{en,zh}.json under `register.errors.*`.
class EmailAlreadyExistsException(BusinessException):
    """409 — the email is already registered. Frontend shows a 'sign in instead' hint."""

    def __init__(self, data: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=409,
            message="An account with this email already exists.",
            code="EMAIL_ALREADY_EXISTS",
            data=data,
        )


class WeakPasswordException(BusinessException):
    """400 — password didn't pass server-side strength checks beyond the schema layer."""

    def __init__(self, message: str = "Password is too weak. Please choose a stronger one.", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=400, message=message, code="WEAK_PASSWORD", data=data)


class InvalidNicknameException(BusinessException):
    """400 — nickname is syntactically invalid (e.g. whitespace-only, control chars)."""

    def __init__(self, message: str = "Nickname is invalid.", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=400, message=message, code="INVALID_NICKNAME", data=data)


class InvalidPhoneException(BusinessException):
    """400 — phone didn't match the expected format."""

    def __init__(self, message: str = "Phone number is invalid.", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=400, message=message, code="INVALID_PHONE", data=data)


class RegistrationRateLimitedException(BusinessException):
    """429 — too many registration attempts from this IP."""

    def __init__(self, message: str = "Too many registration attempts. Please try again later.", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=429, message=message, code="RATE_LIMITED", data=data)


class WrongCurrentPasswordException(BusinessException):
    """401 — current password verification failed."""

    def __init__(self, message: str = "Current password is incorrect.", data: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=401, message=message, code="WRONG_CURRENT_PASSWORD", data=data)


class OAuthOnlyAccountException(BusinessException):
    """400 — account has no local password (OAuth-only)."""

    def __init__(self, data: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=400,
            message="This account uses social login. Set a password via forgot-password before changing email.",
            code="OAUTH_ONLY_ACCOUNT",
            data=data,
        )
