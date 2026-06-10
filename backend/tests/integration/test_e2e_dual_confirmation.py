"""端到端集成测试：双方确认收货——只有用户确认收货 AND admin 确认送达，
订单才标记为 completed。

覆盖 Goal 子任务 #5。
"""
import pytest
from decimal import Decimal

from app.models.product import Product
from app.models.order import Order, OrderItem
from app.services.order.service import OrderService


async def _setup_shipped_order(db):
    """构造一个已发货订单（admin 调 ship_order）。"""
    product = Product(
        name="双确认测试商品",
        price=Decimal("80.00"),
        stock=10,
        status="active",
    )
    db.add(product)
    await db.flush()

    order = Order(
        user_id=1,
        order_no=f"TH-DUALCONF-{product.id}",
        total_amount=Decimal("80.00"),
        status="paid",
        shipping_address="测试地址",
    )
    db.add(order)
    await db.flush()

    item = OrderItem(
        order_id=order.id, product_id=product.id, quantity=1, price=Decimal("80.00")
    )
    db.add(item)

    order_service = OrderService(db)
    shipped = await order_service.ship_order(order.id, carrier="顺丰", tracking_number="SF1234567890")
    await db.commit()
    return shipped, product


@pytest.mark.asyncio
async def test_dual_confirmation_only_both_clicks_complete_order(app):
    """核心：用户先确认 → 状态仍 shipped；admin 确认 → 状态变 completed。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        shipped, _ = await _setup_shipped_order(db)
        order_id = shipped.id
        assert shipped.status == "shipped"
        assert shipped.user_confirmed_at is None
        assert shipped.admin_delivered_at is None

        order_service = OrderService(db)
        # 1) 用户先确认收货——状态保持 shipped
        after_user = await order_service.confirm_receipt_by_user(order_id, user_id=1)
        await db.commit()
        assert after_user.status == "shipped"
        assert after_user.user_confirmed_at is not None
        assert after_user.admin_delivered_at is None

        # 2) admin 确认送达——状态变为 completed
        after_admin = await order_service.mark_delivered_by_admin(order_id, admin_user_id=2)
        await db.commit()
        assert after_admin.status == "completed"
        assert after_admin.user_confirmed_at is not None
        assert after_admin.admin_delivered_at is not None


@pytest.mark.asyncio
async def test_admin_first_user_second_also_completes(app):
    """反向：admin 先点，用户再点，依然完成。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        shipped, _ = await _setup_shipped_order(db)
        order_id = shipped.id

        order_service = OrderService(db)
        # 1) admin 先确认
        after_admin = await order_service.mark_delivered_by_admin(order_id, admin_user_id=2)
        await db.commit()
        assert after_admin.status == "shipped"
        assert after_admin.admin_delivered_at is not None

        # 2) 用户后确认
        after_user = await order_service.confirm_receipt_by_user(order_id, user_id=1)
        await db.commit()
        assert after_user.status == "completed"
        assert after_user.user_confirmed_at is not None


@pytest.mark.asyncio
async def test_only_user_confirmation_keeps_shipped(app):
    """只点用户按钮，永远不会 completed。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        shipped, _ = await _setup_shipped_order(db)
        order_id = shipped.id

        order_service = OrderService(db)
        await order_service.confirm_receipt_by_user(order_id, user_id=1)
        await db.commit()

        # 重新查询
        reloaded = await order_service.get_order_detail(order_id)
        assert reloaded.status == "shipped"


@pytest.mark.asyncio
async def test_only_admin_confirmation_keeps_shipped(app):
    """只点 admin 按钮，永远不会 completed。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        shipped, _ = await _setup_shipped_order(db)
        order_id = shipped.id

        order_service = OrderService(db)
        await order_service.mark_delivered_by_admin(order_id, admin_user_id=2)
        await db.commit()

        reloaded = await order_service.get_order_detail(order_id)
        assert reloaded.status == "shipped"


@pytest.mark.asyncio
async def test_user_cannot_confirm_receipt_for_other_users_order(app):
    """用户不能确认别人的订单。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        shipped, _ = await _setup_shipped_order(db)
        order_id = shipped.id

        order_service = OrderService(db)
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            await order_service.confirm_receipt_by_user(order_id, user_id=999)
        assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_dual_confirmation_via_http(client, auth_headers, admin_auth_headers):
    """HTTP 端到端：用户调 POST /orders/{id}/confirm-receipt, admin 调 /confirm-delivery。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        shipped, _ = await _setup_shipped_order(db)
        order_id = shipped.id

    r1 = await client.post(f"/api/v1/orders/{order_id}/confirm-receipt", headers=auth_headers)
    assert r1.status_code == 200
    assert r1.json()["data"]["status"] == "shipped"

    r2 = await client.post(f"/api/v1/orders/{order_id}/confirm-delivery", headers=admin_auth_headers)
    assert r2.status_code == 200
    assert r2.json()["data"]["status"] == "completed"

    detail = await client.get(f"/api/v1/orders/{order_id}", headers=auth_headers)
    assert detail.status_code == 200
    assert detail.json()["data"]["status"] == "completed"
