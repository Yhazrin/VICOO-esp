"""Initial database schema

Revision ID: 001
Revises:
Create Date: 2026-03-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('nickname', sa.String(100), nullable=False),
        sa.Column('avatar', sa.String(500), nullable=True),
        sa.Column('role', sa.Enum('admin', 'editor', 'user', name='user_role'), nullable=False, server_default='user'),
        sa.Column('phone_encrypted', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('active', 'banned', name='user_status'), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Create child_participants table
    op.create_table(
        'child_participants',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('child_name', sa.Text(), nullable=False),  # Now encrypted
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('guardian_name', sa.Text(), nullable=False),  # Now encrypted
        sa.Column('guardian_phone_encrypted', sa.Text(), nullable=True),
        sa.Column('guardian_email_encrypted', sa.Text(), nullable=True),
        sa.Column('region', sa.String(200), nullable=True),
        sa.Column('school', sa.String(200), nullable=True),
        sa.Column('consent_given', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('consent_date', sa.DateTime(), nullable=True),
        sa.Column('artwork_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('status', sa.Enum('active', 'withdrawn', 'pending_review', name='child_status'), nullable=False, server_default='pending_review'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create campaigns table
    op.create_table(
        'campaigns',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('cover_image', sa.String(500), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('goal_amount', sa.DECIMAL(12, 2), nullable=False),
        sa.Column('current_amount', sa.DECIMAL(12, 2), nullable=False, server_default=sa.text('0')),
        sa.Column('status', sa.Enum('draft', 'active', 'completed', 'cancelled', name='campaign_status'), nullable=False, server_default='draft'),
        sa.Column('participant_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('artwork_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create artworks table
    op.create_table(
        'artworks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=False),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('child_participant_id', sa.Integer(), nullable=True),
        sa.Column('artist_name', sa.String(100), nullable=False),
        sa.Column('status', sa.Enum('draft', 'pending', 'approved', 'rejected', 'featured', name='artwork_status'), nullable=False, server_default='draft'),
        sa.Column('like_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('campaign_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_artworks_child_participant_id', 'artworks', ['child_participant_id'])
    op.create_index('ix_artworks_campaign_id', 'artworks', ['campaign_id'])

    # Create donations table
    op.create_table(
        'donations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('donor_name', sa.String(100), nullable=False),
        sa.Column('donor_user_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.DECIMAL(12, 2), nullable=False),
        sa.Column('currency', sa.Enum('CNY', 'USD', name='donation_currency'), nullable=False, server_default='CNY'),
        sa.Column('payment_method', sa.Enum('wechat', 'alipay', 'stripe', 'paypal', name='payment_method'), nullable=False),
        sa.Column('payment_id', sa.String(200), nullable=True),
        sa.Column('campaign_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'completed', 'failed', 'refunded', name='donation_status'), nullable=False, server_default='pending'),
        sa.Column('is_anonymous', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_donations_donor_user_id', 'donations', ['donor_user_id'])
    op.create_index('ix_donations_campaign_id', 'donations', ['campaign_id'])

    # Create products table
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.DECIMAL(12, 2), nullable=False),
        sa.Column('currency', sa.Enum('CNY', 'USD', name='product_currency'), nullable=False, server_default='CNY'),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('stock', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('status', sa.Enum('active', 'inactive', name='product_status'), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('order_no', sa.String(50), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('total_amount', sa.DECIMAL(12, 2), nullable=False),
        sa.Column('currency', sa.Enum('CNY', 'USD', name='order_currency'), nullable=False, server_default='CNY'),
        sa.Column('status', sa.Enum('pending', 'paid', 'shipped', 'completed', 'cancelled', name='order_status'), nullable=False, server_default='pending'),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('payment_id', sa.String(200), nullable=True),
        sa.Column('shipping_address', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_no')
    )
    op.create_index('ix_orders_user_id', 'orders', ['user_id'])

    # Create order_items table
    op.create_table(
        'order_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('price', sa.DECIMAL(12, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_order_items_order_id', 'order_items', ['order_id'])
    op.create_index('ix_order_items_product_id', 'order_items', ['product_id'])

    # Create supply_chain_records table
    op.create_table(
        'supply_chain_records',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('artwork_id', sa.Integer(), nullable=False),
        sa.Column('stage', sa.String(100), nullable=False),
        sa.Column('location', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('verifier_name', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_supply_chain_records_artwork_id', 'supply_chain_records', ['artwork_id'])

    # Create payment_transactions table
    op.create_table(
        'payment_transactions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('transaction_id', sa.String(100), nullable=False),
        sa.Column('payment_id', sa.String(200), nullable=True),
        sa.Column('amount', sa.DECIMAL(12, 2), nullable=False),
        sa.Column('currency', sa.Enum('CNY', 'USD', name='payment_currency'), nullable=False, server_default='CNY'),
        sa.Column('method', sa.String(50), nullable=False),
        sa.Column('status', sa.Enum('pending', 'completed', 'failed', 'refunded', name='payment_status'), nullable=False, server_default='pending'),
        sa.Column('gateway_response', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transaction_id')
    )

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=True),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('ix_audit_logs_created_at', table_name='audit_logs')
    op.drop_index('ix_audit_logs_user_id', table_name='audit_logs')
    op.drop_table('audit_logs')

    op.drop_table('payment_transactions')

    op.drop_index('ix_supply_chain_records_artwork_id', table_name='supply_chain_records')
    op.drop_table('supply_chain_records')

    op.drop_index('ix_order_items_product_id', table_name='order_items')
    op.drop_index('ix_order_items_order_id', table_name='order_items')
    op.drop_table('order_items')

    op.drop_index('ix_orders_user_id', table_name='orders')
    op.drop_table('orders')

    op.drop_table('products')

    op.drop_index('ix_donations_campaign_id', table_name='donations')
    op.drop_index('ix_donations_donor_user_id', table_name='donations')
    op.drop_table('donations')

    op.drop_index('ix_artworks_campaign_id', table_name='artworks')
    op.drop_index('ix_artworks_child_participant_id', table_name='artworks')
    op.drop_table('artworks')

    op.drop_table('campaigns')

    op.drop_table('child_participants')

    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
