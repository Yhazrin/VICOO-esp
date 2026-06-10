"""Add dual confirmation columns to orders for user+admin sign-off.

Revision ID: q7r8s9t0u1v2
Revises: p6q7r8s9t0u1
Create Date: 2026-06-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "q7r8s9t0u1v2"
down_revision: Union[str, None] = "p6q7r8s9t0u1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("user_confirmed_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("admin_delivered_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("orders", "admin_delivered_at")
    op.drop_column("orders", "user_confirmed_at")
