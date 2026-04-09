"""Add return/exchange support: items JSON on after_sale_tickets

Revision ID: 011
Revises: 010
Create Date: 2026-04-10
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("after_sale_tickets", sa.Column("items", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("after_sale_tickets", "items")
