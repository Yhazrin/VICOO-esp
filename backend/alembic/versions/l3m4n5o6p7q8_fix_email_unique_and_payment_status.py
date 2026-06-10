"""fix: restore email unique constraint and migrate payment status enum

Revision ID: l3m4n5o6p7q8
Revises: k2l3m4n5o6p7
Create Date: 2026-05-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'l3m4n5o6p7q8'
down_revision: Union[str, None] = 'k2l3m4n5o6p7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Restore unique constraint on users.email (dropped in 864b87240722)
    # Use IF NOT EXISTS equivalent — only create if not already present
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SHOW INDEX FROM users WHERE Key_name = 'uq_users_email'"
    )).fetchall()
    if not result:
        op.create_index('uq_users_email', 'users', ['email'], unique=True)

    # 2. Migrate payment_transactions rows with old 'completed' status to 'success'
    # The reconciliation migration changed the enum but didn't update existing data
    conn.execute(sa.text(
        "UPDATE payment_transactions SET status = 'success' WHERE status = 'completed'"
    ))


def downgrade() -> None:
    # Revert payment status values
    conn = op.get_bind()
    conn.execute(sa.text(
        "UPDATE payment_transactions SET status = 'completed' WHERE status = 'success'"
    ))

    # Drop the unique constraint
    op.drop_index('uq_users_email', table_name='users')
