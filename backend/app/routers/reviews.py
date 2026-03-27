"""商品评价。"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.circular_commerce import ProductReview
from app.schemas import ApiResponse, PaginatedResponse, ProductReviewCreate, ProductReviewOut
from app.deps import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("", response_model=PaginatedResponse)
async def list_reviews(
    product_id: int = Query(..., ge=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ProductReview).where(ProductReview.product_id == product_id)
    count_stmt = select(func.count(ProductReview.id)).where(ProductReview.product_id == product_id)
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.order_by(ProductReview.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()
    data = [ProductReviewOut.model_validate(r).model_dump() for r in rows]
    return PaginatedResponse(data=data, total=total, page=page, page_size=page_size)


@router.post("", response_model=ApiResponse, status_code=201)
async def create_review(
    body: ProductReviewCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
    return ApiResponse(data=ProductReviewOut.model_validate(row).model_dump())


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
    return ApiResponse(data=[ProductReviewOut.model_validate(r).model_dump() for r in rows])
