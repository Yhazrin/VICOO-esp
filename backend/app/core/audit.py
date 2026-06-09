import functools
import logging
import json
from typing import Any, Callable, Optional

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.audit import AuditLog
from app.models.user import User

logger = logging.getLogger("vicoo.audit")


async def _resolve_user_name(db: AsyncSession, user_id: Optional[int]) -> Optional[str]:
    """Resolve the user nickname for the audit log.

    For admin users, return the literal 'Admin' to keep the audit trail
    consistent with the rest of the management console. For other users,
    look up the nickname. Returns None if user_id is None or the user no
    longer exists.
    """
    if user_id is None:
        return None
    try:
        stmt = select(User).where(User.id == user_id)
        user = (await db.execute(stmt)).scalar_one_or_none()
        if not user:
            return None
        if user.role == "admin":
            return "Admin"
        return user.nickname
    except Exception as e:  # pragma: no cover - defensive
        logger.warning(f"Audit: failed to resolve user_name for id={user_id}: {e}")
        return None


async def log_audit(
    db: AsyncSession,
    user_id: Optional[int],
    action: str,
    resource: str,
    resource_id: Optional[str],
    status: str = "success",
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_name: Optional[str] = None,
):
    """
    Manually log an audit event to the database.

    If user_name is not provided, the system will resolve it from the users
    table (admin users are normalised to the literal "Admin" display name).
    """
    try:
        if user_name is None and user_id is not None:
            user_name = await _resolve_user_name(db, user_id)
        audit_entry = AuditLog(
            user_id=user_id,
            user_name=user_name,
            action=action,
            resource=resource,
            resource_id=str(resource_id) if resource_id else None,
            details=json.dumps({"status": status, **(details or {})}, ensure_ascii=False),
            ip_address=ip_address,
        )
        db.add(audit_entry)
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
            if db is None and args:
                # Try the first positional arg's `db` attribute (instance method)
                first = args[0]
                db = getattr(first, "db", None)
            user_id = kwargs.get("user_id")

            # If current_user dict is provided, extract id
            current_user = kwargs.get("current_user")
            if current_user and isinstance(current_user, dict):
                user_id = current_user.get("id")

            # Service methods may pass the user id under a different name
            # (e.g. admin_user_id) — scan kwargs and known param aliases.
            if user_id is None:
                for alias in ("admin_user_id", "operator_id", "actor_id"):
                    if alias in kwargs:
                        user_id = kwargs[alias]
                        break

            try:
                result = await func(*args, **kwargs)

                if db:
                    # Capture resource_id from result if it has an 'id' attribute
                    res_id = getattr(result, "id", None) if result else None
                    await log_audit(
                        db=db,
                        user_id=user_id,
                        action=action,
                        resource=resource_type,
                        resource_id=res_id,
                        status="success",
                    )
                return result
            except Exception as e:
                if db:
                    await log_audit(
                        db=db,
                        user_id=user_id,
                        action=action,
                        resource=resource_type,
                        resource_id=None,
                        status="failed",
                        details={"error": str(e)},
                    )
                raise e

        return wrapper

    return decorator
