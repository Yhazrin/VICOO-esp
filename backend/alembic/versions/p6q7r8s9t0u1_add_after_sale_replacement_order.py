"""Add replacement_order_id to after_sale_tickets.

Revision ID: p6q7r8s9t0u1
Revises: o5p6q7r8s9t0
Create Date: 2026-06-03
"""

from alembic import op
import sqlalchemy as sa

revision = "p6q7r8s9t0u1"
down_revision = "o5p6q7r8s9t0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "after_sale_tickets",
        sa.Column("replacement_order_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_after_sale_tickets_replacement_order_id",
        "after_sale_tickets",
        ["replacement_order_id"],
    )
    op.create_foreign_key(
        "fk_after_sale_tickets_replacement_order_id",
        "after_sale_tickets",
        "orders",
        ["replacement_order_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_after_sale_tickets_replacement_order_id",
        "after_sale_tickets",
        type_="foreignkey",
    )
    op.drop_index("ix_after_sale_tickets_replacement_order_id", "after_sale_tickets")
    op.drop_column("after_sale_tickets", "replacement_order_id")
