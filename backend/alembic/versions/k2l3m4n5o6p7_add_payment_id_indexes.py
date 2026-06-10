"""add payment_id indexes for callback lookups

Revision ID: k2l3m4n5o6p7
Revises: i0j1k2l3m4n5
Create Date: 2026-05-27

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'k2l3m4n5o6p7'
down_revision: Union[str, None] = 'i0j1k2l3m4n5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(op.f('ix_orders_payment_id'), 'orders', ['payment_id'], unique=False)
    op.create_index(op.f('ix_donations_payment_id'), 'donations', ['payment_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_donations_payment_id'), table_name='donations')
    op.drop_index(op.f('ix_orders_payment_id'), table_name='orders')
