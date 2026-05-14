from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from datetime import datetime
import logging

from app.database import get_db
from app.config import settings
from app.models.donation import Donation
from app.models.campaign import Campaign
from app.schemas import ApiResponse, DonationCreate, DonationOut, DonationListPageResponse, DonationListSummaryOut, PaginatedResponse
from app.deps import get_current_user, get_optional_current_user
from app.services.payment_service import get_payment_service

router = APIRouter(prefix="/donations", tags=["Donations"])

logger = logging.getLogger(__name__)


def _serialize_donation(donation: Donation) -> dict:
    return DonationOut(
        id=donation.id,
        donor_name=donation.donor_name,
        donor_user_id=donation.donor_user_id,
        amount=donation.amount,
        currency=donation.currency,
        payment_method=donation.payment_method,
        payment_id=donation.payment_id,
        campaign_id=donation.campaign_id,
        status=donation.status,
        is_anonymous=donation.is_anonymous,
        message=donation.message,
        created_at=donation.created_at,
    ).model_dump(mode="json")


def _redact_name(name: str | None, is_anonymous: bool | None = None) -> str:
    """Redact donor name for unauthenticated viewers."""
    if is_anonymous or not name:
        return "匿名爱心人士"
    # Show first character only, rest as asterisks
    if len(name) <= 1:
        return "*"
    return name[0] + "*" * (len(name) - 1)


from app.services.donation.service import DonationService
from app.utils.masking import mask_name

