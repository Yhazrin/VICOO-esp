"""Add impact product fields to products

Revision ID: 009
Revises: 14e3312c2b59
Create Date: 2026-04-10
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "009"
down_revision = "14e3312c2b59"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("is_impact_product", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.add_column("products", sa.Column("campaign_id", sa.Integer(), nullable=True))
    op.add_column("products", sa.Column("donation_percentage", sa.DECIMAL(5, 2), nullable=True))
    op.create_index("ix_products_is_impact_product", "products", ["is_impact_product"])
    op.create_index("ix_products_campaign_id", "products", ["campaign_id"])
    op.create_foreign_key("fk_products_campaign_id", "products", "campaigns", ["campaign_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_products_campaign_id", "products", type_="foreignkey")
    op.drop_index("ix_products_campaign_id", table_name="products")
    op.drop_index("ix_products_is_impact_product", table_name="products")
    op.drop_column("products", "donation_percentage")
    op.drop_column("products", "campaign_id")
    op.drop_column("products", "is_impact_product")
