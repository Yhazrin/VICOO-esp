"""fix sustainability_score precision from DECIMAL(3,2) to DECIMAL(5,2)

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-05-11
"""
from alembic import op
import sqlalchemy as sa

revision = "f2a3b4c5d6e7"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "products",
        "sustainability_score",
        existing_type=sa.DECIMAL(3, 2),
        type_=sa.DECIMAL(5, 2),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "products",
        "sustainability_score",
        existing_type=sa.DECIMAL(5, 2),
        type_=sa.DECIMAL(3, 2),
        existing_nullable=True,
    )