@router.get("", response_model=DonationListPageResponse)
async def list_donations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    campaign_id: int | None = Query(None),
    status: str | None = Query(None),
    payment_method: str | None = Query(None, description="wechat | alipay | stripe | paypal"),
    search: str | None = Query(None, description="Filter by donor name (partial match)"),
    db: AsyncSession = Depends(get_db),
    current_user: dict | None = Depends(get_optional_current_user),
):
    """List donations with optional filters."""
    donation_service = DonationService(db)
    try:
        summary_raw = await donation_service.donation_list_summary(
            campaign_id, status, payment_method, search
        )
        donations, total = await donation_service.list_donations(
            page, page_size, campaign_id, status, payment_method, search
        )
        items = []
        for d in donations:
            item = DonationOut.model_validate(d).model_dump()
            if not current_user:
                item["donor_name"] = mask_name(item.get("donor_name")) if not item.get("is_anonymous") else "匿名爱心人士"
                item.pop("message", None)
                item.pop("donor_user_id", None)
            items.append(item)
        return DonationListPageResponse(
            data=items,
            total=total,
            page=page,
            page_size=page_size,
            summary=DonationListSummaryOut(**summary_raw),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing donations: {e}")
        return DonationListPageResponse(
            data=[],
            total=0,
            page=page,
            page_size=page_size,
            summary=DonationListSummaryOut(),
        )

@router.get("/stats", response_model=ApiResponse)
async def donation_stats(db: AsyncSession = Depends(get_db)):
    """Get public donation statistics."""
    donation_service = DonationService(db)
    try:
        stats = await donation_service.get_stats()
        return ApiResponse(data=stats)
    except HTTPException:
        raise
    except Exception:
        return ApiResponse(data={"total_amount": "0.00", "total_donors": 0, "currency": "CNY"})

@router.get("/tiers", response_model=ApiResponse)
async def donation_tiers():
    """Get available donation tiers."""
    return ApiResponse(data=[
        {"id": 1, "amount": 50, "label": "Bronze", "description": "Fund one art supply kit"},
        {"id": 2, "amount": 200, "label": "Silver", "description": "Fund a child's art course for one semester"},
        {"id": 3, "amount": 500, "label": "Gold", "description": "Fund a village art exhibition"},
        {"id": 4, "amount": 2000, "label": "Platinum", "description": "Fund art supplies for an entire school"},
    ])


@router.get("/mine", response_model=PaginatedResponse)
async def my_donations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get current user's donations."""
    stmt = select(Donation).where(Donation.donor_user_id == current_user["id"])
    count_stmt = select(func.count(Donation.id)).where(Donation.donor_user_id == current_user["id"])
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.order_by(Donation.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    donations = result.scalars().all()
    return PaginatedResponse(
        data=[_serialize_donation(d) for d in donations],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{donation_id}", response_model=ApiResponse)
async def get_donation(donation_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get a donation by ID."""
    donation_service = DonationService(db)
    try:
        donation = await donation_service.get_donation_by_id(donation_id)
        if current_user.get("role") != "admin" and donation.donor_user_id != current_user.get("id"):
            if donation.donor_user_id is not None:
                raise HTTPException(status_code=403, detail="Access denied")
        return ApiResponse(data=DonationOut.model_validate(donation).model_dump())
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Donation not found")

@router.post("", response_model=ApiResponse, status_code=201)
@router.post("/create", response_model=ApiResponse, status_code=201)
async def create_donation(body: DonationCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Create a new donation."""
    donation_service = DonationService(db)
    try:
        donation_data = body.model_dump()
        if donation_data.get("donor_user_id") is None:
            donation_data["donor_user_id"] = current_user["id"]

        donation = await donation_service.create_donation(donation_data)
        await db.refresh(donation)

        response_data = _serialize_donation(donation)
        response_data["donationId"] = donation.id

        if body.payment_method == "wechat":
            try:
                payment_params = get_payment_service().create_unified_order(
                    order_no=f"DON{donation.id}",
                    amount=body.amount,
                    description="公益捐赠" if body.is_anonymous else f"公益捐赠 - {body.donor_name}",
                    trade_type="JSAPI",
                    donation_id=donation.id
                )
                response_data.update(payment_params)
            except HTTPException:
                raise
            except Exception as pay_error:
                logger.error(f"Payment parameter generation failed: {pay_error}")
                if settings.APP_ENV == "development":
                    response_data["payment_error"] = str(pay_error)
                    response_data["simulation_mode"] = True
                else:
                    raise HTTPException(status_code=400, detail="Payment initialization failed. Please check configuration.")
        elif body.payment_method == "alipay":
            is_alipay_configured = all([
                settings.ALIPAY_APP_ID,
                settings.ALIPAY_PRIVATE_KEY,
                settings.ALIPAY_PUBLIC_KEY,
                settings.ALIPAY_NOTIFY_URL,
            ])
            if not is_alipay_configured:
                if settings.APP_ENV == "production":
                    raise HTTPException(status_code=400, detail="Alipay is not configured for this environment.")
                response_data["payment_notice"] = "Alipay web payment is not configured in this environment yet."
                response_data["simulation_mode"] = True

        return ApiResponse(data=response_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Donation creation failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{donation_id}/certificate", response_model=ApiResponse)
async def get_donation_certificate(donation_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get donation certificate data."""
    try:
        stmt = select(Donation).where(Donation.id == donation_id)
        result = await db.execute(stmt)
        donation = result.scalar_one_or_none()
        if not donation:
            raise HTTPException(status_code=404, detail="Donation not found")
        if current_user.get("role") != "admin" and donation.donor_user_id and donation.donor_user_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Forbidden")
        if donation.status != "completed":
            raise HTTPException(status_code=400, detail="Certificate available only for completed donations")
        return ApiResponse(data={
            "donation_id": donation.id,
            "donor_name": donation.donor_name if not donation.is_anonymous else "爱心人士",
            "amount": str(donation.amount),
            "currency": donation.currency,
            "date": donation.created_at.isoformat() if donation.created_at else None,
            "campaign_id": donation.campaign_id,
            "certificate_no": f"TH-DON-{donation.id:06d}",
            "certificate_url": f"/api/donations/{donation.id}/certificate",
        })
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Donation not found")
