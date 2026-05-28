import json
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import select

from app.models.supply_chain import SupplyChainRecord
from app.services.base import BaseService
from app.core.audit import audit_action

logger = logging.getLogger("vicoo.supply_chain_service")


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
        Must include latitude/longitude for globe UI (same shape as /supply-chain/trace).
        """
        records = await self.get_product_traceability(product_id)
        out: List[Dict[str, Any]] = []
        for r in records:
            row: Dict[str, Any] = {
                "id": r.id,
                "stage": r.stage,
                "description": r.description,
                "description_en": getattr(r, "description_en", None),
                "location": r.location,
                "location_en": getattr(r, "location_en", None),
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
            if r.gallery_json:
                try:
                    row["gallery"] = json.loads(r.gallery_json)
                except Exception:
                    row["gallery"] = []
            else:
                row["gallery"] = []
            out.append(row)
        return out

    @audit_action(action="create_traceability_record", resource_type="supply_chain")
    async def add_record(self, product_id: int, record_data: Dict[str, Any]) -> SupplyChainRecord:
        """
        Add a new stage to a product's supply chain (Admin action).
        """
        gallery_json = record_data.get("gallery_json")
        if gallery_json is None and record_data.get("gallery") is not None:
            g = record_data.get("gallery")
            gallery_json = json.dumps(g) if g else None

        record = SupplyChainRecord(
            product_id=product_id,
            stage=record_data.get("stage"),
            description=record_data.get("description"),
            description_en=record_data.get("description_en"),
            location=record_data.get("location"),
            location_en=record_data.get("location_en"),
            latitude=record_data.get("latitude"),
            longitude=record_data.get("longitude"),
            certified=record_data.get("certified", False),
            cert_image_url=record_data.get("cert_image_url"),
            carbon_kg=record_data.get("carbon_kg"),
            carbon_note=record_data.get("carbon_note"),
            gallery_json=gallery_json,
            timestamp=record_data.get("timestamp"),
        )
        self.db.add(record)
        await self.db.flush()
        return record

    @audit_action(action="update_traceability_record", resource_type="supply_chain")
    async def update_record(self, record_id: int, data: Dict[str, Any]) -> Optional[SupplyChainRecord]:
        """Partial update (admin/editor)."""
        record = await self.db.get(SupplyChainRecord, record_id)
        if not record:
            return None

        if "gallery" in data:
            g = data.pop("gallery")
            record.gallery_json = json.dumps(g) if g else None

        for key, val in data.items():
            if not hasattr(record, key):
                continue
            setattr(record, key, val)

        await self.db.flush()
        return record
