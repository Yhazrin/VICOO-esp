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
from app.services.donation.certificate import build_certificate_payload

logger = logging.getLogger("vicoo.donation_service")

class DonationService(BaseService):
    """
    Service handling donation creation, listing, and statistics.
    """

    def _donation_filter_conditions(
        self,
        campaign_id: Optional[int] = None,
        status: Optional[str] = None,
        payment_method: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Any]:
        conds: List[Any] = []
        if campaign_id is not None:
            conds.append(Donation.campaign_id == campaign_id)
        if status:
            conds.append(Donation.status == status)
        if payment_method:
            conds.append(Donation.payment_method == payment_method)
        if search and search.strip():
            conds.append(Donation.donor_name.ilike(f"%{search.strip()}%"))
        return conds

    async def donation_list_summary(
        self,
        campaign_id: Optional[int] = None,
        status: Optional[str] = None,
        payment_method: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Counts and completed sum for the current filter set (all pages)."""
        conds = self._donation_filter_conditions(campaign_id, status, payment_method, search)

        base_count = select(func.count(Donation.id))
        for c in conds:
            base_count = base_count.where(c)
        selection_total = (await self.db.execute(base_count)).scalar() or 0

        completed_conds = [*conds, Donation.status == "completed"]
        cc = select(func.count(Donation.id))
        for c in completed_conds:
            cc = cc.where(c)
        completed_count = (await self.db.execute(cc)).scalar() or 0

        failed_conds = [*conds, Donation.status == "failed"]
        fc = select(func.count(Donation.id))
        for c in failed_conds:
            fc = fc.where(c)
        failed_count = (await self.db.execute(fc)).scalar() or 0

        amt = select(func.coalesce(func.sum(Donation.amount), 0))
        for c in completed_conds:
            amt = amt.where(c)
        amount_sum = (await self.db.execute(amt)).scalar() or 0

        return {
            "selection_total": selection_total,
            "completed_count": completed_count,
            "failed_count": failed_count,
            "completed_amount_total": str(amount_sum),
        }

    async def list_donations(
        self,
        page: int = 1,
        page_size: int = 20,
        campaign_id: Optional[int] = None,
        status: Optional[str] = None,
        payment_method: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Donation], int]:
        """
        List donations with pagination and filters.
        """
        conds = self._donation_filter_conditions(campaign_id, status, payment_method, search)
        count_stmt = select(func.count(Donation.id))
        stmt = select(Donation)
        for c in conds:
            count_stmt = count_stmt.where(c)
            stmt = stmt.where(c)
        total = (await self.db.execute(count_stmt)).scalar() or 0
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
        Uses atomic status guard to prevent duplicate certificate generation.
        """
        donation = await self.get_donation_by_id(donation_id)
        if donation.status == "completed":
            return donation

        # Atomic status transition — prevents concurrent double-completion
        result = await self.db.execute(
            update(Donation)
            .where(Donation.id == donation_id, Donation.status != "completed")
            .values(status="completed", payment_id=payment_id)
        )
        if result.rowcount == 0:
            # Already completed by a concurrent request
            await self.db.refresh(donation)
            return donation

        await self.db.refresh(donation)

        # Update campaign amount now that payment is confirmed
        if donation.campaign_id:
            await self.db.execute(
                update(Campaign)
                .where(Campaign.id == donation.campaign_id)
                .values(current_amount=Campaign.current_amount + donation.amount)
            )

        # Automatic certificate generation logic
        date_str = datetime.now().strftime("%Y%m%d")
        donation.certificate_no = f"TH-DON-{date_str}-{donation.id:06d}"
        donation.certificate_url = build_certificate_payload(donation)["certificate_url"]

        await self.db.flush()
        return donation

    async def admin_approve_donation(
        self, donation_id: int, admin_user_id: Optional[int] = None
    ) -> Donation:
        """
        Admin manual approval: pending -> completed.
        Uses atomic status guard to prevent duplicate approvals.
        """
        donation = await self.get_donation_by_id(donation_id)
        if donation.status == "completed":
            return donation
        if donation.status != "pending":
            raise HTTPException(
                status_code=400,
                detail=f"Only pending donations can be approved; current status is '{donation.status}'",
            )

        payment_id = donation.payment_id or f"admin_approved:{admin_user_id or 0}"

        # Atomic status transition — prevents concurrent double-approve
        result = await self.db.execute(
            update(Donation)
            .where(Donation.id == donation_id, Donation.status == "pending")
            .values(status="completed", payment_id=payment_id)
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=400, detail="Donation was already processed or status changed")

        await self.db.refresh(donation)

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
