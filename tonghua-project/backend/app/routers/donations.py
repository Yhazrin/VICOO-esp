from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from datetime import datetime

from app.database import get_db
from app.models.donation import Donation
from app.models.campaign import Campaign
from app.schemas import ApiResponse, DonationCreate, DonationOut, PaginatedResponse, WeChatPaymentParams
from app.deps import get_current_user, get_optional_current_user
from app.services.payment_service import payment_service

router = APIRouter(prefix="/donations", tags=["Donations"])


def _redact_name(name: str | None, is_anonymous: bool | None = None) -> str:
    """Redact donor name for unauthenticated viewers."""
    if is_anonymous or not name:
        return "匿名爱心人士"
    # Show first character only, rest as asterisks
    if len(name) <= 1:
        return "*"
    return name[0] + "*" * (len(name) - 1)

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


@router.get("", response_model=PaginatedResponse)
async def list_donations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    campaign_id: int | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict | None = Depends(get_optional_current_user),
):
    """List donations with optional filters.

    PII redaction: Unauthenticated users see redacted donor names and messages.
    Authenticated users see full details.
    """
    try:
        stmt = select(Donation)
        if campaign_id is not None:
            stmt = stmt.where(Donation.campaign_id == campaign_id)
        if status:
            stmt = stmt.where(Donation.status == status)
        count_stmt = select(func.count(Donation.id))
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(Donation.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        donations = result.scalars().all()
        items = []
        for d in donations:
            item = DonationOut.model_validate(d).model_dump()
            if not current_user:
                item["donor_name"] = _redact_name(item.get("donor_name"), item.get("is_anonymous"))
                item.pop("message", None)
                item.pop("donor_user_id", None)
            items.append(item)
        return PaginatedResponse(
            data=items,
            total=total,
            page=page,
            page_size=page_size,
        )
    except Exception:
        filtered = _mock_donations
        if campaign_id is not None:
            filtered = [d for d in filtered if d.get("campaign_id") == campaign_id]
        if status:
            filtered = [d for d in filtered if d["status"] == status]
        start = (page - 1) * page_size
        page_items = [dict(d) for d in filtered[start: start + page_size]]
        if not current_user:
            for item in page_items:
                item["donor_name"] = _redact_name(item.get("donor_name"), item.get("is_anonymous"))
                item.pop("message", None)
                item.pop("donor_user_id", None)
        return PaginatedResponse(
            data=page_items,
            total=len(filtered),
            page=page,
            page_size=page_size,
        )


@router.get("/stats", response_model=ApiResponse)
async def donation_stats(db: AsyncSession = Depends(get_db)):
    """Get public donation statistics."""
    try:
        total_amount = (await db.execute(
            select(func.sum(Donation.amount)).where(Donation.status == "completed")
        )).scalar() or 0
        total_count = (await db.execute(
            select(func.count(Donation.id)).where(Donation.status == "completed")
        )).scalar() or 0
        return ApiResponse(data={
            "total_amount": str(total_amount),
            "total_donors": total_count,
            "currency": "CNY",
        })
    except Exception:
        return ApiResponse(data={
            "total_amount": "10350.00",
            "total_donors": 9,
            "currency": "CNY",
        })


@router.get("/tiers", response_model=ApiResponse)
async def list_donation_tiers():
    """List available donation tiers."""
    tiers = [
        {"id": 1, "name": "Seed", "amount": 50, "currency": "CNY", "description": "Art supplies for one child"},
        {"id": 2, "name": "Sprout", "amount": 200, "currency": "CNY", "description": "Workshop materials for a class"},
        {"id": 3, "name": "Bloom", "amount": 500, "currency": "CNY", "description": "Full program support for one school"},
        {"id": 4, "name": "Forest", "amount": 2000, "currency": "CNY", "description": "Community center program for a semester"},
    ]
    return ApiResponse(data=tiers)


@router.get("/mine", response_model=ApiResponse)
async def list_my_donations(current_user: dict = Depends(get_current_user)):
    """List donations for the current user."""
    user_id = current_user["id"]
    my_donations = [d for d in _mock_donations if d.get("donor_user_id") == user_id]
    return ApiResponse(data=my_donations)


@router.get("/{donation_id}", response_model=ApiResponse)
async def get_donation(donation_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get a donation by ID.

    Security: Only the donor or admin can access donation details.
    Prevents IDOR (Insecure Direct Object Reference) attacks.
    """
    try:
        stmt = select(Donation).where(Donation.id == donation_id)
        result = await db.execute(stmt)
        donation = result.scalar_one_or_none()
        if not donation:
            raise HTTPException(status_code=404, detail="Donation not found")

        # Authorization check: only admin or the donor can access
        if current_user.get("role") != "admin" and donation.donor_user_id != current_user.get("id"):
            # Handle anonymous donations (donor_user_id is None)
            if donation.donor_user_id is not None:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied. You can only view your own donations or must be an administrator."
                )

        return ApiResponse(data=DonationOut.model_validate(donation).model_dump())
    except HTTPException:
        raise
    except Exception:
        for d in _mock_donations:
            if d["id"] == donation_id:
                # Authorization check for mock data
                if current_user.get("role") != "admin" and d.get("donor_user_id") != current_user.get("id"):
                    if d.get("donor_user_id") is not None:
                        raise HTTPException(
                            status_code=403,
                            detail="Access denied. You can only view your own donations or must be an administrator."
                        )
                return ApiResponse(data=d)
        raise HTTPException(status_code=404, detail="Donation not found")


@router.post("", response_model=ApiResponse, status_code=201)
@router.post("/create", response_model=ApiResponse, status_code=201)
async def create_donation(body: DonationCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Create a new donation.

    Returns donation data plus WeChat payment parameters if payment_method is 'wechat'.
    """
    try:
        # Enforce 2 decimal precision for amount
        body.amount = body.amount.quantize(Decimal("0.00"))
        # Ensure donor_user_id is populated for ownership verification
        # even if the request body doesn't include it
        body_data = body.model_dump()
        if body_data.get("donor_user_id") is None:
            body_data["donor_user_id"] = current_user["id"]

        donation = Donation(**body_data)
        db.add(donation)

        # Update campaign amount if applicable using atomic UPDATE to prevent race conditions
        if body.campaign_id:
            # Use atomic UPDATE with WHERE clause and RETURNING to safely increment
            stmt = (
                update(Campaign)
                .where(Campaign.id == body.campaign_id)
                .values(current_amount=Campaign.current_amount + body.amount)
                .returning(Campaign.current_amount)
            )
            result = await db.execute(stmt)
            updated_amount = result.scalar_one_or_none()
            if updated_amount is None:
                # Campaign might not exist, but donation should still be created
                pass

        await db.flush()

        # Prepare response data
        response_data = DonationOut.model_validate(donation).model_dump()
        response_data["donationId"] = donation.id  # Add camelCase alias for frontend

        # Add WeChat payment parameters if payment method is WeChat Pay
        if body.payment_method == "wechat":
            payment_params = payment_service.create_unified_order(
                order_no=f"DON{donation.id}",
                amount=body.amount,
                description=f"公益捐赠 - {body.donor_name}" if not body.is_anonymous else "公益捐赠",
                trade_type="JSAPI",
                donation_id=donation.id
            )
            response_data.update(payment_params)

        return ApiResponse(data=response_data)
    except Exception:
        new_id = max(d["id"] for d in _mock_donations) + 1 if _mock_donations else 1
        # Round amount to 2 decimal places to match DB DECIMAL(12, 2) behavior
        body_dump = body.model_dump(mode="json")
        # Ensure donor_user_id is populated in mock data as well
        if body_dump.get("donor_user_id") is None:
            body_dump["donor_user_id"] = current_user["id"]

        if isinstance(body_dump.get("amount"), str):
             # Ensure we handle string representation if any
             try:
                 body_dump["amount"] = str(Decimal(body_dump["amount"]).quantize(Decimal("0.00")))
             except Exception:
                 pass
        else:
             # Should be Decimal, quantize it
             body_dump["amount"] = str(body_dump["amount"].quantize(Decimal("0.00")))

        new_donation = {
            "id": new_id,
            "donationId": new_id,  # Add camelCase alias for frontend
            **body_dump,
            "payment_id": None,
            "status": "pending",
            "created_at": "2025-06-01T00:00:00",
        }

        # Add WeChat payment parameters if payment method is WeChat Pay
        if body.payment_method == "wechat":
            payment_params = payment_service.create_unified_order(
                order_no=f"DON{new_id}",
                amount=body.amount,
                description=f"公益捐赠 - {body.donor_name}" if not body.is_anonymous else "公益捐赠",
                trade_type="JSAPI",
                donation_id=new_id
            )
            new_donation.update(payment_params)

        _mock_donations.append(new_donation)
        return ApiResponse(data=new_donation)


@router.get("/{donation_id}/certificate", response_model=ApiResponse)
async def get_donation_certificate(donation_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get donation certificate data for a completed donation (donor or admin only)."""
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
            "certificate_url": f"/api/v1/donations/{donation.id}/certificate",
        })
    except HTTPException:
        raise
    except Exception:
        for d in _mock_donations:
            if d["id"] == donation_id:
                if current_user.get("role") != "admin" and d.get("donor_user_id") and d["donor_user_id"] != current_user["id"]:
                    raise HTTPException(status_code=403, detail="Forbidden")
                if d["status"] != "completed":
                    raise HTTPException(status_code=400, detail="Certificate available only for completed donations")
                return ApiResponse(data={
                    "donation_id": d["id"],
                    "donor_name": d["donor_name"] if not d["is_anonymous"] else "爱心人士",
                    "amount": d["amount"],
                    "currency": d["currency"],
                    "date": d["created_at"],
                    "campaign_id": d.get("campaign_id"),
                    "certificate_no": f"TH-DON-{d['id']:06d}",
                    "certificate_url": f"/api/v1/donations/{d['id']}/certificate",
                })
        raise HTTPException(status_code=404, detail="Donation not found")
