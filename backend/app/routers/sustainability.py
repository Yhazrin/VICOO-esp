"""可持续性聚合指标（与供应链、衣物闭环联动）。"""

from decimal import Decimal
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.circular_commerce import ClothingIntake
from app.models.donation import Donation
from app.models.product import Product
from app.models.supply_chain import SupplyChainRecord
from app.schemas import ApiResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sustainability", tags=["Sustainability"])


@router.get("/summary", response_model=ApiResponse)
async def sustainability_summary(db: AsyncSession = Depends(get_db)):
    """公开摘要：捐赠、再生上架、供应链核验覆盖等。"""
    try:
        donation_total = (
            await db.execute(select(func.coalesce(func.sum(Donation.amount), 0)).where(Donation.status == "completed"))
        ).scalar()
        donation_total = donation_total or Decimal(0)

        listed_intakes = (
            await db.execute(select(func.count(ClothingIntake.id)).where(ClothingIntake.status == "listed"))
        ).scalar() or 0

        active_products = (
            await db.execute(select(func.count(Product.id)).where(Product.status == "active"))
        ).scalar() or 0

        certified_nodes = (
            await db.execute(select(func.count(SupplyChainRecord.id)).where(SupplyChainRecord.certified.is_(True)))
        ).scalar() or 0

        total_nodes = (await db.execute(select(func.count(SupplyChainRecord.id)))).scalar() or 0

        verification_rate = round((certified_nodes / total_nodes) * 100, 1) if total_nodes else 0.0

        return ApiResponse(
            data={
                "donation_total_completed": str(donation_total),
                "clothing_intakes_listed": listed_intakes,
                "active_products": active_products,
                "supply_chain_nodes": total_nodes,
                "supply_chain_certified_nodes": certified_nodes,
                "supply_chain_verification_rate_percent": verification_rate,
                "methodology_url": "/traceability",
                "notes": "Metrics are derived from verifiable supply chain and operational data. Post-launch, audited reports should be treated as authoritative.",
            }
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Sustainability summary query failed")
        raise HTTPException(status_code=503, detail="Sustainability data service temporarily unavailable")