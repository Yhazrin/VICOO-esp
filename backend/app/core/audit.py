import functools
import logging
import asyncio
from typing import Any, Callable, Optional
from datetime import datetime, timezone

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog

logger = logging.getLogger("tonghua.audit")


async def log_audit(
    db: AsyncSession,
    user_id: Optional[int],
    action: str,
    resource_type: str,
    resource_id: Optional[str],
    status: str = "success",
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
):
    """
    Manually log an audit event to the database.
    """
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            status=status,
            details=details or {},
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc),
        )
        db.add(audit_entry)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}", exc_info=True)


def audit_action(action: str, resource_type: str):
    """
    Decorator for service methods to automatically log audit events.
    Expects 'db' and 'user_id' (or 'current_user' dict) in kwargs or args.
    """

    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract dependencies
            db = kwargs.get("db")
            user_id = kwargs.get("user_id")
            
            # If current_user dict is provided, extract id
            current_user = kwargs.get("current_user")
            if current_user and isinstance(current_user, dict):
                user_id = current_user.get("id")

            try:
                result = await func(*args, **kwargs)
                
                # Log success asynchronously to not block the response if needed, 
                # but for simplicity we'll wait or use background tasks later.
                if db:
                    # Capture resource_id from result if it has an 'id' attribute
                    res_id = getattr(result, "id", None) if result else None
                    
                    # We create a new task to avoid blocking the main business logic
                    asyncio.create_task(
                        log_audit(
                            db=db,
                            user_id=user_id,
                            action=action,
                            resource_type=resource_type,
                            resource_id=res_id,
                            status="success",
                        )
                    )
                return result
            except Exception as e:
                if db:
                    asyncio.create_task(
                        log_audit(
                            db=db,
                            user_id=user_id,
                            action=action,
                            resource_type=resource_type,
                            resource_id=None,
                            status="failed",
                            details={"error": str(e)},
                        )
                    )
                raise e

        return wrapper

    return decorator
