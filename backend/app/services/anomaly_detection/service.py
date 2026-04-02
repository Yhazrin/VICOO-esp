import logging
from typing import Optional
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from app.services.base import BaseService
from app.models.donation import Donation

logger = logging.getLogger("vicoo.anomaly_detection")

class AnomalyDetectionService(BaseService):
    """
    Service for detecting suspicious behaviors, frauds, or attacks.
    Integrates with audit logs and business metrics to identify anomalies.
    """

    async def check_frequent_small_donations(
        self, 
        user_id: Optional[int] = None, 
        threshold_amount: float = 5.0,
        threshold_count: int = 5,
        time_window_minutes: int = 15
    ) -> bool:
        """
        Detects if a user is making frequent small donations (potential carding attack).
        Returns True if suspicious activity is detected.
        """
        if not user_id:
            return False

        since = datetime.utcnow() - timedelta(minutes=time_window_minutes)
        
        # Count donations by this user within the time window that are below threshold_amount
        query = select(func.count(Donation.id)).where(
            and_(
                Donation.donor_user_id == user_id,
                Donation.amount <= threshold_amount,
                Donation.created_at >= since
            )
        )
        
        result = await self.db.execute(query)
        count = result.scalar()
        
        if count >= threshold_count:
            logger.warning(
                f"Suspicious activity detected: User ID {user_id} made {count} "
                f"small donations (<= {threshold_amount}) in the last {time_window_minutes} minutes."
            )
            return True
        
        return False

    async def is_transaction_risky(self, user_id: int, amount: float) -> bool:
        """
        Determines if a transaction should be flagged for review or blocked.
        """
        # 1. Check for carding attacks (frequent small donations)
        if await self.check_frequent_small_donations(user_id=user_id):
            return True
            
        # 2. Potential future checks:
        # - Unusual amount compared to user's history
        # - High velocity of transactions across different cards (requires integration with payment system)
        # - Geographical anomalies
        
        return False

    async def log_anomaly(self, user_id: int, activity_type: str, details: str):
        """
        Logs an anomaly for further manual review by admins.
        """
        logger.error(f"ANOMALY: User {user_id} - {activity_type}: {details}")
        # In the future, we would write this to an 'anomalies' table for a dashboard.
        pass
