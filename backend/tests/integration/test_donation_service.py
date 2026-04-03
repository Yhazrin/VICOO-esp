import pytest
from decimal import Decimal
from app.services.donation.service import DonationService
from app.services.payment.service import PaymentService
from app.models.donation import Donation

@pytest.mark.asyncio
async def test_donation_payment_loop(app):
    """
    测试“创建捐赠 -> 模拟支付成功 -> 自动生成证书”的完整业务闭环。
    """
    from app.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        donation_service = DonationService(db)
        payment_service = PaymentService(db)
        
        # 1. 创建捐赠
        donation_data = {
            "donor_name": "Test Donor",
            "amount": Decimal("100.00"),
            "currency": "CNY",
            "payment_method": "wechat",
            "campaign_id": 1,
            "is_anonymous": False,
            "donor_user_id": 1
        }
        donation = await donation_service.create_donation(donation_data)
        await db.commit()
        
        assert donation.id is not None
        assert donation.status == "pending"
        
        # 2. 模拟支付成功回调 (通过 PaymentService)
        # 假设微信回调了 DON + donation.id
        order_no = f"DON{donation.id}"
        tx = await payment_service.process_successful_payment(
            provider_tx_id="mock_tx_12345",
            amount=Decimal("100.00"),
            method="wechat",
            order_no=order_no,
            donation_id=donation.id
        )
        await db.commit()
        
        # 3. 验证捐赠状态和证书
        # 刷新对象状态
        updated_donation = await donation_service.get_donation_by_id(donation.id)
        
        assert updated_donation.status == "completed"
        assert updated_donation.payment_id == "mock_tx_12345"
        assert updated_donation.certificate_no is not None
        assert updated_donation.certificate_no.startswith("TH-DON-")
        assert updated_donation.certificate_url is not None
        
        print(f"Verified loop: Donation {donation.id} -> Certificate {updated_donation.certificate_no}")
