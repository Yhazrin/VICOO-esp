"""Product reviews."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.database import get_db
from app.models.circular_commerce import ProductReview
from app.models.order import Order
from app.schemas import ApiResponse, PaginatedResponse, ProductReviewCreate, ProductReviewOut

logger = logging.getLogger(__name__)
from app.deps import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("", response_model=PaginatedResponse)
async def list_reviews(
    product_id: int = Query(..., ge=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    try:
        stmt = select(ProductReview).where(ProductReview.product_id == product_id)
        count_stmt = select(func.count(ProductReview.id)).where(ProductReview.product_id == product_id)
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(ProductReview.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        rows = (await db.execute(stmt)).scalars().all()
        data = [ProductReviewOut.model_validate(r).model_dump() for r in rows]
        return PaginatedResponse(data=data, total=total, page=page, page_size=page_size)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list reviews")
        raise HTTPException(status_code=500, detail="Failed to list reviews")


@router.post("", response_model=ApiResponse, status_code=201)
async def create_review(
    body: ProductReviewCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify order ownership when order_id is provided
    if body.order_id:
        order = (await db.execute(
            select(Order).where(Order.id == body.order_id, Order.user_id == current_user["id"])
        )).scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=403, detail="Order not found or does not belong to you")

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
    except IntegrityError:
        raise HTTPException(status_code=409, detail="You have already reviewed this product")
    except Exception as e:
        logger.exception("Failed to create review")
        raise HTTPException(status_code=500, detail="Internal server error")
    return ApiResponse(data=ProductReviewOut.model_validate(row).model_dump())


@router.get("/mine", response_model=PaginatedResponse)
async def my_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        total = (await db.execute(
            select(func.count(ProductReview.id)).where(ProductReview.user_id == current_user["id"])
        )).scalar() or 0
        stmt = (
            select(ProductReview)
            .where(ProductReview.user_id == current_user["id"])
            .order_by(ProductReview.created_at.desc())
            .offset((page - 1) * page_size).limit(page_size)
        )
        rows = (await db.execute(stmt)).scalars().all()
        return PaginatedResponse(
            data=[ProductReviewOut.model_validate(r).model_dump() for r in rows],
            total=total, page=page, page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list user reviews")
        raise HTTPException(status_code=500, detail="Failed to list reviews")