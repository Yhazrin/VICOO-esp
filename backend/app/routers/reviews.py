"""商品评价。"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.circular_commerce import ProductReview
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas import ApiResponse, PaginatedResponse, ProductReviewCreate, ProductReviewOut

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def _review_to_out(review: ProductReview, author_nickname: str | None = None) -> dict:
    payload = ProductReviewOut.model_validate(review).model_dump()
    if author_nickname:
        payload["author_nickname"] = author_nickname
    return payload


@router.get("", response_model=PaginatedResponse)
async def list_reviews(
    product_id: int = Query(..., ge=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    count_stmt = select(func.count(ProductReview.id)).where(ProductReview.product_id == product_id)
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = (
        select(ProductReview, User.nickname)
        .join(User, User.id == ProductReview.user_id)
        .where(ProductReview.product_id == product_id)
        .order_by(ProductReview.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.execute(stmt)).all()
    data = [_review_to_out(review, nickname) for review, nickname in rows]
    return PaginatedResponse(data=data, total=total, page=page, page_size=page_size)


@router.post("", response_model=ApiResponse, status_code=201)
async def create_review(
    body: ProductReviewCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.order_id is not None:
        order = await db.get(Order, body.order_id)
        if not order or order.user_id != current_user["id"]:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.status != "completed":
            raise HTTPException(status_code=400, detail="Only completed orders can be reviewed")
        item_stmt = select(OrderItem.id).where(
            OrderItem.order_id == body.order_id,
            OrderItem.product_id == body.product_id,
        )
        if (await db.execute(item_stmt)).scalar_one_or_none() is None:
            raise HTTPException(status_code=400, detail="Product is not in this order")

    row = ProductReview(
        product_id=body.product_id,
        user_id=current_user["id"],
        order_id=body.order_id,
        rating=body.rating,
        title=body.title,
        body=body.body,
    )
    db.add(row)
    try:
        await db.flush()
        await db.refresh(row, ["created_at"])
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="You have already reviewed this product")
    return ApiResponse(data=_review_to_out(row, current_user.get("nickname")))


@router.get("/mine", response_model=ApiResponse)
async def my_reviews(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ProductReview)
        .where(ProductReview.user_id == current_user["id"])
        .order_by(ProductReview.created_at.desc())
        .limit(100)
    )
    rows = (await db.execute(stmt)).scalars().all()
    nickname = current_user.get("nickname")
    return ApiResponse(data=[_review_to_out(r, nickname) for r in rows])
