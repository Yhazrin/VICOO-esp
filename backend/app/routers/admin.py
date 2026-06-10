from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, not_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from typing import Optional
import hmac
import logging
import os

from app.config import settings
from app.database import get_db
from app.models.user import User, ChildParticipant
from app.models.artwork import Artwork
from app.models.donation import Donation
from app.models.order import Order
from app.models.audit import AuditLog
from app.schemas import ApiResponse, AuditLogOut, PaginatedResponse, DonationOut, SettingsUpdate, VerifyAccessRequest
from app.deps import require_role
from app.models.settings import SiteSettings
from app.utils.masking import mask_name

router = APIRouter(prefix="/admin", tags=["Admin"])

logger = logging.getLogger(__name__)


def _exclude_health_audit_logs(stmt):
    health_details = [
        "GET /health%",
        "GET health%",
        "GET /api/v1/health%",
        "GET /api/v1/admin/health%",
        "GET /api/v1/system/health%",
        "GET /api/v1/admin/system/health%",
        "GET system/health%",
    ]
    return stmt.where(
        not_(
            or_(
                AuditLog.resource == "health",
                *[func.coalesce(AuditLog.details, "").like(pattern) for pattern in health_details],
            )
        )
    )


from typing import List
from app.services.admin.service import AdminService
from app.services.donation.service import DonationService

@router.get("/dashboard", response_model=ApiResponse)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Get aggregated dashboard statistics for admin. (Refactored)"""
    admin_service = AdminService(db)
    try:
        stats = await admin_service.get_dashboard_stats()
        return ApiResponse(data=stats)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Dashboard stats failed: %s", e)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/donations", response_model=PaginatedResponse)
async def list_donations_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by donation status"),
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """List all donations (admin)."""
    from app.models.donation import Donation
    from sqlalchemy import select, func

    stmt = select(Donation)
    count_stmt = select(func.count(Donation.id))
    if status:
        stmt = stmt.where(Donation.status == status)
        count_stmt = count_stmt.where(Donation.status == status)
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.order_by(Donation.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()
    return PaginatedResponse(
        data=[DonationOut.model_validate(d).model_dump(mode="json") for d in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/donations/{donation_id}/approve", response_model=ApiResponse)
async def approve_donation_admin(
    donation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Manually approve a pending donation after offline / manual payment review."""
    try:
        donation_service = DonationService(db)
        donation = await donation_service.admin_approve_donation(
            donation_id, admin_user_id=current_user.get("id")
        )
        return ApiResponse(data=DonationOut.model_validate(donation).model_dump(mode="json"))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Approve donation %s failed", donation_id)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/analytics/ai", response_model=ApiResponse)
