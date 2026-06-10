from sqlalchemy import Column, Integer, String, DateTime, Text, DECIMAL, ForeignKey, Enum, UniqueConstraint, func
from app.database import Base


class ImpactFundEntry(Base):
    __tablename__ = "impact_fund_entries"

    __table_args__ = (
        UniqueConstraint("order_id", "order_item_id", "beneficiary_type", name="uq_impact_fund_order_item_beneficiary"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    artwork_id = Column(Integer, ForeignKey("artworks.id"), nullable=True, index=True)
    child_participant_id = Column(Integer, ForeignKey("child_participants.id"), nullable=True, index=True)

    beneficiary_type = Column(
        Enum("artist", "school", "charity_pool", name="beneficiary_type"),
        nullable=False,
    )
    beneficiary_name = Column(String(200), nullable=True)

    sale_amount = Column(DECIMAL(12, 2), nullable=False)
    donation_percentage = Column(DECIMAL(5, 2), nullable=False)
    allocated_amount = Column(DECIMAL(12, 2), nullable=False)

    status = Column(
        Enum("allocated", "disbursed", name="fund_entry_status"),
        default="allocated",
        nullable=False,
        index=True,
    )

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
