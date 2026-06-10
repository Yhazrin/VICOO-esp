"""add campaign sustainability fields

Revision ID: k1l2m3n4o5p6
Revises: i0j1k2l3m4n5
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa


revision = 'k1l2m3n4o5p6'
down_revision = 'i0j1k2l3m4n5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add subtitle column
    op.add_column('campaigns', sa.Column('subtitle', sa.String(500), nullable=True))
    # Add sustainability loop fields
    op.add_column('campaigns', sa.Column('sustainability_eyebrow', sa.String(200), nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_title', sa.String(300), nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_subtitle', sa.Text, nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_p1_title', sa.String(200), nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_p1_body', sa.Text, nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_p2_title', sa.String(200), nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_p2_body', sa.Text, nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_p3_title', sa.String(200), nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_p3_body', sa.Text, nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_p4_title', sa.String(200), nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_p4_body', sa.Text, nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_footnote', sa.Text, nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_cta_traceability', sa.String(100), nullable=True))
    op.add_column('campaigns', sa.Column('sustainability_cta_shop', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('campaigns', 'sustainability_cta_shop')
    op.drop_column('campaigns', 'sustainability_cta_traceability')
    op.drop_column('campaigns', 'sustainability_footnote')
    op.drop_column('campaigns', 'sustainability_p4_body')
    op.drop_column('campaigns', 'sustainability_p4_title')
    op.drop_column('campaigns', 'sustainability_p3_body')
    op.drop_column('campaigns', 'sustainability_p3_title')
    op.drop_column('campaigns', 'sustainability_p2_body')
    op.drop_column('campaigns', 'sustainability_p2_title')
    op.drop_column('campaigns', 'sustainability_p1_body')
    op.drop_column('campaigns', 'sustainability_p1_title')
    op.drop_column('campaigns', 'sustainability_subtitle')
    op.drop_column('campaigns', 'sustainability_title')
    op.drop_column('campaigns', 'sustainability_eyebrow')
    op.drop_column('campaigns', 'subtitle')
