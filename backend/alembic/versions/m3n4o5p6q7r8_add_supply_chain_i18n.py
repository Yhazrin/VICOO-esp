"""Add description_en and location_en to supply_chain_records.

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
"""

from alembic import op
import sqlalchemy as sa

revision = "m3n4o5p6q7r8"
down_revision = "l2m3n4o5p6q7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("supply_chain_records", sa.Column("description_en", sa.Text(), nullable=True))
    op.add_column("supply_chain_records", sa.Column("location_en", sa.String(length=300), nullable=True))


def downgrade() -> None:
    op.drop_column("supply_chain_records", "location_en")
    op.drop_column("supply_chain_records", "description_en")