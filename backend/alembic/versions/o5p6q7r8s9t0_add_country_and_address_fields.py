"""Add country field to addresses and structured address fields to orders.

Revision ID: o5p6q7r8s9t0
Revises: n4o5p6q7r8s9
Create Date: 2026-05-28
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "o5p6q7r8s9t0"
down_revision = "n4o5p6q7r8s9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add country and country_code columns to addresses table
    op.add_column("addresses", sa.Column("country", sa.String(length=100), nullable=True))
    op.add_column("addresses", sa.Column("country_code", sa.String(length=10), nullable=True))

    # Add idempotency_key and structured address fields to orders table
    op.add_column("orders", sa.Column("idempotency_key", sa.String(length=100), nullable=True))
    op.add_column("orders", sa.Column("recipient_name", sa.String(length=100), nullable=True))
    op.add_column("orders", sa.Column("recipient_phone", sa.String(length=30), nullable=True))
    op.add_column("orders", sa.Column("province", sa.String(length=50), nullable=True))
    op.add_column("orders", sa.Column("city", sa.String(length=50), nullable=True))
    op.add_column("orders", sa.Column("district", sa.String(length=50), nullable=True))
    op.add_column("orders", sa.Column("detail_address", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("postal_code", sa.String(length=20), nullable=True))
    op.add_column("orders", sa.Column("country", sa.String(length=100), nullable=True))
    op.add_column("orders", sa.Column("country_code", sa.String(length=10), nullable=True))

    # Create indexes for idempotency lookups (no partial index - MySQL/PostgreSQL compatible)
    op.create_index("ix_orders_idempotency_key", "orders", ["idempotency_key"], unique=False)
    op.create_index("ix_orders_user_idempotency", "orders", ["user_id", "idempotency_key"], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_orders_user_idempotency", table_name="orders")
    op.drop_index("ix_orders_idempotency_key", table_name="orders")

    # Remove columns from orders table
    op.drop_column("orders", "country_code")
    op.drop_column("orders", "country")
    op.drop_column("orders", "postal_code")
    op.drop_column("orders", "detail_address")
    op.drop_column("orders", "district")
    op.drop_column("orders", "city")
    op.drop_column("orders", "province")
    op.drop_column("orders", "recipient_phone")
    op.drop_column("orders", "recipient_name")
    op.drop_column("orders", "idempotency_key")

    # Remove columns from addresses table
    op.drop_column("addresses", "country_code")
    op.drop_column("addresses", "country")