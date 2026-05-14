"""add campaign indexes for status, start_date, created_at

Revision ID: a3b4c5d6e7f8
Revises: f2a3b4c5d6e7
Create Date: 2026-05-12
"""
from alembic import op

revision = "a3b4c5d6e7f8"
down_revision = "f2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_campaigns_status", "campaigns", ["status"])
    op.create_index("ix_campaigns_start_date", "campaigns", ["start_date"])
    op.create_index("ix_campaigns_created_at", "campaigns", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_campaigns_created_at", table_name="campaigns")
    op.drop_index("ix_campaigns_start_date", table_name="campaigns")
    op.drop_index("ix_campaigns_status", table_name="campaigns")
