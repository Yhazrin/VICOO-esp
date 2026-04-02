import pytest
from decimal import Decimal
from sqlalchemy import select
from app.services.order.service import OrderService
from app.models.product import Product
from app.models.order import Order

async def _create_test_product(db):
    """辅助函数：创建一个测试商品"""
    product = Product(
        name="Test Product for Order",
        price=Decimal("100.00"),
        stock=10,
        status="active"
    )
    db.add(product)
    await db.flush()
    return product

@pytest.mark.asyncio
async def test_order_inventory_reservation(app):
    """
    测试下单时的库存预扣逻辑。
    """
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        order_service = OrderService(db)
        
        # 1. 创建测试商品
        product = await _create_test_product(db)
        initial_stock = product.stock
        order_qty = 2
        
        # 2. 创建订单
        order_data = {
            "items": [{"product_id": product.id, "quantity": order_qty}],
            "shipping_address": "Test Street 123"
        }
        order = await order_service.place_order(user_id=1, order_data=order_data)
        await db.commit()
        
        # 3. 验证库存是否减少
        # 重新查询以确保获取最新值
        result = await db.execute(select(Product).where(Product.id == product.id))
        updated_product = result.scalar_one()
        
        assert updated_product.stock == initial_stock - order_qty
        assert order.status == "pending"

@pytest.mark.asyncio
async def test_order_cancellation_stock_return(app):
    """
    测试取消订单时库存是否正确退还。
    """
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        order_service = OrderService(db)
        
        # 1. 创建测试商品并下单
        product = await _create_test_product(db)
        initial_stock = product.stock
        
        order_data = {
            "items": [{"product_id": product.id, "quantity": 1}],
            "shipping_address": "Cancel Test"
        }
        order = await order_service.place_order(user_id=1, order_data=order_data)
        await db.flush()
        
        # 确认下单后库存减少
        assert product.stock == initial_stock - 1
        
        # 2. 取消订单
        await order_service.cancel_order(order.id)
        await db.commit()
        
        # 3. 验证库存是否增加回来
        result = await db.execute(select(Product).where(Product.id == product.id))
        final_product = result.scalar_one()
        assert final_product.stock == initial_stock
        
        # 验证订单状态
        updated_order = await order_service.get_order_detail(order.id)
        assert updated_order.status == "cancelled"
