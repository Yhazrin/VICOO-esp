from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json
import logging
from typing import Optional

from app.config import settings
from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas import (
    ApiResponse,
    PaginatedResponse,
    OrderOut,
    OrderCreate,
    OrderStatusUpdate,
    OrderLogisticsUpdate,
    ReturnRequestCreate,
)
from app.deps import get_current_user, require_role
from app.utils.mock_pay_token import issue_mock_pay_token
from app.services.order.service import OrderService
from app.data.impact_product_images import IMPACT_PRODUCT_IMAGE_BY_NAME

router = APIRouter(prefix="/orders", tags=["Orders"])


def _mock_impact_item_image(name: str) -> str:
    return IMPACT_PRODUCT_IMAGE_BY_NAME.get(name) or "https://picsum.photos/seed/vicoo-order-mock/900/1200"

logger = logging.getLogger(__name__)


def _parse_logistics_events(raw: str | None) -> list:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def order_to_out_dict(
    order: Order,
    items: list,
    product_map: dict | None = None,
    user_map: dict | None = None,
    *,
    mock_pay_token: str | None = None,
) -> dict:
    """Build OrderOut-compatible dict (logistics_events 为列表)."""
    base = {
        "id": order.id,
        "user_id": order.user_id,
        "user_name": (user_map or {}).get(order.user_id),
        "order_no": order.order_no,
        "total_amount": order.total_amount,
        "status": order.status,
        "shipping_address": order.shipping_address,
        "payment_method": order.payment_method,
        "payment_id": order.payment_id,
        "carrier": getattr(order, "carrier", None),
        "tracking_number": getattr(order, "tracking_number", None),
        "logistics_events": _parse_logistics_events(getattr(order, "logistics_events", None)),
        "items": [
            {
                "id": i.id,
                "product_id": i.product_id,
                "product_name": (product_map or {}).get(i.product_id, {}).get("name"),
                "product_image": (product_map or {}).get(i.product_id, {}).get("image_url"),
                "quantity": i.quantity,
                "price": str(i.price),
            }
            for i in items
        ],
        # P1: Structured shipping address fields
        "recipient_name": getattr(order, "recipient_name", None),
        "recipient_phone": getattr(order, "recipient_phone", None),
        "province": getattr(order, "province", None),
        "city": getattr(order, "city", None),
        "district": getattr(order, "district", None),
        "detail_address": getattr(order, "detail_address", None),
        "postal_code": getattr(order, "postal_code", None),
        "country": getattr(order, "country", None),
        "country_code": getattr(order, "country_code", None),
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "mock_pay_token": mock_pay_token,
    }
    return OrderOut.model_validate(base).model_dump()


async def _build_product_map(db: AsyncSession, items: list) -> dict:
    """Fetch product names/images for order items."""
    product_ids = list({i.product_id for i in items if i.product_id})
    if not product_ids:
        return {}
    stmt = select(Product.id, Product.name, Product.image_url).where(Product.id.in_(product_ids))
    result = await db.execute(stmt)
    return {row.id: {"name": row.name, "image_url": row.image_url} for row in result.all()}


async def _build_user_map(db: AsyncSession, orders: list[Order]) -> dict[int, str]:
    """Fetch display names for order owners."""
    user_ids = list({o.user_id for o in orders if o.user_id})
    if not user_ids:
        return {}
    stmt = select(User.id, User.nickname, User.email).where(User.id.in_(user_ids))
    result = await db.execute(stmt)
    return {row.id: (row.nickname or row.email or f"User #{row.id}") for row in result.all()}

