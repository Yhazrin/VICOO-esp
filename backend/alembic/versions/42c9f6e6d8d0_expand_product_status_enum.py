"""Expand product_status enum to include sold_out

Revision ID: 42c9f6e6d8d0
Revises: 864b87240722
Create Date: 2026-03-30 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "42c9f6e6d8d0"
down_revision: Union[str, None] = "864b87240722"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE products
        MODIFY COLUMN status ENUM('active','inactive','sold_out')
        NOT NULL DEFAULT 'active'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE products
        MODIFY COLUMN status ENUM('active','inactive')
        NOT NULL DEFAULT 'active'
        """
    )
