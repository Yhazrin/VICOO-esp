"""Add WGS84 latitude/longitude to supply_chain_records for globe traceability.

Revision ID: a1b2c3d4e5f6
Revises: 012_fix_product_catalog_impact_split
Create Date: 2026-04-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "supply_chain_records",
        sa.Column("latitude", sa.Float(), nullable=True),
    )
    op.add_column(
        "supply_chain_records",
        sa.Column("longitude", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("supply_chain_records", "longitude")
    op.drop_column("supply_chain_records", "latitude")