async def ai_analytics(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Get AI rollout metrics for quality gates and handoff tracking."""
    admin_service = AdminService(db)
    try:
        stats = await admin_service.get_ai_rollout_metrics()
        return ApiResponse(data=stats)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("AI analytics failed: %s", e)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")

_VALID_ARTWORK_STATUSES = {"draft", "pending", "approved", "rejected", "featured"}
_VALID_CHILD_STATUSES = {"active", "withdrawn", "pending_review"}


@router.post("/artworks/batch-moderate", response_model=ApiResponse)
async def batch_moderate_artworks(
    artwork_ids: List[int],
    status: str,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Batch approve or reject artworks."""
    if not artwork_ids:
        raise HTTPException(status_code=400, detail="artwork_ids must not be empty")
    if status not in _VALID_ARTWORK_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {', '.join(sorted(_VALID_ARTWORK_STATUSES))}")
    admin_service = AdminService(db)
    try:
        result = await admin_service.batch_moderate_artworks(artwork_ids, status)
        return ApiResponse(data=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Batch moderation failed: %s", e)
        raise HTTPException(status_code=500, detail="Batch operation failed")

@router.post("/children/batch-moderate", response_model=ApiResponse)
async def batch_moderate_children(
    child_ids: List[int],
    status: str,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Batch approve or withdraw child participants."""
    if not child_ids:
        raise HTTPException(status_code=400, detail="child_ids must not be empty")
    if status not in _VALID_CHILD_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {', '.join(sorted(_VALID_CHILD_STATUSES))}")
    admin_service = AdminService(db)
    try:
        result = await admin_service.batch_moderate_children(child_ids, status)
        return ApiResponse(data=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Batch child moderation failed: %s", e)
        raise HTTPException(status_code=500, detail="Batch operation failed")


@router.post("/auth/verify-access", response_model=ApiResponse)
async def verify_audit_access(
    body: VerifyAccessRequest,
    _current_user: dict = Depends(require_role("admin")),
):
    """Verify admin audit access code."""
    expected = os.environ.get("ADMIN_AUDIT_CODE")
    if not expected:
        raise HTTPException(status_code=500, detail="Audit access code not configured")
    if not hmac.compare_digest(body.access_code, expected):
        raise HTTPException(status_code=403, detail="Invalid access code")
    return ApiResponse(data={"verified": True})


@router.get("/settings", response_model=ApiResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Get admin settings."""
    try:
        result = await db.execute(select(SiteSettings))
        rows = result.scalars().all()
        settings_dict = {}
        for row in rows:
            settings_dict[row.key] = row.value
        # Defaults if no settings exist yet
        defaults = {
            "site_name": "Uniqlo × VICOO Charity",
            "site_tagline": "Welfare Action for a Better World",
            "contact_email": "admin@vicoo.test",
            "donation_enabled": True,
            "shop_enabled": True,
            "registration_enabled": True,
            "maintenance_mode": False,
        }
        for k, v in defaults.items():
            if k not in settings_dict:
                settings_dict[k] = v
        return ApiResponse(data=settings_dict)
    except Exception as e:
        logger.exception("Failed to load settings")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/settings", response_model=ApiResponse)
async def update_settings(
    body: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Update admin settings."""
    try:
        for key, value in body.model_dump(exclude_unset=True).items():
            result = await db.execute(select(SiteSettings).where(SiteSettings.key == key))
            row = result.scalar_one_or_none()
            if row:
                row.value = value
            else:
                db.add(SiteSettings(key=key, value=value))
        await db.flush()
        # Return updated settings
        result = await db.execute(select(SiteSettings))
        rows = result.scalars().all()
        return ApiResponse(data={r.key: r.value for r in rows})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update settings")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/audit-logs", response_model=PaginatedResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """List audit logs with optional filters."""
    try:
        stmt = _exclude_health_audit_logs(select(AuditLog))
        if action:
            stmt = stmt.where(AuditLog.action == action)
        if resource:
            stmt = stmt.where(AuditLog.resource == resource)
        count_stmt = _exclude_health_audit_logs(select(func.count(AuditLog.id)))
        if action:
            count_stmt = count_stmt.where(AuditLog.action == action)
        if resource:
            count_stmt = count_stmt.where(AuditLog.resource == resource)
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(AuditLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        logs = result.scalars().all()
        return PaginatedResponse(
            data=[AuditLogOut.model_validate(l).model_dump() for l in logs],
            total=total,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Audit logs failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/child-participants", response_model=PaginatedResponse)
async def list_child_participants(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin", "compliance")),
):
    """List child participants (admin/compliance only, sensitive data)."""
    try:
        is_compliance_only = _current_user.get("role") == "compliance"
        stmt = select(ChildParticipant).order_by(ChildParticipant.id.desc())
        if status:
            stmt = stmt.where(ChildParticipant.status == status)
        count_stmt = select(func.count(ChildParticipant.id))
        if status:
            count_stmt = count_stmt.where(ChildParticipant.status == status)
        count = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        participants = result.scalars().all()
        data = [
            {
                "id": p.id,
                "child_name": mask_name(p.child_name_decrypted) if is_compliance_only else p.child_name_decrypted,
                "display_name": p.display_name,
                "age": p.age,
                "guardian_name": mask_name(p.guardian_name_decrypted) if is_compliance_only else p.guardian_name_decrypted,
                "region": p.region,
                "school": p.school,
                "consent_given": p.consent_given,
                "artwork_count": p.artwork_count,
                "status": p.status,
                "created_at": str(p.created_at),
            }
            for p in participants
        ]
        return PaginatedResponse(data=data, total=count, page=page, page_size=page_size)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Child participants list failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.put("/child-participants/{child_id}/consent", response_model=ApiResponse)
async def approve_child_consent(
    child_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Approve guardian consent for a child participant (admin only)."""
    try:
        stmt = select(ChildParticipant).where(ChildParticipant.id == child_id)
        result = await db.execute(stmt)
        child = result.scalar_one_or_none()
        if not child:
            raise HTTPException(status_code=404, detail="Child participant not found")
        child.consent_given = True
        child.consent_date = datetime.now(timezone.utc)
        child.status = "active"
        await db.flush()

        # Create audit log
        audit = AuditLog(
            user_id=_current_user["id"],
            user_name=_current_user.get("nickname", ""),
            action="child_consent_approved",
            resource="child_participant",
            resource_id=str(child_id),
            details=f"Approved guardian consent for child participant {child_id}",
        )
        db.add(audit)
        await db.flush()

        return ApiResponse(data={"id": child.id, "consent_given": True, "status": "active"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error("DB write failed during approve_child_consent: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/analytics/donations", response_model=ApiResponse)
async def donation_analytics(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Get donation analytics breakdown."""
    try:
        # By payment method
        method_stmt = select(
            Donation.payment_method,
            func.count(Donation.id),
            func.coalesce(func.sum(Donation.amount), 0),
        ).where(Donation.status == "completed").group_by(Donation.payment_method)
        method_result = await db.execute(method_stmt)
        by_method = [
            {"method": row[0], "count": row[1], "total": str(row[2])}
            for row in method_result.all()
        ]

        # By campaign
        campaign_stmt = select(
            Donation.campaign_id,
            func.count(Donation.id),
            func.coalesce(func.sum(Donation.amount), 0),
        ).where(Donation.status == "completed").group_by(Donation.campaign_id)
        campaign_result = await db.execute(campaign_stmt)
        by_campaign = [
            {"campaign_id": row[0], "count": row[1], "total": str(row[2])}
            for row in campaign_result.all()
        ]

        return ApiResponse(data={"by_method": by_method, "by_campaign": by_campaign})
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Donation analytics failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/analytics/artworks", response_model=ApiResponse)
async def artwork_analytics(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Get artwork analytics breakdown."""
    try:
        status_stmt = select(Artwork.status, func.count(Artwork.id)).group_by(Artwork.status)
        status_result = await db.execute(status_stmt)
        by_status = {row[0]: row[1] for row in status_result.all()}

        total_views = (await db.execute(select(func.coalesce(func.sum(Artwork.view_count), 0)))).scalar() or 0
        total_likes = (await db.execute(select(func.coalesce(func.sum(Artwork.like_count), 0)))).scalar() or 0

        return ApiResponse(data={
            "by_status": by_status,
            "total_views": total_views,
            "total_likes": total_likes,
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Artwork analytics failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/analytics/orders", response_model=ApiResponse)
async def order_analytics(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Get order analytics breakdown."""
    try:
        status_stmt = select(Order.status, func.count(Order.id)).group_by(Order.status)
        status_result = await db.execute(status_stmt)
        by_status = {row[0]: row[1] for row in status_result.all()}

        total_revenue = (await db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(Order.status.in_(["paid", "shipped", "completed"]))
        )).scalar() or 0

        return ApiResponse(data={
            "by_status": by_status,
            "total_revenue": str(total_revenue),
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Order analytics failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/analytics/users", response_model=ApiResponse)
async def user_analytics(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Get user analytics breakdown."""
    try:
        role_stmt = select(User.role, func.count(User.id)).group_by(User.role)
        role_result = await db.execute(role_stmt)
        by_role = {row[0]: row[1] for row in role_result.all()}

        # Cross-dialect monthly grouping
        dialect = db.bind.dialect.name if db.bind else "mysql"
        if dialect == "mysql":
            from sqlalchemy import text
            monthly_result = await db.execute(
                text("SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS cnt FROM users WHERE created_at IS NOT NULL GROUP BY month ORDER BY month")
            )
        else:
            from sqlalchemy import text
            monthly_result = await db.execute(
                text("SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS cnt FROM users WHERE created_at IS NOT NULL GROUP BY month ORDER BY month")
            )
        by_month = [{"month": row[0], "count": row[1]} for row in monthly_result.all()]

        return ApiResponse(data={
            "by_role": by_role,
            "by_month": by_month,
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error("User analytics failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
