"""端到端集成测试：用户售后申请 → admin 接收并处理（退货/换货/维修）。"""
import pytest
from decimal import Decimal

from app.models.payment import PaymentTransaction
from app.models.product import Product
from app.models.order import Order, OrderItem


async def _setup_completed_order(db):
    """构造一个 completed 订单给用户1。"""
    product = Product(
        name="售后测试商品",
        price=Decimal("100.00"),
        stock=10,
        status="active",
    )
    db.add(product)
    await db.flush()

    order = Order(
        user_id=1,
        order_no=f"TH-ATSTEST-{product.id}",
        total_amount=Decimal("100.00"),
        status="completed",
        shipping_address="售后测试地址",
        payment_method="stripe",
    )
    db.add(order)
    await db.flush()

    item = OrderItem(order_id=order.id, product_id=product.id, quantity=1, price=Decimal("100.00"))
    db.add(item)

    payment = PaymentTransaction(
        order_id=order.id,
        amount=Decimal("100.00"),
        method="stripe",
        status="success",
        provider_transaction_id=f"pi_test_{order.id}",
    )
    db.add(payment)
    await db.commit()
    await db.refresh(order)
    await db.refresh(item)
    return order, product, item


@pytest.mark.asyncio
async def test_user_create_return_ticket_via_order_endpoint(client, auth_headers, admin_auth_headers):
    """用户通过订单接口发起退货 → admin 在工单列表里看到。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        order, _, item = await _setup_completed_order(db)
        order_id = order.id
        order_item_id = item.id

    payload = {
        "type": "return",
        "items": [{"order_item_id": order_item_id, "quantity": 1}],
        "reason": "尺码不合适",
    }
    r = await client.post(f"/api/v1/orders/{order_id}/return", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    ticket_id = r.json()["data"]["id"]
    assert r.json()["data"]["status"] == "open"

    admin_list = await client.get(
        "/api/v1/after-sales?page=1&page_size=20", headers=admin_auth_headers
    )
    assert admin_list.status_code == 200
    listed = admin_list.json()["data"]
    assert any(t["id"] == ticket_id for t in listed)

    mine = await client.get("/api/v1/after-sales/mine", headers=auth_headers)
    assert mine.status_code == 200
    mine_data = mine.json()["data"]
    assert any(t["id"] == ticket_id for t in mine_data)


@pytest.mark.asyncio
async def test_support_blocks_return_category(client, auth_headers):
    """Support 接口不再接受 return/exchange 类别。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        order, _, _ = await _setup_completed_order(db)
        order_id = order.id

    payload = {
        "order_id": order_id,
        "category": "return",
        "subject": "尺码不合适",
        "description": "Reason: 尺码偏大",
    }
    r = await client.post("/api/v1/after-sales", json=payload, headers=auth_headers)
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_admin_return_refund_flow(client, auth_headers, admin_auth_headers):
    """admin 批准退货 → 确认收货 → 退款成功。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        order, product, item = await _setup_completed_order(db)
        order_id = order.id
        order_item_id = item.id
        initial_stock = product.stock

    create = await client.post(
        f"/api/v1/orders/{order_id}/return",
        json={
            "type": "return",
            "items": [{"order_item_id": order_item_id, "quantity": 1}],
            "reason": "质量问题",
        },
        headers=auth_headers,
    )
    assert create.status_code == 201
    ticket_id = create.json()["data"]["id"]

    approve = await client.post(
        f"/api/v1/after-sales/{ticket_id}/review",
        json={"action": "approve"},
        headers=admin_auth_headers,
    )
    assert approve.status_code == 200
    assert approve.json()["data"]["status"] == "in_progress"
    assert approve.json()["data"]["admin_note"]

    received = await client.post(
        f"/api/v1/after-sales/{ticket_id}/confirm-received",
        headers=admin_auth_headers,
    )
    assert received.status_code == 200
    assert received.json()["data"]["goods_received_at"]

    async with AsyncSessionLocal() as db:
        refreshed_product = await db.get(Product, product.id)
        assert refreshed_product.stock == initial_stock + 1

    refund = await client.post(
        f"/api/v1/after-sales/{ticket_id}/refund",
        headers=admin_auth_headers,
    )
    assert refund.status_code == 200
    body = refund.json()["data"]
    assert body["refund_status"] == "succeeded"
    assert body["status"] == "resolved"
    assert Decimal(str(body["refund_amount"])) == Decimal("100.00")


@pytest.mark.asyncio
async def test_admin_can_reject_exchange_ticket(client, auth_headers, admin_auth_headers):
    """admin 拒绝换货工单。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        order, _, item = await _setup_completed_order(db)
        order_id = order.id
        order_item_id = item.id

    create = await client.post(
        f"/api/v1/orders/{order_id}/return",
        json={
            "type": "exchange",
            "items": [{"order_item_id": order_item_id, "quantity": 1}],
            "reason": "换同款不同尺码",
        },
        headers=auth_headers,
    )
    assert create.status_code == 201
    ticket_id = create.json()["data"]["id"]

    review = await client.post(
        f"/api/v1/after-sales/{ticket_id}/review",
        json={"action": "reject", "admin_note": "库存不足"},
        headers=admin_auth_headers,
    )
    assert review.status_code == 200
    assert review.json()["data"]["status"] == "closed"
    assert review.json()["data"]["admin_note"] == "库存不足"


@pytest.mark.asyncio
async def test_admin_can_resolve_quality_ticket(client, auth_headers, admin_auth_headers):
    """用户提交质量维修工单 → admin 标记 resolved。"""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        order, _, _ = await _setup_completed_order(db)
        order_id = order.id

    create = await client.post(
        "/api/v1/after-sales",
        json={
            "order_id": order_id,
            "category": "quality",
            "subject": "商品破损",
            "description": "Reason: 收到时已破损",
        },
        headers=auth_headers,
    )
    assert create.status_code == 201
    ticket_id = create.json()["data"]["id"]

    status_upd = await client.patch(
        f"/api/v1/after-sales/{ticket_id}/status",
        json={"status": "resolved"},
        headers=admin_auth_headers,
    )
    assert status_upd.status_code == 200
    assert status_upd.json()["data"]["status"] == "resolved"


@pytest.mark.asyncio
async def test_non_admin_cannot_list_all_tickets(client, auth_headers):
    """普通用户无法调 admin 列表接口。"""
    r = await client.get("/api/v1/after-sales?page=1&page_size=20", headers=auth_headers)
    assert r.status_code == 403
