from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
import xml.etree.ElementTree as ET
import secrets
import logging

import hmac as hmac_mod
import hashlib

from app.config import settings
from app.database import get_db
from app.models.payment import PaymentTransaction
from app.models.order import Order
from app.models.donation import Donation
from app.schemas import ApiResponse, PaymentCreate, PaymentOut, PaginatedResponse, WeChatPaymentParams
from app.deps import get_current_user
from app.services.payment_service import get_payment_service
from app.routers.orders import _mock_orders
from app.routers.donations import _mock_donations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

_mock_payments = [
    {"id": 1, "order_id": 1, "donation_id": None, "amount": "257.00", "method": "wechat", "provider_transaction_id": "wx2025040110001", "status": "success", "created_at": "2025-04-01T10:05:00"},
    {"id": 2, "order_id": 2, "donation_id": None, "amount": "258.00", "method": "alipay", "provider_transaction_id": "ali2025040514002", "status": "success", "created_at": "2025-04-05T14:05:00"},
    {"id": 3, "order_id": 3, "donation_id": None, "amount": "368.00", "method": "wechat", "provider_transaction_id": "wx2025041016003", "status": "success", "created_at": "2025-04-10T16:05:00"},
    {"id": 4, "order_id": None, "donation_id": 1, "amount": "500.00", "method": "wechat", "provider_transaction_id": "wx20250301123456", "status": "success", "created_at": "2025-03-01T10:35:00"},
    {"id": 5, "order_id": None, "donation_id": 3, "amount": "2000.00", "method": "wechat", "provider_transaction_id": "wx20250303789012", "status": "success", "created_at": "2025-03-03T09:05:00"},
    {"id": 6, "order_id": 5, "donation_id": None, "amount": "326.00", "method": "alipay", "provider_transaction_id": "ali2025042009005", "status": "success", "created_at": "2025-04-20T09:05:00"},
    # Payment for order 6 (user 1) - to test IDOR and own payment access
    {"id": 7, "order_id": 6, "donation_id": None, "amount": "128.00", "method": "wechat", "provider_transaction_id": "wx2025060100007", "status": "pending", "created_at": "2025-06-01T00:00:00"},
]


from app.services.payment.service import PaymentService

