import logging
import uuid
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.services.base import BaseService
from app.core.audit import audit_action

logger = logging.getLogger("tonghua.order_service")

class OrderService(BaseService):
    """
    Service handling e-commerce orders and inventory management.
    """

    async def list_orders(self, user_id: int, page: int = 1, page_size: int = 20) -> Tuple[List[Order], int]:
        """
        List orders for a specific user with pagination.
        """
        stmt = select(Order).where(Order.user_id == user_id)
        count_stmt = select(func.count(Order.id)).where(Order.user_id == user_id)
        
        total = (await self.db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        return result.scalars().all(), total

    async def get_order_detail(self, order_id: int) -> Order:
        """
        Get order detail with items.
        """
        stmt = select(Order).where(Order.id == order_id)
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

    @audit_action(action="place_order", resource_type="order")
    async def place_order(self, user_id: int, order_data: Dict[str, Any]) -> Order:
        """
        Create a new order with inventory reservation.
        """
        items_data = order_data.get("items", [])
        if not items_data:
            raise HTTPException(status_code=400, detail="Order must contain at least one item")

        total_amount = Decimal("0.00")
        order_items = []

        # 1. Process items and check inventory
        for item_in in items_data:
            product_id = item_in["product_id"]
            quantity = item_in["quantity"]

            if quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid quantity for product {product_id}")

            # Atomic inventory check and deduction
            # Note: In a high-concurrency production system, we'd use a more complex SELECT FOR UPDATE
            # or a specialized inventory service. Here we do it within the transaction.
            product_stmt = select(Product).where(Product.id == product_id)
            product = (await self.db.execute(product_stmt)).scalar_one_or_none()

            if not product:
                raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
            
            if product.stock < quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product.name}")

            # Deduct stock
            product.stock -= quantity
            if product.stock == 0:
                product.status = "sold_out"

            item_total = product.price * Decimal(str(quantity))
            total_amount += item_total

            order_items.append(OrderItem(
                product_id=product_id,
                quantity=quantity,
                price=product.price
            ))

        # 2. Create Order
        order_no = f"TH{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"
        order = Order(
            user_id=user_id,
            order_no=order_no,
            total_amount=total_amount,
            status="pending",
            shipping_address=order_data.get("shipping_address")
        )
        
        self.db.add(order)
        await self.db.flush() # Get order ID

        # 3. Associate items
        for item in order_items:
            item.order_id = order.id
            self.db.add(item)

        await self.db.flush()
        return order

    @audit_action(action="cancel_order", resource_type="order")
    async def cancel_order(self, order_id: int) -> Order:
        """
        Cancel an order and return stock.
        """
        order = await self.get_order_detail(order_id)
        if order.status != "pending":
            raise HTTPException(status_code=400, detail=f"Cannot cancel order in {order.status} status")

        order.status = "cancelled"
        
        # Return stock
        # (This would be more robust in a separate method)
        stmt = select(OrderItem).where(OrderItem.order_id == order_id)
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        
        for item in items:
            await self.db.execute(
                update(Product)
                .where(Product.id == item.product_id)
                .values(stock=Product.stock + item.quantity, status="active")
            )
            
        await self.db.flush()
        return order
