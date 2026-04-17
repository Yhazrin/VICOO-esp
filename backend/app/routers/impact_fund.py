from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.order import Order
from app.schemas import ApiResponse
from app.schemas.impact_fund import ImpactFundEntryOut
from app.services.impact_fund.service import ImpactFundService
from app.deps import get_current_user

router = APIRouter(prefix="/impact-fund", tags=["Impact Fund"])


@router.get("/orders/{order_id}/entries", response_model=ApiResponse)
async def get_order_impact_entries(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get impact fund allocation entries for an order (order owner or admin)."""
    # Verify order exists and user has access
    order_stmt = select(Order).where(Order.id == order_id)
    order = (await db.execute(order_stmt)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.get("role") != "admin" and order.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    service = ImpactFundService(db)
    entries = await service.get_entries_for_order(order_id)
    return ApiResponse(data=[ImpactFundEntryOut.model_validate(e).model_dump() for e in entries])


@router.get("/summary", response_model=ApiResponse)
async def get_impact_fund_summary(db: AsyncSession = Depends(get_db)):
    """Get public aggregate impact fund statistics."""
    service = ImpactFundService(db)
    summary = await service.get_fund_summary()
    return ApiResponse(data=summary)