_mock_orders = [
    {
        "id": 1,
        "user_id": 3,
        "order_no": "TH2025040110001",
        "total_amount": "257.00",
        "status": "completed",
        "shipping_address": "北京市朝阳区建国路88号",
        "payment_method": "wechat",
        "payment_id": "wx_order_001",
        "items": [{"id": 1, "product_id": 1, "product_name": "彩虹鱼棉质 T 恤", "product_image": _mock_impact_item_image("彩虹鱼棉质 T 恤"), "quantity": 1, "price": "168.00"}, {"id": 2, "product_id": 4, "product_name": "妈妈的手棉麻衬衫", "product_image": _mock_impact_item_image("妈妈的手棉麻衬衫"), "quantity": 2, "price": "39.00"}],
        "created_at": "2025-04-01T10:00:00",
        "updated_at": "2025-04-03T15:00:00",
    },
    {
        "id": 2,
        "user_id": 4,
        "order_no": "TH2025040514002",
        "total_amount": "258.00",
        "status": "shipped",
        "shipping_address": "上海市浦东新区陆家嘴环路1000号",
        "payment_method": "alipay",
        "payment_id": "ali_order_002",
        "items": [{"id": 3, "product_id": 3, "product_name": "春天的花园丝巾", "product_image": _mock_impact_item_image("春天的花园丝巾"), "quantity": 1, "price": "258.00"}],
        "created_at": "2025-04-05T14:00:00",
        "updated_at": "2025-04-06T09:00:00",
    },
    {
        "id": 3,
        "user_id": 5,
        "order_no": "TH2025041016003",
        "total_amount": "368.00",
        "status": "paid",
        "shipping_address": "广州市天河区体育西路103号",
        "payment_method": "wechat",
        "payment_id": "wx_order_003",
        "items": [{"id": 4, "product_id": 8, "product_name": "过年了针织开衫", "product_image": _mock_impact_item_image("过年了针织开衫"), "quantity": 1, "price": "368.00"}],
        "created_at": "2025-04-10T16:00:00",
        "updated_at": "2025-04-10T16:05:00",
    },
    {
        "id": 4,
        "user_id": 3,
        "order_no": "TH2025041511004",
        "total_amount": "157.00",
        "status": "pending",
        "shipping_address": "北京市朝阳区建国路88号",
        "payment_method": None,
        "payment_id": None,
        "items": [{"id": 5, "product_id": 2, "product_name": "星星之夜帆布托特包", "product_image": _mock_impact_item_image("星星之夜帆布托特包"), "quantity": 1, "price": "89.00"}, {"id": 6, "product_id": 5, "product_name": "太空旅行圆领卫衣", "product_image": _mock_impact_item_image("太空旅行圆领卫衣"), "quantity": 1, "price": "68.00"}],
        "created_at": "2025-04-15T11:00:00",
        "updated_at": "2025-04-15T11:00:00",
    },
    {
        "id": 5,
        "user_id": 4,
        "order_no": "TH2025042009005",
        "total_amount": "326.00",
        "status": "completed",
        "shipping_address": "上海市浦东新区陆家嘴环路1000号",
        "payment_method": "alipay",
        "payment_id": "ali_order_005",
        "items": [{"id": 7, "product_id": 1, "product_name": "彩虹鱼棉质 T 恤", "product_image": _mock_impact_item_image("彩虹鱼棉质 T 恤"), "quantity": 1, "price": "168.00"}, {"id": 8, "product_id": 7, "product_name": "未来城市连帽卫衣", "product_image": _mock_impact_item_image("未来城市连帽卫衣"), "quantity": 1, "price": "128.00"}],
        "created_at": "2025-04-20T09:00:00",
        "updated_at": "2025-04-22T14:00:00",
    },
    {
        "id": 6,
        "user_id": 1,  # Owner is user 1 (the test user)
        "order_no": "TH2025042512006",
        "total_amount": "128.00",
        "status": "pending",
        "shipping_address": "Test Address",
        "payment_method": "wechat",
        "payment_id": None,
        "items": [{"id": 9, "product_id": 1, "product_name": "彩虹鱼棉质 T 恤", "product_image": _mock_impact_item_image("彩虹鱼棉质 T 恤"), "quantity": 1, "price": "128.00"}],
        "created_at": "2025-04-25T12:00:00",
        "updated_at": "2025-04-25T12:00:00",
    },
]

