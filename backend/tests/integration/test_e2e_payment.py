"""端到端集成测试：用户付款 → admin 端显示订单。

覆盖 Goal 子任务 #2。
"""
import pytest
from decimal import Decimal

from app.models.product import Product
from app.models.order import Order
from app.services.order.service import OrderService
from app.services.payment.service import PaymentService


async def _create_product(db, name="Pay Test Tee", price=Decimal("99.00"), stock=20):
    product = Product(name=name, price=price, stock=stock, status="active")
    db.add(product)
    await db.flush()
    return product


@pytest.mark.asyncio
async def test_payment_flow_visible_to_admin(app):
    """完整流程：用户下单 → 支付成功回调 → admin 看到 paid 订单。"""
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        order_service = OrderService(db)
        payment_service = PaymentService(db)

        # 1) 用户下单（pending）
        product = await _create_product(db)
        order = await order_service.place_order(
            user_id=1,
            order_data={"items": [{"product_id": product.id, "quantity": 2}]},
        )
        await db.commit()
        assert order.status == "pending"
        assert order.total_amount == Decimal("198.00")

        # 2) 模拟支付回调成功
        tx = await payment_service.process_successful_payment(
            provider_tx_id="wx_tx_e2e_001",
            amount=Decimal("198.00"),
            method="wechat",
            order_no=order.order_no,
        )
        await db.commit()
        assert tx is not None
        assert tx.status in ("success", "succeeded", "completed", "paid")

        # 3) admin 列出所有订单，能看到这笔 paid 订单
        all_orders, total = await order_service.list_orders(
            user_id=0, is_admin=True, page=1, page_size=50
        )
        ids = {o.id for o in all_orders}
        assert order.id in ids
        refreshed = next(o for o in all_orders if o.id == order.id)
        assert refreshed.status == "paid"
        assert refreshed.payment_id == "wx_tx_e2e_001"

        # 4) 状态过滤：仅看 paid
        paid_orders, paid_total = await order_service.list_orders(
            user_id=0, is_admin=True, page=1, page_size=50, status="paid"
        )
        assert order.id in {o.id for o in paid_orders}
        assert paid_total >= 1

        # 5) 库存已正确预扣
        refreshed_product = await db.get(Product, product.id)
        assert refreshed_product.stock == 20 - 2


@pytest.mark.asyncio
async def test_payment_amount_mismatch_is_rejected(app):
    """金额不匹配的支付回调必须失败（防篡改）。"""
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        order_service = OrderService(db)
        payment_service = PaymentService(db)

        product = await _create_product(db, price=Decimal("50.00"), stock=5)
        order = await order_service.place_order(
            user_id=1,
            order_data={"items": [{"product_id": product.id, "quantity": 1}]},
        )
        await db.commit()

        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await payment_service.process_successful_payment(
                provider_tx_id="wx_tx_mismatch",
                amount=Decimal("1.00"),  # 错误的金额
                method="wechat",
                order_no=order.order_no,
            )
        assert exc_info.value.status_code == 400
