from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import logging

from app.database import get_db
from app.models.supply_chain import SupplyChainRecord
from app.models.product import Product
from app.schemas import ApiResponse, SupplyChainRecordCreate, SupplyChainRecordOut, SupplyChainTrace, PaginatedResponse
from app.deps import get_current_user, require_role

router = APIRouter(prefix="/supply-chain", tags=["Supply Chain"])

logger = logging.getLogger(__name__)

STAGES_ORDER = ["material_sourcing", "processing", "manufacturing", "quality_check", "shipping"]

# ── MOCK DATA (served when database is unavailable) ──────────────
# These records are illustrative examples for development/demo purposes.
# Real supply chain data is loaded from the database when available.
# Certification references and partner names below are fictional.
# ────────────────────────────────────────────────────────────────
_mock_records = [
    {
        "id": 1,
        "product_id": 4,
        "stage": "material_sourcing",
        "description": "[MOCK] 有机棉花采自新疆阿克苏地区合作农场，获得GOTS全球有机纺织品标准认证。",
        "location": "新疆维吾尔自治区阿克苏市",
        "certified": True,
        "cert_image_url": "/static/certs/gots_cert_001.jpg",
        "timestamp": "2025-01-15T08:00:00",
        "created_at": "2025-01-16T10:00:00",
    },
    {
        "id": 2,
        "product_id": 4,
        "stage": "processing",
        "description": "[MOCK] 棉花在经认证的纺纱厂进行清理、梳理和纺纱。工厂采用太阳能供电。",
        "location": "山东省济南市",
        "certified": True,
        "cert_image_url": "/static/certs/processing_cert_001.jpg",
        "timestamp": "2025-01-28T09:00:00",
        "created_at": "2025-01-29T10:00:00",
    },
    {
        "id": 3,
        "product_id": 4,
        "stage": "manufacturing",
        "description": "[MOCK] 成衣在公平贸易认证工厂制作，工人享受合理薪资和安全的工作环境。",
        "location": "广东省广州市",
        "certified": True,
        "cert_image_url": "/static/certs/fair_trade_cert_001.jpg",
        "timestamp": "2025-02-10T08:00:00",
        "created_at": "2025-02-11T10:00:00",
    },
    {
        "id": 4,
        "product_id": 4,
        "stage": "quality_check",
        "description": "[MOCK] 通过第三方质检机构SGS检测，符合GB/T 18401-2010国家标准。",
        "location": "广东省广州市",
        "certified": True,
        "cert_image_url": "/static/certs/sgs_cert_001.jpg",
        "timestamp": "2025-02-20T14:00:00",
        "created_at": "2025-02-21T10:00:00",
    },
    {
        "id": 5,
        "product_id": 4,
        "stage": "shipping",
        "description": "[MOCK] 使用可降解包装材料，通过碳中和物流合作伙伴配送。",
        "location": "全国配送",
        "certified": True,
        "cert_image_url": "/static/certs/carbon_neutral_cert_001.jpg",
        "timestamp": "2025-03-01T08:00:00",
        "created_at": "2025-03-02T10:00:00",
    },
]


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
        raise
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