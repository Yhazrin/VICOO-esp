from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Optional, Any
import logging

from app.config import settings
from app.database import get_db
from app.models.user import User, ChildParticipant
from app.models.artwork import Artwork
from app.models.campaign import Campaign
from app.models.donation import Donation
from app.models.product import Product
from app.models.order import Order
from app.models.audit import AuditLog
from app.schemas import ApiResponse, AuditLogOut, DashboardMetrics, PaginatedResponse, DonationOut
from app.deps import require_role
from app.models.settings import SiteSettings

router = APIRouter(prefix="/admin", tags=["Admin"])

logger = logging.getLogger(__name__)


from typing import List
from app.services.admin.service import AdminService
from app.services.donation.service import DonationService

@router.get("/dashboard", response_model=ApiResponse)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin", "editor")),
):
    """Get aggregated dashboard statistics for admin. (Refactored)"""
    admin_service = AdminService(db)
    try:
        stats = await admin_service.get_dashboard_stats()
        return ApiResponse(data=stats)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard stats failed: {e}")
        if not settings.DEMO_MODE:
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        return ApiResponse(
            data={
                "total_donation_amount": "0",
                "total_donations": 0,
                "pending_artworks": 0,
                "active_campaigns": 0,
                "total_users": 0,
                "total_artworks": 0,
                "total_orders": 0,
                "total_clothing_donations": 0,
            }
        )


@router.post("/donations/{donation_id}/approve", response_model=ApiResponse)
async def approve_donation_admin(
    donation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "editor")),
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
        logger.exception(f"Approve donation {donation_id} failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/analytics/ai", response_model=ApiResponse)
async def ai_analytics(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin", "editor")),
):
    """Get AI rollout metrics for quality gates and handoff tracking."""
    admin_service = AdminService(db)
    try:
        stats = await admin_service.get_ai_rollout_metrics()
        return ApiResponse(data=stats)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI analytics failed: {e}")
        return ApiResponse(data={"chat_count": 0, "feedback_total": 0, "handoff_count": 0})

@router.post("/artworks/batch-moderate", response_model=ApiResponse)
async def batch_moderate_artworks(
    artwork_ids: List[int],
    status: str,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin", "editor")),
):
    """Batch approve or reject artworks."""
    admin_service = AdminService(db)
    try:
        result = await admin_service.batch_moderate_artworks(artwork_ids, status)
        return ApiResponse(data=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch moderation failed: {e}")
        raise HTTPException(status_code=500, detail="Batch operation failed")

@router.post("/children/batch-moderate", response_model=ApiResponse)
async def batch_moderate_children(
    child_ids: List[int],
    status: str,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin", "compliance")),
):
    """Batch approve or withdraw child participants."""
    admin_service = AdminService(db)
    try:
        result = await admin_service.batch_moderate_children(child_ids, status)
        return ApiResponse(data=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch child moderation failed: {e}")
        raise HTTPException(status_code=500, detail="Batch operation failed")


@router.post("/auth/verify-access", response_model=ApiResponse)
async def verify_audit_access(
    body: dict[str, str],
    _current_user: dict = Depends(require_role("admin")),
):
    """Verify admin audit access code."""
    access_code = body.get("accessCode", "")
    if not access_code:
        raise HTTPException(status_code=400, detail="Access code required")
    import os
    expected = os.environ.get("ADMIN_AUDIT_CODE", "vicoo-admin-2025")
    if access_code != expected:
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
            "site_name": "Uniqlo × VICOO 公益",
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


_ALLOWED_SETTINGS_KEYS = {
    "site_name", "site_tagline", "contact_email",
    "donation_enabled", "shop_enabled", "registration_enabled", "maintenance_mode",
    "payment_methods",
}


@router.put("/settings", response_model=ApiResponse)
async def update_settings(
    body: dict[str, Any],
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """Update admin settings."""
    try:
        for key, value in body.items():
            if key not in _ALLOWED_SETTINGS_KEYS:
                continue
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
        stmt = select(AuditLog)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        if resource:
            stmt = stmt.where(AuditLog.resource == resource)
        count_stmt = select(func.count(AuditLog.id))
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
        logger.error(f"Audit logs failed: {e}", exc_info=True)
        return PaginatedResponse(data=[], total=0, page=page, page_size=page_size)


@router.get("/child-participants", response_model=PaginatedResponse)
async def list_child_participants(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin")),
):
    """List child participants (admin only, sensitive data)."""
    try:
        stmt = select(ChildParticipant)
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
                "child_name": p.child_name,
                "display_name": p.display_name,
                "age": p.age,
                "guardian_name": p.guardian_name,
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
        logger.error(f"Child participants list failed: {e}", exc_info=True)
        return PaginatedResponse(data=[], total=0, page=page, page_size=page_size)


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
        child.consent_date = datetime.now()
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
        logger.error(f"DB write failed during approve_child_consent: {e}", exc_info=True)
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
        logger.error(f"Donation analytics failed: {e}", exc_info=True)
        return ApiResponse(data={
            "by_method": [],
            "by_campaign": [],
        })


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
        logger.error(f"Artwork analytics failed: {e}", exc_info=True)
        return ApiResponse(data={
            "by_status": {},
            "total_views": 0,
            "total_likes": 0,
        })


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
        logger.error(f"Order analytics failed: {e}", exc_info=True)
        return ApiResponse(data={
            "by_status": {},
            "total_revenue": "0",
        })


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

        monthly_users = (await db.execute(select(User.created_at))).all()
        month_counts: dict[str, int] = {}
        for (created_at,) in monthly_users:
            if not created_at:
                continue
            key = created_at.strftime("%Y-%m")
            month_counts[key] = month_counts.get(key, 0) + 1
        by_month = [{"month": k, "count": v} for k, v in sorted(month_counts.items())]

        return ApiResponse(data={
            "by_role": by_role,
            "by_month": by_month,
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User analytics failed: {e}", exc_info=True)
        return ApiResponse(data={
            "by_role": {},
            "by_month": [],
        })
