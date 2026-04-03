import logging
from typing import Optional, List, Dict, Any, Tuple
from decimal import Decimal
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.donation import Donation
from app.models.campaign import Campaign
from app.services.base import BaseService
from app.core.audit import audit_action

from app.utils.cache import cached

logger = logging.getLogger("tonghua.donation_service")

class DonationService(BaseService):
    """
    Service handling donation creation, listing, and statistics.
    """

    @cached(prefix="donations:list", ttl=60)
    async def list_donations(
        self, 
        page: int = 1, 
        page_size: int = 20, 
        campaign_id: Optional[int] = None, 
        status: Optional[str] = None
    ) -> Tuple[List[Donation], int]:
        """
        List donations with pagination and filters.
        """
        stmt = select(Donation)
        if campaign_id is not None:
            stmt = stmt.where(Donation.campaign_id == campaign_id)
        if status:
            stmt = stmt.where(Donation.status == status)
        
        # Count total
        count_stmt = select(func.count(Donation.id))
        if campaign_id is not None:
            count_stmt = count_stmt.where(Donation.campaign_id == campaign_id)
        if status:
            count_stmt = count_stmt.where(Donation.status == status)
        
        total = (await self.db.execute(count_stmt)).scalar() or 0
        
        # Get data
        stmt = stmt.order_by(Donation.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        return result.scalars().all(), total

    @audit_action(action="create_donation", resource_type="donation")
    async def create_donation(self, donation_data: Dict[str, Any]) -> Donation:
        """
        Create a new donation and update campaign amount.
        Includes anomaly detection check for suspicious behavior.
        """
        from app.services.anomaly_detection.service import AnomalyDetectionService
        anomaly_service = AnomalyDetectionService(self.db)
        
        user_id = donation_data.get("donor_user_id")
        amount_val = donation_data.get("amount", 0)
        
        # Security: Anomaly Detection
        if user_id:
            if await anomaly_service.is_transaction_risky(user_id, float(amount_val)):
                logger.warning(f"Blocking potentially risky donation from User {user_id}")
                await anomaly_service.log_anomaly(
                    user_id, "RISKY_DONATION", f"Frequent small donations or unusual activity. Amount: {amount_val}"
                )
                raise HTTPException(
                    status_code=403, 
                    detail="Transaction flagged by security system. Please try again later or contact support."
                )

        amount = Decimal(str(amount_val)).quantize(Decimal("0.00"))
        donation_data["amount"] = amount
        
        donation = Donation(**donation_data)
        self.db.add(donation)

        if donation.campaign_id:
            # Atomic update for campaign current_amount
            stmt = (
                update(Campaign)
                .where(Campaign.id == donation.campaign_id)
                .values(current_amount=Campaign.current_amount + amount)
            )
            await self.db.execute(stmt)
        
        await self.db.flush()
        return donation

    async def get_donation_by_id(self, donation_id: int) -> Donation:
        """
        Get donation detail.
        """
        stmt = select(Donation).where(Donation.id == donation_id)
        result = await self.db.execute(stmt)
        donation = result.scalar_one_or_none()
        if not donation:
            raise HTTPException(status_code=404, detail="Donation not found")
        return donation

    @audit_action(action="complete_donation", resource_type="donation")
    async def complete_donation(self, donation_id: int, payment_id: str) -> Donation:
        """
        Mark donation as completed and generate an electronic certificate.
        """
        donation = await self.get_donation_by_id(donation_id)
        if donation.status == "completed":
            return donation

        donation.status = "completed"
        donation.payment_id = payment_id
        
        # Automatic certificate generation logic
        # Format: TH-DON-YYYYMMDD-ID
        date_str = datetime.now().strftime("%Y%m%d")
        donation.certificate_no = f"TH-DON-{date_str}-{donation.id:06d}"
        donation.certificate_url = f"/api/donations/{donation.id}/certificate"
        
        await self.db.flush()
        return donation

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get donation aggregated stats.
        """
        total_amount = (await self.db.execute(
            select(func.sum(Donation.amount)).where(Donation.status == "completed")
        )).scalar() or 0
        total_count = (await self.db.execute(
            select(func.count(Donation.id)).where(Donation.status == "completed")
        )).scalar() or 0
        
        return {
            "total_amount": str(total_amount),
            "total_donors": total_count,
            "currency": "CNY",
        }
