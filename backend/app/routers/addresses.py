import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.address import Address
from app.schemas import ApiResponse
from app.schemas.address import AddressCreate, AddressOut, AddressUpdate
from app.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/addresses", tags=["Addresses"])


def _format_address(addr: Address) -> str:
    """Format address into a single string for order shipping_address."""
    parts = [addr.province, addr.city, addr.district, addr.detail_address]
    return " ".join(p for p in parts if p)


@router.get("", response_model=ApiResponse)
async def list_addresses(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List current user's saved addresses."""
    try:
        stmt = select(Address).where(Address.user_id == current_user["id"]).order_by(Address.is_default.desc(), Address.created_at.desc())
        result = await db.execute(stmt)
        addresses = result.scalars().all()
        return ApiResponse(data=[AddressOut.model_validate(a).model_dump() for a in addresses])
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list addresses: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.post("", response_model=ApiResponse, status_code=201)
async def create_address(
    body: AddressCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new saved address."""
    try:
        _ADDRESS_CREATABLE = {
            "label", "recipient_name", "phone", "province", "city",
            "district", "detail_address", "postal_code", "country", "country_code", "is_default",
        }
        safe_data = {k: v for k, v in body.model_dump().items() if k in _ADDRESS_CREATABLE}
        addr = Address(
            user_id=current_user["id"],
            **safe_data,
        )
        db.add(addr)
        await db.flush()

        if body.is_default:
            await db.execute(
                update(Address)
                .where(Address.user_id == current_user["id"], Address.id != addr.id)
                .values(is_default=False)
            )
            await db.flush()

        await db.refresh(addr, ["created_at", "updated_at"])
        return ApiResponse(data=AddressOut.model_validate(addr).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create address")
        raise HTTPException(status_code=500, detail="Failed to create address")


@router.put("/{address_id}", response_model=ApiResponse)
async def update_address(
    address_id: int,
    body: AddressUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an address."""
    try:
        stmt = select(Address).where(Address.id == address_id, Address.user_id == current_user["id"])
        result = await db.execute(stmt)
        addr = result.scalar_one_or_none()
        if not addr:
            raise HTTPException(status_code=404, detail="Address not found")

        _ADDRESS_UPDATABLE = {
            "label", "recipient_name", "phone", "province", "city",
            "district", "detail_address", "postal_code", "country", "country_code", "is_default",
        }
        update_data = body.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key in _ADDRESS_UPDATABLE:
                setattr(addr, key, value)
        await db.flush()

        if body.is_default:
            await db.execute(
                update(Address)
                .where(Address.user_id == current_user["id"], Address.id != addr.id)
                .values(is_default=False)
            )
            await db.flush()

        await db.refresh(addr, ["created_at", "updated_at"])
        return ApiResponse(data=AddressOut.model_validate(addr).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update address")
        raise HTTPException(status_code=500, detail="Failed to update address")


@router.delete("/{address_id}", response_model=ApiResponse)
async def delete_address(
    address_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an address."""
    try:
        stmt = select(Address).where(Address.id == address_id, Address.user_id == current_user["id"])
        result = await db.execute(stmt)
        addr = result.scalar_one_or_none()
        if not addr:
            raise HTTPException(status_code=404, detail="Address not found")

        await db.delete(addr)
        await db.flush()
        return ApiResponse(data={"deleted": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to delete address")
        raise HTTPException(status_code=500, detail="Failed to delete address")


@router.put("/{address_id}/default", response_model=ApiResponse)
async def set_default_address(
    address_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set an address as default."""
    try:
        stmt = select(Address).where(Address.id == address_id, Address.user_id == current_user["id"])
        result = await db.execute(stmt)
        addr = result.scalar_one_or_none()
        if not addr:
            raise HTTPException(status_code=404, detail="Address not found")

        # Unset all other defaults
        await db.execute(
            update(Address)
            .where(Address.user_id == current_user["id"], Address.id != addr.id)
            .values(is_default=False)
        )
        addr.is_default = True
        await db.flush()
        await db.refresh(addr, ["created_at", "updated_at"])
        return ApiResponse(data=AddressOut.model_validate(addr).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to set default address")
        raise HTTPException(status_code=500, detail="Failed to set default address")
