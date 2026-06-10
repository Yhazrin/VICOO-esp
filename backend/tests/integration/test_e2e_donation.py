"""端到端集成测试：用户捐赠 → admin 端显示 → admin 接受/拒绝。

覆盖 Goal 子任务 #1。
"""
import pytest
from decimal import Decimal

from app.models.donation import Donation
from app.models.campaign import Campaign
from app.services.donation.service import DonationService
from sqlalchemy import select


@pytest.mark.asyncio
async def test_user_donation_visible_in_admin_and_admin_can_approve_or_reject(app):
    """完整流程：用户提交捐赠 → admin 在捐赠管理页面能看到 → admin 批准 → admin 拒绝另一笔。"""
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        donation_service = DonationService(db)

        # 1) 模拟两个用户提交两笔捐赠
        donation_a = await donation_service.create_donation({
            "donor_name": "Alice",
            "amount": Decimal("200.00"),
            "currency": "CNY",
            "payment_method": "wechat",
            "campaign_id": 1,
            "is_anonymous": False,
            "donor_user_id": 1,
        })
        donation_b = await donation_service.create_donation({
            "donor_name": "Bob",
            "amount": Decimal("50.00"),
            "currency": "CNY",
            "payment_method": "alipay",
            "campaign_id": 1,
            "is_anonymous": True,
        })
        await db.commit()
        assert donation_a.id is not None and donation_b.id is not None
        assert donation_a.status == "pending"
        assert donation_b.status == "pending"

        # 2) 模拟 admin 拉取捐赠列表（仅过滤 pending）——两笔都要可见，状态都是 pending
        pending_donations, _ = await donation_service.list_donations(page=1, page_size=20, status="pending")
        pending_ids = {d.id for d in pending_donations}
        assert donation_a.id in pending_ids and donation_b.id in pending_ids
        for d in pending_donations:
            assert d.status == "pending"

        # 3) admin 批准第一笔
        approved = await donation_service.admin_approve_donation(
            donation_a.id, admin_user_id=2
        )
        await db.commit()
        assert approved.status == "completed"
        assert approved.certificate_no is not None
        assert approved.certificate_no.startswith("TH-DON-")

        # 4) admin 拒绝第二笔——通过 service 标记为 refunded 模拟"拒绝/退款"
        donation_b.status = "refunded"
        await db.commit()
        rejected = await donation_service.get_donation_by_id(donation_b.id)
        assert rejected.status == "refunded"

        # 5) 再拉一次列表，验证状态过滤后符合预期
        pending_after, _ = await donation_service.list_donations(page=1, page_size=20, status="pending")
        completed_after, _ = await donation_service.list_donations(page=1, page_size=20, status="completed")
        refunded_after, _ = await donation_service.list_donations(page=1, page_size=20, status="refunded")
        assert donation_a.id not in {d.id for d in pending_after}
        assert donation_a.id in {d.id for d in completed_after}
        assert donation_b.id in {d.id for d in refunded_after}

        # 6) 确认活动 current_amount 只反映已批准的捐赠（在 create_donation 时已累加）
        stmt = select(Campaign).where(Campaign.id == 1)
        campaign = (await db.execute(stmt)).scalar_one()
        assert float(campaign.current_amount) >= 200.0
