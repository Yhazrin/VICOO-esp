import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.cart import CartItem
from app.schemas import ApiResponse
from app.schemas.cart import CartItemIn, CartItemOut, CartItemUpdate, CartSyncRequest
from app.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("", response_model=ApiResponse)
async def get_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's cart."""
    try:
        stmt = select(CartItem).where(CartItem.user_id == current_user["id"]).order_by(CartItem.created_at)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return ApiResponse(data=[CartItemOut.model_validate(i).model_dump() for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get cart: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.put("/sync", response_model=ApiResponse)
async def sync_cart(
    body: CartSyncRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Merge local cart with server cart. Server cart wins on conflict (max quantity)."""
    try:
        uid = current_user["id"]

        # Fetch existing server cart
        stmt = select(CartItem).where(CartItem.user_id == uid)
        result = await db.execute(stmt)
        existing = result.scalars().all()

        # Index existing by (product_id, selected_size, selected_color)
        existing_map: dict[str, CartItem] = {}
        for item in existing:
            key = f"{item.product_id}-{item.selected_size or ''}-{item.selected_color or ''}"
            existing_map[key] = item

        # Merge incoming items
        for incoming in body.items:
            key = f"{incoming.product_id}-{incoming.selected_size or ''}-{incoming.selected_color or ''}"
            if key in existing_map:
                # Update quantity to max of local and server
                existing_item = existing_map[key]
                if incoming.quantity > existing_item.quantity:
                    existing_item.quantity = incoming.quantity
            else:
                # New item — add to server cart
                new_item = CartItem(
                    user_id=uid,
                    product_id=incoming.product_id,
                    quantity=incoming.quantity,
                    selected_size=incoming.selected_size,
                    selected_color=incoming.selected_color,
                )
                db.add(new_item)

        await db.flush()

        # Return merged cart
        stmt = select(CartItem).where(CartItem.user_id == uid).order_by(CartItem.created_at)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return ApiResponse(data=[CartItemOut.model_validate(i).model_dump() for i in items])
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to sync cart")
        raise HTTPException(status_code=500, detail="Failed to sync cart")


@router.post("/items", response_model=ApiResponse, status_code=201)
async def add_cart_item(
    body: CartItemIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add an item to the cart (or update quantity if exists)."""
    try:
        uid = current_user["id"]
        stmt = select(CartItem).where(
            CartItem.user_id == uid,
            CartItem.product_id == body.product_id,
            CartItem.selected_size == body.selected_size,
            CartItem.selected_color == body.selected_color,
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.quantity = min(99, existing.quantity + body.quantity)
            await db.flush()
            await db.refresh(existing)
            return ApiResponse(data=CartItemOut.model_validate(existing).model_dump())

        item = CartItem(
            user_id=uid,
            product_id=body.product_id,
            quantity=body.quantity,
            selected_size=body.selected_size,
            selected_color=body.selected_color,
        )
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return ApiResponse(data=CartItemOut.model_validate(item).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to add cart item")
        raise HTTPException(status_code=500, detail="Failed to add cart item")


@router.put("/items/{item_id}", response_model=ApiResponse)
async def update_cart_item(
    item_id: int,
    body: CartItemUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a cart item's quantity."""
    try:
        stmt = select(CartItem).where(CartItem.id == item_id, CartItem.user_id == current_user["id"])
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        item.quantity = body.quantity
        await db.flush()
        await db.refresh(item)
        return ApiResponse(data=CartItemOut.model_validate(item).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update cart item")
        raise HTTPException(status_code=500, detail="Failed to update cart item")


@router.delete("/items/{item_id}", response_model=ApiResponse)
async def remove_cart_item(
    item_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove an item from the cart."""
    try:
        stmt = select(CartItem).where(CartItem.id == item_id, CartItem.user_id == current_user["id"])
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        await db.delete(item)
        await db.flush()
        return ApiResponse(data={"deleted": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to remove cart item")
        raise HTTPException(status_code=500, detail="Failed to remove cart item")


@router.delete("", response_model=ApiResponse)
async def clear_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Clear all items from the cart."""
    try:
        await db.execute(delete(CartItem).where(CartItem.user_id == current_user["id"]))
        await db.flush()
        return ApiResponse(data={"cleared": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to clear cart")
        raise HTTPException(status_code=500, detail="Failed to clear cart")
