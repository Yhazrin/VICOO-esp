"""add site_settings table

Revision ID: p6q7r8s9t0u1
Revises: o5p6q7r8s9t0
Create Date: 2026-05-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers
revision = 'p6q7r8s9t0u1'
down_revision = 'o5p6q7r8s9t0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotent: skip if table already exists
    from sqlalchemy import text
    bind = op.get_bind()
    result = bind.execute(text("SHOW TABLES LIKE 'site_settings'")).fetchone()
    if result:
        return  # Table exists, skip

    op.create_table(
        'site_settings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('key', sa.String(200), nullable=False),
        sa.Column('value', sa.JSON(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key'),
    )
    op.create_index('ix_site_settings_key', 'site_settings', ['key'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_site_settings_key', table_name='site_settings')
    op.drop_table('site_settings')