"""Add after-sale refund and return-shipment fields.

Revision ID: w4x5y6z7a8b9
Revises: u2v3w4x5y6z7
Create Date: 2026-06-12
"""

from alembic import op
import sqlalchemy as sa

revision = "w4x5y6z7a8b9"
down_revision = "u2v3w4x5y6z7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("after_sale_tickets", sa.Column("admin_note", sa.Text(), nullable=True))
    op.add_column("after_sale_tickets", sa.Column("return_carrier", sa.String(100), nullable=True))
    op.add_column("after_sale_tickets", sa.Column("return_tracking_no", sa.String(120), nullable=True))
    op.add_column("after_sale_tickets", sa.Column("refund_amount", sa.DECIMAL(12, 2), nullable=True))
    op.add_column(
        "after_sale_tickets",
        sa.Column(
            "refund_status",
            sa.Enum("pending", "succeeded", "failed", name="after_sale_refund_status"),
            nullable=True,
        ),
    )
    op.add_column("after_sale_tickets", sa.Column("goods_received_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("after_sale_tickets", "goods_received_at")
    op.drop_column("after_sale_tickets", "refund_status")
    op.drop_column("after_sale_tickets", "refund_amount")
    op.drop_column("after_sale_tickets", "return_tracking_no")
    op.drop_column("after_sale_tickets", "return_carrier")
    op.drop_column("after_sale_tickets", "admin_note")
