import logging
from typing import Optional, Dict, Any, Tuple
from decimal import Decimal
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import PaymentTransaction
from app.models.order import Order
from app.models.donation import Donation
from app.services.base import BaseService
from app.services.donation.service import DonationService
from app.core.audit import audit_action
from app.config import settings

logger = logging.getLogger("tonghua.payment_service")

class PaymentService(BaseService):
    """
    Service handling payment transaction lifecycle and callbacks.
    """

    @audit_action(action="create_payment_intent", resource_type="payment")
    async def create_payment_transaction(
        self, 
        amount: Decimal, 
        method: str, 
        order_id: Optional[int] = None, 
        donation_id: Optional[int] = None,
        expiry_minutes: int = 30
    ) -> PaymentTransaction:
        """
        Create a new pending payment transaction.
        """
        # Set expiry time
        expires_at = datetime.now() + timedelta(minutes=expiry_minutes)
        
        tx = PaymentTransaction(
            order_id=order_id,
            donation_id=donation_id,
            amount=amount,
            method=method,
            status="pending",
            expires_at=expires_at
        )
        self.db.add(tx)
        await self.db.flush()
        return tx

    @audit_action(action="payment_callback_success", resource_type="payment")
    async def process_successful_payment(
        self, 
        provider_tx_id: str, 
        amount: Decimal, 
        method: str,
        order_no: Optional[str] = None,
        donation_id: Optional[int] = None,
        raw_data: Optional[Dict] = None
    ) -> PaymentTransaction:
        """
        Process a successful payment callback from a provider.
        Handles status updates for orders/donations and creates/updates the transaction record.
        """
        # Idempotency check: has this provider transaction already been processed?
        existing_stmt = select(PaymentTransaction).where(PaymentTransaction.provider_transaction_id == provider_tx_id)
        existing_tx = (await self.db.execute(existing_stmt)).scalar_one_or_none()

        if existing_tx:
            logger.info(f"Payment {provider_tx_id} already processed.")
            return existing_tx

        order_id = None
        # 1. Handle regular Product Order
        if order_no and not donation_id:
            order_stmt = select(Order).where(Order.order_no == order_no)
            order = (await self.db.execute(order_stmt)).scalar_one_or_none()
            if order:
                order_id = order.id
                await self.db.execute(
                    update(Order)
                    .where(Order.id == order_id)
                    .values(status="paid", payment_id=provider_tx_id, payment_method=method, updated_at=func.now())
                )

        # 2. Handle Donation
        if donation_id:
            donation_service = DonationService(self.db)
            await donation_service.complete_donation(donation_id, provider_tx_id)

        # Create the successful transaction record
        payment_tx = PaymentTransaction(
            order_id=order_id,
            donation_id=donation_id,
            amount=amount,
            method=method,
            provider_transaction_id=provider_tx_id,
            status="success",
            raw_response=raw_data
        )
        self.db.add(payment_tx)
        await self.db.flush()
        return payment_tx


    async def get_payment_by_id(self, payment_id: int) -> PaymentTransaction:
        """
        Get payment details by ID.
        """
        stmt = select(PaymentTransaction).where(PaymentTransaction.id == payment_id)
        result = await self.db.execute(stmt)
        tx = result.scalar_one_or_none()
        if not tx:
            raise HTTPException(status_code=404, detail="Payment transaction not found")
        return tx
