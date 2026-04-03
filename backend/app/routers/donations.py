from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from datetime import datetime
import logging

from app.database import get_db
from app.models.donation import Donation
from app.models.campaign import Campaign
from app.schemas import ApiResponse, DonationCreate, DonationOut, PaginatedResponse
from app.deps import get_current_user, get_optional_current_user
from app.services.payment_service import get_payment_service

router = APIRouter(prefix="/donations", tags=["Donations"])

logger = logging.getLogger(__name__)


def _redact_name(name: str | None, is_anonymous: bool | None = None) -> str:
    """Redact donor name for unauthenticated viewers."""
    if is_anonymous or not name:
        return "匿名爱心人士"
    # Show first character only, rest as asterisks
    if len(name) <= 1:
        return "*"
    return name[0] + "*" * (len(name) - 1)

# ── MOCK DATA (served when database is unavailable) ──────────────
_mock_donations = [
    {"id": 1, "donor_name": "张先生", "donor_user_id": 3, "amount": "500.00", "currency": "CNY", "payment_method": "wechat", "payment_id": "wx20250301123456", "campaign_id": 1, "status": "completed", "is_anonymous": False, "message": "支持孩子们的艺术梦想！", "created_at": "2025-03-01T10:30:00"},
    {"id": 2, "donor_name": "李女士", "donor_user_id": 4, "amount": "1000.00", "currency": "CNY", "payment_method": "alipay", "payment_id": "ali20250302654321", "campaign_id": 1, "status": "completed", "is_anonymous": False, "message": "为乡村美育尽一份力", "created_at": "2025-03-02T14:20:00"},
    {"id": 3, "donor_name": "匿名好心人", "donor_user_id": None, "amount": "2000.00", "currency": "CNY", "payment_method": "wechat", "payment_id": "wx20250303789012", "campaign_id": 2, "status": "completed", "is_anonymous": True, "message": None, "created_at": "2025-03-03T09:00:00"},
    {"id": 4, "donor_name": "John Smith", "donor_user_id": None, "amount": "100.00", "currency": "USD", "payment_method": "stripe", "payment_id": "pi_stripe_001", "campaign_id": 1, "status": "completed", "is_anonymous": False, "message": "Happy to support!", "created_at": "2025-03-05T16:45:00"},
    {"id": 5, "donor_name": "王先生", "donor_user_id": 5, "amount": "300.00", "currency": "CNY", "payment_method": "wechat", "payment_id": "wx20250306345678", "campaign_id": 2, "status": "completed", "is_anonymous": False, "message": "保护我们的乡村记忆", "created_at": "2025-03-06T11:15:00"},
    {"id": 6, "donor_name": "赵女士", "donor_user_id": None, "amount": "5000.00", "currency": "CNY", "payment_method": "alipay", "payment_id": "ali20250310901234", "campaign_id": 3, "status": "completed", "is_anonymous": False, "message": "科技改变未来，希望改变孩子", "created_at": "2025-03-10T08:30:00"},
    {"id": 7, "donor_name": "陈先生", "donor_user_id": None, "amount": "200.00", "currency": "CNY", "payment_method": "wechat", "payment_id": "wx20250315567890", "campaign_id": None, "status": "completed", "is_anonymous": True, "message": "支持公益", "created_at": "2025-03-15T17:00:00"},
    {"id": 8, "donor_name": "Emily Wang", "donor_user_id": None, "amount": "50.00", "currency": "USD", "payment_method": "paypal", "payment_id": "pp_20250316", "campaign_id": 1, "status": "completed", "is_anonymous": False, "message": "Beautiful cause!", "created_at": "2025-03-16T12:00:00"},
    {"id": 9, "donor_name": "刘先生", "donor_user_id": None, "amount": "1500.00", "currency": "CNY", "payment_method": "wechat", "payment_id": "wx20250320123789", "campaign_id": 2, "status": "pending", "is_anonymous": False, "message": "家乡永远在心中", "created_at": "2025-03-20T10:00:00"},
    {"id": 10, "donor_name": "孙女士", "donor_user_id": None, "amount": "800.00", "currency": "CNY", "payment_method": "alipay", "payment_id": "ali20250325456789", "campaign_id": 1, "status": "completed", "is_anonymous": False, "message": "愿每个孩子都能画画", "created_at": "2025-03-25T15:30:00"},
]


from app.services.donation.service import DonationService
from app.utils.masking import mask_name

@router.get("", response_model=PaginatedResponse)
async def list_donations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    campaign_id: int | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict | None = Depends(get_optional_current_user),
):
    """List donations with optional filters."""
    donation_service = DonationService(db)
    try:
        donations, total = await donation_service.list_donations(page, page_size, campaign_id, status)
        items = []
        for d in donations:
            item = DonationOut.model_validate(d).model_dump()
            if not current_user:
                item["donor_name"] = mask_name(item.get("donor_name")) if not item.get("is_anonymous") else "匿名爱心人士"
                item.pop("message", None)
                item.pop("donor_user_id", None)
            items.append(item)
        return PaginatedResponse(
            data=items,
            total=total,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing donations: {e}")
        return PaginatedResponse(data=[], total=0, page=page, page_size=page_size)

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
        await db.commit()

        response_data = DonationOut.model_validate(donation).model_dump()
        response_data["donationId"] = donation.id

        if body.payment_method == "wechat":
            try:
                payment_params = get_payment_service().create_unified_order(
                    order_no=f"DON{donation.id}",
                    amount=body.amount,
                    description=f"公益捐赠" if body.is_anonymous else f"公益捐赠 - {body.donor_name}",
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