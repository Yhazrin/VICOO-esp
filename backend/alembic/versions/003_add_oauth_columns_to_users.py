"""Add OAuth provider columns to users

Revision ID: 003
Revises: 002
Create Date: 2026-03-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("github_id", sa.String(length=128), nullable=True))
    op.add_column("users", sa.Column("google_id", sa.String(length=128), nullable=True))
    op.create_index("ix_users_github_id", "users", ["github_id"], unique=True)
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_index("ix_users_github_id", table_name="users")
    op.drop_column("users", "google_id")
    op.drop_column("users", "github_id")
