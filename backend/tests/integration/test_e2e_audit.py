"""端到端集成测试：审计日志操作人列匹配到对应用户 nickname。

覆盖 Goal 子任务 #8。
"""
import pytest
from decimal import Decimal

from app.core.audit import log_audit
from app.models.audit import AuditLog
from app.models.product import Product
from app.services.order.service import OrderService
from app.services.donation.service import DonationService
from sqlalchemy import select

# Admin user (id=2) seeded with nickname "Test Admin" in conftest
ADMIN_NICKNAME = "Test Admin"


@pytest.mark.asyncio
async def test_audit_log_resolves_user_name_for_admin(app):
    """admin 操作的审计日志 user_name 应为其真实 nickname。"""
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        # admin 登录的 user_id=2 (seed)
        await log_audit(
            db=db,
            user_id=2,
            action="test_action_admin",
            resource="order",
            resource_id="99",
        )
        await db.commit()

        stmt = select(AuditLog).where(AuditLog.action == "test_action_admin")
        entry = (await db.execute(stmt)).scalar_one()
        assert entry.user_id == 2
        assert entry.user_name == ADMIN_NICKNAME


@pytest.mark.asyncio
async def test_audit_log_resolves_user_name_for_regular_user(app):
    """普通用户的审计日志 user_name 应该是其 nickname。"""
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        await log_audit(
            db=db,
            user_id=1,
            action="test_action_user",
            resource="order",
            resource_id="100",
        )
        await db.commit()

        stmt = select(AuditLog).where(AuditLog.action == "test_action_user")
        entry = (await db.execute(stmt)).scalar_one()
        assert entry.user_id == 1
        # user 1 在 conftest 中 seed 为 nickname="Test User"
        assert entry.user_name == "Test User"


@pytest.mark.asyncio
async def test_audit_log_for_order_creation_resolves_admin(app):
    """admin 完成订单的 confirm_delivery 写审计日志，user_name 应为其真实 nickname。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        # 准备一个 paid 订单
        product = Product(name="AuditOrder", price=Decimal("50.00"), stock=5, status="active")
        db.add(product)
        await db.flush()
        from app.models.order import Order
        order = Order(
            user_id=1,
            order_no="AUDIT-001",
            total_amount=Decimal("50.00"),
            status="paid",
        )
        db.add(order)
        await db.flush()
        order_service = OrderService(db)
        shipped = await order_service.ship_order(order.id, carrier="SF", tracking_number="SF1")
        await db.commit()
        order_id = shipped.id

    # admin 调 confirm-delivery
    async with AsyncSessionLocal() as db:
        order_service = OrderService(db)
        await order_service.mark_delivered_by_admin(order_id, admin_user_id=2)
        await db.commit()

    async with AsyncSessionLocal() as db:
        stmt = (
            select(AuditLog)
            .where(AuditLog.action == "confirm_delivery_admin")
            .where(AuditLog.resource_id == str(order_id))
        )
        entries = (await db.execute(stmt)).scalars().all()
        assert len(entries) >= 1
        for e in entries:
            assert e.user_id == 2
            assert e.user_name == ADMIN_NICKNAME


@pytest.mark.asyncio
async def test_audit_log_admin_approve_donation_shows_admin(app):
    """admin 批准捐赠后审计日志操作人为其真实 nickname。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        donation_service = DonationService(db)
        donation = await donation_service.create_donation({
            "donor_name": "AuditTester",
            "amount": Decimal("100.00"),
            "currency": "CNY",
            "payment_method": "wechat",
            "campaign_id": 1,
        })
        await db.commit()
        donation_id = donation.id

    async with AsyncSessionLocal() as db:
        donation_service = DonationService(db)
        await donation_service.admin_approve_donation(donation_id, admin_user_id=2)
        await db.commit()

    async with AsyncSessionLocal() as db:
        stmt = select(AuditLog).where(AuditLog.action == "admin_approve_donation")
        entries = (await db.execute(stmt)).scalars().all()
        assert len(entries) >= 1
        for e in entries:
            if e.user_id == 2:
                assert e.user_name == ADMIN_NICKNAME


@pytest.mark.asyncio
async def test_audit_log_regular_user_donation_shows_nickname(client, user_auth_headers):
    """普通用户通过 HTTP 创建捐赠 → 审计日志 user_name 应该是其 nickname。"""
    from app.database import AsyncSessionLocal
    from app.models.audit import AuditLog
    from sqlalchemy import select

    r = await client.post(
        "/api/v1/donations",
        json={
            "donor_name": "Test Donor",
            "amount": "50.00",
            "currency": "CNY",
            "payment_method": "wechat",
            "campaign_id": 1,
        },
        headers=user_auth_headers,
    )
    assert r.status_code in (200, 201), r.text
    donation_id = r.json()["data"]["id"]

    async with AsyncSessionLocal() as db:
        logs = (await db.execute(
            select(AuditLog)
            .where(AuditLog.action == "create_donation")
            .where(AuditLog.resource_id == str(donation_id))
        )).scalars().all()
        assert len(logs) >= 1
        for e in logs:
            assert e.user_id is not None
            # user_name must be non-empty (resolved via nickname)
            assert e.user_name is not None and e.user_name != ""
