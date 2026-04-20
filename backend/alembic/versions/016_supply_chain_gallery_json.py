"""Add gallery_json to supply_chain_records for images/videos per trace point.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "supply_chain_records",
        sa.Column("gallery_json", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("supply_chain_records", "gallery_json")
