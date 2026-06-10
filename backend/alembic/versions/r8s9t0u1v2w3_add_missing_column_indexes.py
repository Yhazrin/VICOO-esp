"""add missing column indexes for frequently filtered columns

Revision ID: r8s9t0u1v2w3
Revises: q7r8s9t0u1v2
Create Date: 2026-05-27

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'r8s9t0u1v2w3'
down_revision: Union[str, None] = 'q7r8s9t0u1v2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table: str) -> bool:
    bind = op.get_bind()
    result = bind.execute(
        __import__('sqlalchemy').text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema = DATABASE() AND table_name = :t"
        ),
        {"t": table},
    )
    return result.scalar() > 0


def _index_exists(table: str, index_name: str) -> bool:
    bind = op.get_bind()
    result = bind.execute(
        __import__('sqlalchemy').text(
            "SELECT COUNT(*) FROM information_schema.statistics "
            "WHERE table_schema = DATABASE() AND table_name = :t AND index_name = :i"
        ),
        {"t": table, "i": index_name},
    )
    return result.scalar() > 0


def upgrade() -> None:
    indexes = [
        ('ix_products_status', 'products', ['status']),
        ('ix_users_role', 'users', ['role']),
        ('ix_payment_transactions_status', 'payment_transactions', ['status']),
        ('ix_child_participants_status', 'child_participants', ['status']),
        ('ix_editorial_articles_category', 'editorial_articles', ['category']),
        ('ix_donations_payment_method', 'donations', ['payment_method']),
        ('ix_after_sale_tickets_category', 'after_sale_tickets', ['category']),
    ]
    for idx_name, table, columns in indexes:
        if _table_exists(table) and not _index_exists(table, idx_name):
            op.create_index(op.f(idx_name), table, columns, unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_after_sale_tickets_category'), table_name='after_sale_tickets')
    op.drop_index(op.f('ix_donations_payment_method'), table_name='donations')
    op.drop_index(op.f('ix_editorial_articles_category'), table_name='editorial_articles')
    op.drop_index(op.f('ix_child_participants_status'), table_name='child_participants')
    op.drop_index(op.f('ix_payment_transactions_status'), table_name='payment_transactions')
    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_index(op.f('ix_products_status'), table_name='products')
