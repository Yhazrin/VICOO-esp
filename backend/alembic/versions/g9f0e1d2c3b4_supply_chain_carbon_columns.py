"""Add supply_chain_records carbon_kg / carbon_note (ORM columns).

Revision ID: g9f0e1d2c3b4
Revises: f8e9d0c1b2a3
Create Date: 2026-05-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "g9f0e1d2c3b4"
down_revision: Union[str, None] = "f8e9d0c1b2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("supply_chain_records")}
    if "carbon_kg" not in cols:
        op.add_column(
            "supply_chain_records",
            sa.Column("carbon_kg", sa.DECIMAL(8, 2), nullable=True),
        )
    if "carbon_note" not in cols:
        op.add_column(
            "supply_chain_records",
            sa.Column("carbon_note", sa.String(500), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("supply_chain_records")}
    if "carbon_note" in cols:
        op.drop_column("supply_chain_records", "carbon_note")
    if "carbon_kg" in cols:
        op.drop_column("supply_chain_records", "carbon_kg")
