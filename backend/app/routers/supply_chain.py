from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.database import get_db
from app.models.supply_chain import SupplyChainRecord
from app.models.product import Product
from app.schemas import ApiResponse, SupplyChainRecordCreate, SupplyChainRecordOut, PaginatedResponse
from app.deps import require_role

router = APIRouter(prefix="/supply-chain", tags=["Supply Chain"])

logger = logging.getLogger(__name__)

STAGES_ORDER = ["material_sourcing", "processing", "manufacturing", "quality_check", "shipping"]


from app.services.supply_chain.service import SupplyChainService

@router.get("/records", response_model=PaginatedResponse)
async def list_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: int | None = Query(None),
    stage: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List supply chain records with optional filters. (Refactored)"""
    sc_service = SupplyChainService(db)
    try:
        # For simple listing, we can still use query or add a dedicated method to service
        stmt = select(SupplyChainRecord)
        if product_id is not None:
            stmt = stmt.where(SupplyChainRecord.product_id == product_id)
        if stage:
            stmt = stmt.where(SupplyChainRecord.stage == stage)
        
        count_stmt = select(func.count(SupplyChainRecord.id))
        if product_id is not None:
            count_stmt = count_stmt.where(SupplyChainRecord.product_id == product_id)
        if stage:
            count_stmt = count_stmt.where(SupplyChainRecord.stage == stage)
            
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(SupplyChainRecord.timestamp.asc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        records = result.scalars().all()
        
        return PaginatedResponse(
            data=[SupplyChainRecordOut.model_validate(r).model_dump() for r in records],
            total=total,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing records: {e}")
        return PaginatedResponse(data=[], total=0, page=page, page_size=page_size)

@router.get("/trace/{product_id}", response_model=ApiResponse)
async def trace_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Get full supply chain trace for a product. (Refactored)"""
    sc_service = SupplyChainService(db)
    try:
        # Check product existence
        product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        timeline = await sc_service.get_sustainability_timeline(product_id)
        return ApiResponse(data={
            "product_id": product_id,
            "product_name": product.name,
            "records": timeline,
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Tracing failed: {e}")
        return ApiResponse(data={"product_id": product_id, "records": []})

@router.post("/records", response_model=ApiResponse, status_code=201)
async def create_record(
    body: SupplyChainRecordCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_role("admin", "editor")),
):
    """Create a new supply chain record (admin/editor only). (Refactored)"""
    sc_service = SupplyChainService(db)
    try:
        record = await sc_service.add_record(body.product_id, body.model_dump())
        await db.commit()
        return ApiResponse(data=SupplyChainRecordOut.model_validate(record).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create record: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")