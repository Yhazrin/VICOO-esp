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