# 为 mock 订单补齐物流字段（兼容旧数据）
for _mo in _mock_orders:
    _mo.setdefault("carrier", "SF" if _mo.get("status") in ("shipped", "completed") else None)
    _mo.setdefault("tracking_number", "SF1234567890CN" if _mo.get("status") in ("shipped", "completed") else None)
    _mo.setdefault(
        "logistics_events",
        [
            {"at": _mo["created_at"], "status": "created", "description": "订单已创建", "location": None},
            {"at": _mo["updated_at"], "status": _mo["status"], "description": "状态更新", "location": None},
        ]
        if _mo.get("status") in ("shipped", "completed", "paid")
        else [{"at": _mo["created_at"], "status": "created", "description": "订单已创建", "location": None}],
    )



@router.get("", response_model=PaginatedResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    search: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List orders for the current user (or all for admin). (Refactored)"""
    order_service = OrderService(db)
    try:
        is_admin = current_user.get("role") == "admin"
        orders, total = await order_service.list_orders(
            current_user["id"],
            is_admin=is_admin,
            page=page,
            page_size=page_size,
            status=status,
            keyword=search,
        )
        
        # Batch load items for all orders
        order_ids = [o.id for o in orders]
        if order_ids:
            all_items_stmt = select(OrderItem).where(OrderItem.order_id.in_(order_ids))
            all_items = (await db.execute(all_items_stmt)).scalars().all()
            product_map = await _build_product_map(db, all_items)
            items_by_order: dict[int, list] = {}
            for item in all_items:
                items_by_order.setdefault(item.order_id, []).append(item)
        else:
            items_by_order = {}
            product_map = {}

        user_map = await _build_user_map(db, orders)
        data = [order_to_out_dict(order, items_by_order.get(order.id, []), product_map, user_map) for order in orders]

        return PaginatedResponse(data=data, total=total, page=page, page_size=page_size)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing orders: {e}")
        return PaginatedResponse(data=[], total=0, page=page, page_size=page_size)

@router.get("/mine", response_model=PaginatedResponse)
async def my_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    keyword: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's orders with optional filters."""
    order_service = OrderService(db)
    try:
        orders, total = await order_service.list_orders(
            current_user["id"],
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword,
            date_from=date_from,
            date_to=date_to,
        )
        # Batch load items for all orders
        order_ids = [o.id for o in orders]
        if order_ids:
            all_items_stmt = select(OrderItem).where(OrderItem.order_id.in_(order_ids))
            all_items = (await db.execute(all_items_stmt)).scalars().all()
            product_map = await _build_product_map(db, all_items)
            items_by_order: dict[int, list] = {}
            for item in all_items:
                items_by_order.setdefault(item.order_id, []).append(item)
        else:
            items_by_order = {}
            product_map = {}

        user_map = await _build_user_map(db, orders)
        data = [order_to_out_dict(order, items_by_order.get(order.id, []), product_map, user_map) for order in orders]
        return PaginatedResponse(data=data, total=total, page=page, page_size=page_size)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing user orders: {e}")
        return PaginatedResponse(data=[], total=0, page=page, page_size=page_size)


@router.post("", response_model=ApiResponse, status_code=201)
@router.post("/create", response_model=ApiResponse, status_code=201)
async def create_order(
    body: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    """Create a new order with inventory reservation. (Refactored)

    P1 Security: Uses idempotency_key header to prevent duplicate orders
    when users click "Submit" multiple times rapidly.
    """
    order_service = OrderService(db)

    # P1: Idempotency check - if same idempotency key was used recently, return existing order
    if idempotency_key:
        idem_stmt = select(Order).where(
            Order.user_id == current_user["id"],
            Order.idempotency_key == idempotency_key
        ).order_by(Order.created_at.desc())
        idem_result = await db.execute(idem_stmt)
        existing_order = idem_result.scalar_one_or_none()
        if existing_order:
            logger.info(f"Idempotent order reuse for key={idempotency_key}, order_id={existing_order.id}")
            item_stmt = select(OrderItem).where(OrderItem.order_id == existing_order.id)
            items = (await db.execute(item_stmt)).scalars().all()
            product_map = await _build_product_map(db, items)
            return ApiResponse(data=order_to_out_dict(existing_order, list(items), product_map))

    try:
        # Resolve address_id to shipping_address string
        order_data = body.model_dump()

        # P1: Store idempotency key if provided
        if idempotency_key:
            order_data["idempotency_key"] = idempotency_key

        if body.address_id:
            from app.models.address import Address
            addr_stmt = select(Address).where(Address.id == body.address_id, Address.user_id == current_user["id"])
            addr_result = await db.execute(addr_stmt)
            addr = addr_result.scalar_one_or_none()
            if not addr:
                raise HTTPException(status_code=404, detail="Address not found")
            parts = [addr.province, addr.city, addr.district, addr.detail_address]
            order_data["shipping_address"] = f"{addr.recipient_name} {addr.phone}, " + " ".join(p for p in parts if p)
            # P1: Also populate structured address fields from saved address
            order_data["recipient_name"] = addr.recipient_name
            order_data["recipient_phone"] = addr.phone
            order_data["province"] = addr.province
            order_data["city"] = addr.city
            order_data["district"] = addr.district
            order_data["detail_address"] = addr.detail_address
            order_data["postal_code"] = addr.postal_code
            order_data["country"] = getattr(addr, "country", None)
            order_data["country_code"] = getattr(addr, "country_code", None)

        order = await order_service.place_order(current_user["id"], order_data)

        # Re-fetch with items for full detail
        item_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
        items = (await db.execute(item_stmt)).scalars().all()
        product_map = await _build_product_map(db, items)
        # Avoid MissingGreenlet: after further queries the Order instance may be expired;
        # touching order.created_at would trigger implicit sync reload (invalid in async).
        await db.refresh(order)

        secret_key = settings.APP_SECRET_KEY
        if isinstance(secret_key, bytes):
            secret_key = secret_key.decode("utf-8", errors="replace")
        elif secret_key is None:
            secret_key = ""

        response_data = order_to_out_dict(
            order,
            list(items),
            product_map,
            mock_pay_token=issue_mock_pay_token(
                order.id,
                order.order_no,
                int(current_user["id"]),
                secret_key,
            ),
        )

        return ApiResponse(data=response_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Order placement failed: %s", e)
        detail = str(e) if settings.DEBUG else "Internal server error"
        raise HTTPException(status_code=500, detail=detail)

@router.get("/{order_id}", response_model=ApiResponse)
async def get_order(
    order_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single order by ID. (Refactored)"""
    order_service = OrderService(db)
    try:
        order = await order_service.get_order_detail(order_id)
        if current_user.get("role") != "admin" and order.user_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
            
        item_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
        items = (await db.execute(item_stmt)).scalars().all()
        product_map = await _build_product_map(db, items)
        return ApiResponse(data=order_to_out_dict(order, list(items), product_map))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")

@router.post("/{order_id}/cancel", response_model=ApiResponse)
async def cancel_order(
    order_id: int, 
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel order and return stock. (Refactored)"""
    order_service = OrderService(db)
    try:
        order = await order_service.get_order_detail(order_id)
        if order.user_id != current_user["id"] and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Access denied")

        cancelled_order = await order_service.cancel_order(order_id)
        await db.refresh(cancelled_order)

        item_stmt = select(OrderItem).where(OrderItem.order_id == order_id)
        items = (await db.execute(item_stmt)).scalars().all()
        product_map = await _build_product_map(db, items)
        out = order_to_out_dict(cancelled_order, list(items), product_map)
        return ApiResponse(data=out)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cancellation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{order_id}/status", response_model=ApiResponse)
async def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update order status (admin or owner)."""
    try:
        stmt = select(Order).where(Order.id == order_id)
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if current_user.get("role") != "admin" and order.user_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Forbidden")
        # Non-admin users can only cancel their own orders
        if current_user.get("role") != "admin" and body.status != "cancelled":
            raise HTTPException(status_code=403, detail="Only admins can change order status to non-cancelled states")
        order.status = body.status
        await db.flush()
        item_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
        items = (await db.execute(item_stmt)).scalars().all()
        product_map = await _build_product_map(db, items)
        return ApiResponse(data=order_to_out_dict(order, list(items), product_map))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DB write failed during update_order_status: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.put("/{order_id}/logistics", response_model=ApiResponse)
async def update_order_logistics(
    order_id: int,
    body: OrderLogisticsUpdate,
    _admin: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """后台更新承运商、运单号并追加物流节点（仅管理员）。"""
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if body.carrier is not None:
        order.carrier = body.carrier
    if body.tracking_number is not None:
        order.tracking_number = body.tracking_number
    events = _parse_logistics_events(getattr(order, "logistics_events", None))
    if body.new_event is not None:
        ev = body.new_event.model_dump()
        events.append(ev)
        order.logistics_events = json.dumps(events, ensure_ascii=False)
    elif body.carrier is not None or body.tracking_number is not None:
        order.logistics_events = json.dumps(events, ensure_ascii=False)
    await db.flush()
    item_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
    items = (await db.execute(item_stmt)).scalars().all()
    product_map = await _build_product_map(db, items)
    return ApiResponse(data=order_to_out_dict(order, list(items), product_map))


@router.post("/{order_id}/return", response_model=ApiResponse, status_code=201)
async def request_return(
    order_id: int,
    body: ReturnRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Request a return or exchange for a completed order."""
    from app.models.circular_commerce import AfterSaleTicket

    # Validate order exists and belongs to user
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    if order.status != "completed":
        raise HTTPException(status_code=400, detail="Can only request returns for completed orders")

    # Validate items belong to this order
    item_stmt = select(OrderItem).where(OrderItem.order_id == order_id)
    order_items = {i.id: i for i in (await db.execute(item_stmt)).scalars().all()}

    for ri in body.items:
        if ri.order_item_id not in order_items:
            raise HTTPException(status_code=400, detail=f"Order item {ri.order_item_id} not found in this order")
        if ri.quantity > order_items[ri.order_item_id].quantity:
            raise HTTPException(status_code=400, detail=f"Return quantity exceeds ordered quantity for item {ri.order_item_id}")

    # Build structured description
    items_desc = []
    for ri in body.items:
        oi = order_items[ri.order_item_id]
        items_desc.append({
            "order_item_id": ri.order_item_id,
            "product_id": oi.product_id,
            "quantity": ri.quantity,
            "price": str(oi.price),
        })

    import json as _json
    description_parts = [f"Items: {_json.dumps(items_desc, ensure_ascii=False)}"]
    if body.reason:
        description_parts.append(f"Reason: {body.reason}")
    if body.type == "exchange":
        if body.exchange_product_id:
            description_parts.append(f"Exchange product ID: {body.exchange_product_id}")
        if body.exchange_size:
            description_parts.append(f"Exchange size: {body.exchange_size}")
        if body.exchange_color:
            description_parts.append(f"Exchange color: {body.exchange_color}")

    ticket = AfterSaleTicket(
        user_id=current_user["id"],
        order_id=order_id,
        category=body.type,
        status="open",
        subject=f"{'退货' if body.type == 'return' else '换货'}申请 - {order.order_no}",
        description="\n".join(description_parts),
    )
    db.add(ticket)
    await db.flush()

    from app.schemas.circular_commerce import AfterSaleOut
    return ApiResponse(data=AfterSaleOut.model_validate(ticket).model_dump())