@router.post("/create", response_model=ApiResponse, status_code=201)
async def create_payment(body: PaymentCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Initiate a payment (create payment transaction record). (Refactored)"""
    payment_service = PaymentService(db)
    
    # Ownership check
    if body.order_id:
        stmt = select(Order).where(Order.id == body.order_id)
        order = (await db.execute(stmt)).scalar_one_or_none()
        if not order or (order.user_id != current_user["id"] and current_user.get("role") != "admin"):
            raise HTTPException(status_code=403, detail="Forbidden")
        if Decimal(str(body.amount)) != order.total_amount:
            raise HTTPException(status_code=400, detail="金额不匹配")
    
    if body.donation_id:
        stmt = select(Donation).where(Donation.id == body.donation_id)
        donation = (await db.execute(stmt)).scalar_one_or_none()
        if not donation or (donation.donor_user_id and donation.donor_user_id != current_user["id"] and current_user.get("role") != "admin"):
            raise HTTPException(status_code=403, detail="Forbidden")
        if Decimal(str(body.amount)) != donation.amount:
            raise HTTPException(status_code=400, detail="金额不匹配")

    try:
        tx = await payment_service.create_payment_transaction(
            amount=body.amount,
            method=body.method,
            order_id=body.order_id,
            donation_id=body.donation_id
        )
        await db.commit()
        return ApiResponse(data=PaymentOut.model_validate(tx).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment creation failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/wechat-notify")
async def wechat_notify(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle WeChat payment notification callback. (Refactored)"""
    xml_body = await request.body()
    payment_service = PaymentService(db)
    
    try:
        root = ET.fromstring(xml_body)
        params = {child.tag: child.text for child in root}
        
        if not get_payment_service().verify_payment_signature(params):
            return Response(content="<xml><return_code>FAIL</return_code></xml>", media_type="application/xml")

        out_trade_no = params.get("out_trade_no")
        amount_fen = int(params.get("total_fee", 0))
        amount_cny = Decimal(amount_fen) / Decimal(100)

        # --- Parse Donation ID from order_no if applicable ---
        donation_id = None
        if out_trade_no and out_trade_no.startswith("DON"):
            try:
                donation_id = int(out_trade_no[3:])
            except (ValueError, TypeError):
                pass

        if params.get("result_code") == "SUCCESS":
            await payment_service.process_successful_payment(
                provider_tx_id=params.get("transaction_id"),
                amount=amount_cny,
                method="wechat",
                order_no=out_trade_no if not donation_id else None,
                donation_id=donation_id,
                raw_data=params
            )
            await db.commit()

        return Response(content="<xml><return_code>SUCCESS</return_code></xml>", media_type="application/xml")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WeChat notify error: {e}")
        return Response(content="<xml><return_code>FAIL</return_code></xml>", media_type="application/xml")


@router.post("/alipay-notify")
async def alipay_notify(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Alipay payment notification callback.

    Security: Verifies RSA2 signature from Alipay callback.
    Alipay expects plain text "success" or "failure" response.
    """
    try:
        # Parse form data from Alipay callback
        form_data = await request.form()
        params = {key: form_data[key] for key in form_data.keys()}

        logger.info(f"Alipay callback received for trade_no: {params.get('out_trade_no')}")

        # --- RSA2 Signature Verification ---
        sign = params.get("sign", "")
        if not sign:
            logger.error("Missing sign in Alipay callback")
            return PlainTextResponse("failure")

        # Filter out sign and sign_type, sort remaining params
        sign_type = params.get("sign_type", "RSA2")
        filtered = {k: v for k, v in params.items() if k not in ("sign", "sign_type")}

        # Filter out empty values (Alipay spec)
        filtered = {k: v for k, v in filtered.items() if v is not None and v != ""}

        # Sort and concatenate as key=value&key=value
        sorted_params = sorted(filtered.items())
        sign_string = "&".join(f"{k}={v}" for k, v in sorted_params)

        # Verify RSA2 signature
        if settings.ALIPAY_PUBLIC_KEY:
            try:
                from cryptography.hazmat.primitives import hashes, serialization
                from cryptography.hazmat.primitives.asymmetric import padding
                import base64

                public_key_pem = settings.ALIPAY_PUBLIC_KEY
                if not public_key_pem.startswith("-----"):
                    public_key_pem = f"-----BEGIN PUBLIC KEY-----\n{public_key_pem}\n-----END PUBLIC KEY-----"

                public_key = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
                signature_bytes = base64.b64decode(sign)

                public_key.verify(
                    signature_bytes,
                    sign_string.encode("utf-8"),
                    padding.PKCS1v15(),
                    hashes.SHA256(),
                )
                logger.info(f"Alipay signature verified for trade_no: {params.get('out_trade_no')}")
            except HTTPException:
                raise
            except Exception as verify_error:
                logger.error(f"Alipay signature verification failed: {verify_error}")
                return PlainTextResponse("failure")
        else:
            logger.error("ALIPAY_PUBLIC_KEY not configured, rejecting Alipay callback")
            return PlainTextResponse("failure", status_code=500)

        # --- Check trade status ---
        trade_status = params.get("trade_status", "")
        if trade_status not in ("TRADE_SUCCESS", "TRADE_FINISHED"):
            logger.info(f"Alipay trade status is {trade_status}, ignoring")
            return PlainTextResponse("success")

        # --- Extract transaction details ---
        trade_no = params.get("trade_no", "")
        out_trade_no = params.get("out_trade_no", "")
        total_amount = Decimal(params.get("total_amount", "0"))

        if not trade_no:
            logger.error("Missing trade_no in Alipay callback")
            return PlainTextResponse("failure")

        # --- Idempotency Check ---
        existing_tx = await db.execute(
            select(PaymentTransaction).where(PaymentTransaction.provider_transaction_id == trade_no)
        )
        if existing_tx.scalar_one_or_none():
            logger.info(f"Alipay transaction {trade_no} already processed, skipping")
            return PlainTextResponse("success")

        # --- Find Order by out_trade_no ---
        stmt = select(Order).where(Order.order_no == out_trade_no)
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()

        if order:
            # Update order status
            await db.execute(
                update(Order)
                .where(Order.id == order.id)
                .values(status="paid", payment_id=trade_no, payment_method="alipay", updated_at=func.now())
            )
            logger.info(f"Updated order {order.id} status to 'paid' (Alipay)")

        # --- Create payment transaction record ---
        payment_tx = PaymentTransaction(
            order_id=order.id if order else None,
            donation_id=None,
            amount=total_amount,
            method="alipay",
            provider_transaction_id=trade_no,
            status="success",
            raw_response=params,
        )
        db.add(payment_tx)
        await db.commit()
        logger.info(f"Alipay payment transaction created: TX={trade_no}")

        return PlainTextResponse("success")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Alipay callback processing error: {str(e)}")
        await db.rollback()
        return PlainTextResponse("failure")


@router.post("/webhook", response_model=ApiResponse)
async def payment_webhook(request: Request, body: dict):
    """Handle generic payment webhook from various providers.

    Security: Verifies HMAC signature from the X-Webhook-Signature header.
    """
    signature = request.headers.get("X-Webhook-Signature")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    # Verify HMAC-SHA256 signature using APP_SECRET_KEY
    body_bytes = await request.body()
    secret_key = settings.APP_SECRET_KEY
    if isinstance(secret_key, str):
        secret_key = secret_key.encode("utf-8")
    expected_signature = hmac_mod.new(
        secret_key, body_bytes, hashlib.sha256
    ).hexdigest()

    if not hmac_mod.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Process webhook payload
    # In production: update payment status, trigger order/donation fulfillment
    return ApiResponse(data={"message": "Webhook processed successfully"})


@router.get("/test-wechat-params", response_model=ApiResponse)
async def test_wechat_params(current_user: dict = Depends(get_current_user)):
    """Test endpoint to verify WeChat payment parameter generation (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    """Test endpoint to verify WeChat payment parameter generation."""
    try:
        payment_params = get_payment_service().create_unified_order(
            order_no="TEST123",
            amount=Decimal("100.00"),
            description="Test Donation",
            trade_type="JSAPI",
            donation_id=999
        )
        return ApiResponse(data=payment_params)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Payment parameter generation failed")


@router.get("/{payment_id}", response_model=ApiResponse)
async def get_payment(payment_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get a payment transaction by ID (with ownership check to prevent IDOR)."""
    try:
        stmt = select(PaymentTransaction).where(PaymentTransaction.id == payment_id)
        result = await db.execute(stmt)
        tx = result.scalar_one_or_none()

        # IDOR prevention: Only allow users to view their own payments
        # Admins can view all payments, users can only view their own
        if tx and current_user.get("role") != "admin":
            # Check if this payment belongs to the current user
            # We check if the payment is associated with an order or donation owned by the user
            is_owner = False

            if tx.order_id:
                stmt_order = select(Order).where(Order.id == tx.order_id, Order.user_id == current_user["id"])
                result_order = await db.execute(stmt_order)
                order = result_order.scalar_one_or_none()
                if order:
                    is_owner = True

            if not is_owner and tx.donation_id:
                stmt_donation = select(Donation).where(Donation.id == tx.donation_id, Donation.donor_user_id == current_user["id"])
                result_donation = await db.execute(stmt_donation)
                donation = result_donation.scalar_one_or_none()
                if donation:
                    is_owner = True

            if not is_owner:
                raise HTTPException(status_code=403, detail="Access denied")

        if tx:
            return ApiResponse(data=PaymentOut.model_validate(tx).model_dump())

        # If not found in DB, fall through to mock data check
        raise ValueError("Payment not found in DB, checking mock data")
        raise
    except HTTPException:
        raise
    except Exception:
        for p in _mock_payments:
            if p["id"] == payment_id:
                # IDOR prevention for mock data
                # Check ownership based on mock data structure
                is_owner = False
                if p.get("order_id"):
                    # Check mock orders
                    for o in _mock_orders:
                        if o["id"] == p["order_id"] and o["user_id"] == current_user["id"]:
                            is_owner = True
                            break
                if not is_owner and p.get("donation_id"):
                    # Check mock donations
                    for d in _mock_donations:
                        if d["id"] == p["donation_id"]:
                            # If donation is anonymous (donor_user_id is None), we allow access
                            # similar to get_donation logic
                            if d.get("donor_user_id") is None:
                                is_owner = True
                            elif d.get("donor_user_id") == current_user["id"]:
                                is_owner = True
                            break

                if current_user.get("role") == "admin":
                    is_owner = True

                if not is_owner:
                    raise HTTPException(status_code=403, detail="Access denied")
                return ApiResponse(data=p)
        raise HTTPException(status_code=404, detail="Payment not found")