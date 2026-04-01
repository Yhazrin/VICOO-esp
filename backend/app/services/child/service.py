import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import ChildParticipant
from app.services.base import BaseService
from app.core.audit import audit_action
from app.utils.masking import mask_name, mask_phone, mask_email

logger = logging.getLogger("tonghua.child_service")

class ChildService(BaseService):
    """
    Service handling child participant information and guardian linkage.
    """

    @audit_action(action="register_child", resource_type="child_participant")
    async def register_child(self, guardian_user_id: int, child_data: Dict[str, Any]) -> ChildParticipant:
        """
        Register a new child participant and link to the guardian account.
        """
        # Ensure mandatory consent
        if not child_data.get("consent_given"):
            raise HTTPException(status_code=403, detail="Guardian consent is required")

        # Create with automated encryption (via model classmethod)
        child = ChildParticipant.create_with_encryption(
            child_name=child_data.get("child_name"),
            display_name=child_data.get("display_name"),
            age=child_data.get("age"),
            guardian_user_id=guardian_user_id,
            guardian_name=child_data.get("guardian_name"),
            guardian_phone_encrypted=child_data.get("guardian_phone"),
            guardian_email_encrypted=child_data.get("guardian_email"),
            region=child_data.get("region"),
            school=child_data.get("school"),
            consent_given=True,
            consent_date=datetime.now(timezone.utc),
            status="pending_review"
        )
        
        self.db.add(child)
        await self.db.flush()
        return child

    async def get_child_detail(self, child_id: int, current_user: dict) -> Dict[str, Any]:
        """
        Get child detail with PII protection (masking for non-compliance users).
        """
        stmt = select(ChildParticipant).where(ChildParticipant.id == child_id)
        result = await self.db.execute(stmt)
        child = result.scalar_one_or_none()
        
        if not child:
            raise HTTPException(status_code=404, detail="Child participant not found")

        # Ownership check
        is_owner = child.guardian_user_id == current_user.get("id")
        is_compliance = current_user.get("role") in ("compliance", "admin")

        if not is_owner and not is_compliance:
            raise HTTPException(status_code=403, detail="Access denied")

        # Prepare response with masking if not compliance/admin
        data = {
            "id": child.id,
            "display_name": child.display_name,
            "age": child.age,
            "region": child.region,
            "school": child.school,
            "status": child.status,
            "artwork_count": child.artwork_count,
            "created_at": child.created_at,
        }

        if is_compliance or is_owner:
            # For compliance/owner, provide decrypted but masked info unless full access is granted
            # For now, we use our masking tool
            data["child_real_name"] = child.child_name_decrypted if is_compliance else mask_name(child.child_name_decrypted)
            data["guardian_name"] = child.guardian_name_decrypted if is_compliance else mask_name(child.guardian_name_decrypted)
            data["guardian_phone"] = child.guardian_phone_decrypted if is_compliance else mask_phone(child.guardian_phone_decrypted)
            
        return data
