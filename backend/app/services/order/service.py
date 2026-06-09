import logging
import uuid
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select, func, update

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.services.base import BaseService
from app.core.audit import audit_action

logger = logging.getLogger("vicoo.order_service")

class OrderService(BaseService):
    """
    Service handling e-commerce orders and inventory management.
    """

    async def list_orders(
        self,
        user_id: int,
        is_admin: bool = False,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        keyword: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> Tuple[List[Order], int]:
        """
        List orders with pagination and optional filters.
        Admin callers can see all orders; regular users are scoped to themselves.
        """
        stmt = select(Order)
        count_stmt = select(func.count(Order.id))
        if not is_admin:
            stmt = stmt.where(Order.user_id == user_id)
            count_stmt = count_stmt.where(Order.user_id == user_id)

        if status:
            stmt = stmt.where(Order.status == status)
            count_stmt = count_stmt.where(Order.status == status)
        if keyword:
            like = f"%{keyword}%"
            stmt = stmt.where(Order.order_no.ilike(like))
            count_stmt = count_stmt.where(Order.order_no.ilike(like))
        if date_from:
            from datetime import datetime as dt
            try:
                d = dt.fromisoformat(date_from)
                stmt = stmt.where(Order.created_at >= d)
                count_stmt = count_stmt.where(Order.created_at >= d)
            except ValueError:
                pass
        if date_to:
            from datetime import datetime as dt
            try:
                d = dt.fromisoformat(date_to)
                stmt = stmt.where(Order.created_at <= d)
                count_stmt = count_stmt.where(Order.created_at <= d)
            except ValueError:
                pass

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

        P0 Security: Uses SELECT FOR UPDATE to lock product rows and prevent overselling
        in concurrent requests. This prevents race conditions where multiple requests
        could read the same stock value and all pass validation.
        """
        items_data = order_data.get("items", [])
        if not items_data:
            raise HTTPException(status_code=400, detail="Order must contain at least one item")

        total_amount = Decimal("0.00")
        order_items = []

        # 1. Process items and check inventory with row locking
        for item_in in items_data:
            product_id = item_in["product_id"]
            quantity = item_in["quantity"]

            if quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid quantity for product {product_id}")

            # P0: Use SELECT FOR UPDATE to lock the row and prevent concurrent overselling
            # This ensures that only one transaction can modify a product's stock at a time
            product_stmt = select(Product).where(Product.id == product_id).with_for_update()
            product = (await self.db.execute(product_stmt)).scalar_one_or_none()

            if not product:
                raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

            if product.stock < quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product.name}")

            # Deduct stock (within the lock, safe from race conditions)
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
            shipping_address=order_data.get("shipping_address"),
            payment_method=order_data.get("payment_method"),
            # P1: Store structured address fields
            idempotency_key=order_data.get("idempotency_key"),
            recipient_name=order_data.get("recipient_name"),
            recipient_phone=order_data.get("recipient_phone"),
            province=order_data.get("province"),
            city=order_data.get("city"),
            district=order_data.get("district"),
            detail_address=order_data.get("detail_address"),
            postal_code=order_data.get("postal_code"),
            country=order_data.get("country"),
            country_code=order_data.get("country_code"),
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

    async def create_replacement_order(
        self,
        *,
        user_id: int,
        original_order: Order,
        line_items: list[dict],
        exchange_product_id: int | None = None,
    ) -> Order:
        """Create a paid replacement order for an approved exchange (no charge, ready to ship)."""
        if not line_items:
            raise HTTPException(status_code=400, detail="No items for replacement order")

        order_items: list[OrderItem] = []
        for item in line_items:
            product_id = exchange_product_id or int(item["product_id"])
            quantity = int(item["quantity"])
            if quantity <= 0:
                raise HTTPException(status_code=400, detail="Invalid replacement quantity")

            product_stmt = select(Product).where(Product.id == product_id).with_for_update()
            product = (await self.db.execute(product_stmt)).scalar_one_or_none()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
            if product.stock < quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product.name}")

            product.stock -= quantity
            if product.stock == 0:
                product.status = "sold_out"

            order_items.append(
                OrderItem(
                    product_id=product_id,
                    quantity=quantity,
                    price=Decimal("0.00"),
                )
            )

        order_no = f"EX{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"
        order = Order(
            user_id=user_id,
            order_no=order_no,
            total_amount=Decimal("0.00"),
            status="paid",
            shipping_address=original_order.shipping_address,
            payment_method="exchange",
            recipient_name=getattr(original_order, "recipient_name", None),
            recipient_phone=getattr(original_order, "recipient_phone", None),
            province=getattr(original_order, "province", None),
            city=getattr(original_order, "city", None),
            district=getattr(original_order, "district", None),
            detail_address=getattr(original_order, "detail_address", None),
            postal_code=getattr(original_order, "postal_code", None),
            country=getattr(original_order, "country", None),
            country_code=getattr(original_order, "country_code", None),
        )
        self.db.add(order)
        await self.db.flush()

        for order_item in order_items:
            order_item.order_id = order.id
            self.db.add(order_item)

        await self.db.flush()
        await self.db.refresh(order)
        return order

    def _maybe_complete(self, order: Order) -> None:
        """If both user_confirmed_at and admin_delivered_at are set, mark order completed."""
        if order.user_confirmed_at and order.admin_delivered_at and order.status == "shipped":
            order.status = "completed"

    @audit_action(action="confirm_receipt_user", resource_type="order")
    async def confirm_receipt_by_user(self, order_id: int, user_id: int) -> Order:
        """User clicks 'Confirm Receipt'. Sets user_confirmed_at; if admin has already
        marked delivered, status transitions shipped -> completed."""
        order = await self.get_order_detail(order_id)
        if order.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not your order")
        if order.status not in ("shipped", "completed"):
            raise HTTPException(
                status_code=400,
                detail=f"Order must be shipped to confirm receipt (current: {order.status})",
            )
        if order.status == "completed":
            return order
        order.user_confirmed_at = datetime.utcnow()
        self._maybe_complete(order)
        await self.db.flush()
        await self.db.refresh(order)
        return order

    @audit_action(action="confirm_delivery_admin", resource_type="order")
    async def mark_delivered_by_admin(self, order_id: int, admin_user_id: int) -> Order:
        """Admin clicks 'Confirm Delivery'. Sets admin_delivered_at; if user has
        already confirmed receipt, status transitions shipped -> completed."""
        order = await self.get_order_detail(order_id)
        if order.status not in ("shipped", "completed"):
            raise HTTPException(
                status_code=400,
                detail=f"Order must be shipped before admin can confirm delivery (current: {order.status})",
            )
        if order.status == "completed":
            return order
        order.admin_delivered_at = datetime.utcnow()
        self._maybe_complete(order)
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def ship_order(self, order_id: int, carrier: str, tracking_number: str) -> Order:
        """Mark order as shipped (admin op)."""
        order = await self.get_order_detail(order_id)
        if order.status != "paid":
            raise HTTPException(
                status_code=400,
                detail=f"Only paid orders can be shipped (current: {order.status})",
            )
        order.status = "shipped"
        order.carrier = carrier
        order.tracking_number = tracking_number
        await self.db.flush()
        await self.db.refresh(order)
        return order
