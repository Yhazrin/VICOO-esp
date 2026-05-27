"""add missing column indexes for frequently filtered columns

Revision ID: m3n4o5p6q7r8
Revises: k2l3m4n5o6p7
Create Date: 2026-05-27

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'm3n4o5p6q7r8'
down_revision: Union[str, None] = 'k2l3m4n5o6p7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Products: status filtered in most product queries
    op.create_index(op.f('ix_products_status'), 'products', ['status'], unique=False)
    # Users: role checked in every require_role() call and analytics queries
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)
    # Payment transactions: status queried during payment verification
    op.create_index(op.f('ix_payment_transactions_status'), 'payment_transactions', ['status'], unique=False)
    # Child participants: status filtered in admin queries
    op.create_index(op.f('ix_child_participants_status'), 'child_participants', ['status'], unique=False)
    # Editorial articles: category filtered in listing queries
    op.create_index(op.f('ix_editorial_articles_category'), 'editorial_articles', ['category'], unique=False)
    # Donations: payment_method filtered in analytics queries
    op.create_index(op.f('ix_donations_payment_method'), 'donations', ['payment_method'], unique=False)
    # After-sale tickets: category filtered in listing queries
    op.create_index(op.f('ix_after_sale_tickets_category'), 'after_sale_tickets', ['category'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_after_sale_tickets_category'), table_name='after_sale_tickets')
    op.drop_index(op.f('ix_donations_payment_method'), table_name='donations')
    op.drop_index(op.f('ix_editorial_articles_category'), table_name='editorial_articles')
    op.drop_index(op.f('ix_child_participants_status'), table_name='child_participants')
    op.drop_index(op.f('ix_payment_transactions_status'), table_name='payment_transactions')
    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_index(op.f('ix_products_status'), table_name='products')
