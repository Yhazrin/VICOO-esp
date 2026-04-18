import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.supply_chain import SupplyChainRecord
from app.services.base import BaseService
from app.core.audit import audit_action

logger = logging.getLogger("tonghua.supply_chain_service")

class SupplyChainService(BaseService):
    """
    Service handling sustainability traceability and supply chain records.
    """

    async def get_product_traceability(self, product_id: int) -> List[SupplyChainRecord]:
        """
        Get all supply chain stages for a specific product.
        """
        stmt = (
            select(SupplyChainRecord)
            .where(SupplyChainRecord.product_id == product_id)
            .order_by(SupplyChainRecord.timestamp.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_sustainability_timeline(self, product_id: int) -> List[Dict[str, Any]]:
        """
        Get a formatted timeline of the supply chain.
        Must include latitude/longitude for globe UI (same shape as /products/{id}/supply-chain).
        """
        records = await self.get_product_traceability(product_id)
        out: List[Dict[str, Any]] = []
        for r in records:
            row: Dict[str, Any] = {
                "id": r.id,
                "stage": r.stage,
                "description": r.description,
                "location": r.location,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "certified": r.certified,
                "cert_image_url": r.cert_image_url,
                "latitude": r.latitude,
                "longitude": r.longitude,
            }
            if r.carbon_kg is not None:
                row["carbon_kg"] = float(r.carbon_kg)
            if r.carbon_note is not None:
                row["carbon_note"] = r.carbon_note
            out.append(row)
        return out

    @audit_action(action="create_traceability_record", resource_type="supply_chain")
    async def add_record(self, product_id: int, record_data: Dict[str, Any]) -> SupplyChainRecord:
        """
        Add a new stage to a product's supply chain (Admin action).
        """
        record = SupplyChainRecord(
            product_id=product_id,
            stage=record_data.get("stage"),
            description=record_data.get("description"),
            location=record_data.get("location"),
            latitude=record_data.get("latitude"),
            longitude=record_data.get("longitude"),
            certified=record_data.get("certified", False),
            cert_image_url=record_data.get("cert_image_url"),
            timestamp=record_data.get("timestamp")
        )
        self.db.add(record)
        await self.db.flush()
        return record
