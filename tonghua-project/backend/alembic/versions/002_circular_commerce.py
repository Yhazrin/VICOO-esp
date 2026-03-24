"""Add circular_commerce: clothing_intakes, product_reviews, after_sale_tickets; extend products and orders

Revision ID: 002
Revises: 001
Create Date: 2026-03-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create clothing_intakes table
    op.create_table(
        "clothing_intakes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("summary", sa.String(500), nullable=False),
        sa.Column("garment_types", sa.String(300), nullable=True),
        sa.Column("quantity_estimate", sa.Integer(), server_default="1", nullable=False),
        sa.Column("condition_notes", sa.Text(), nullable=True),
        sa.Column("pickup_address", sa.Text(), nullable=True),
        sa.Column("contact_phone", sa.String(30), nullable=True),
        sa.Column(
            "status",
            sa.Enum("submitted", "received", "processing", "listed", "rejected", name="clothing_intake_status"),
            server_default="submitted",
            nullable=False,
        ),
        sa.Column("product_id", sa.Integer(), nullable=True),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_clothing_intakes_user_id"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_clothing_intakes_product_id"),
    )
    op.create_index("ix_clothing_intakes_user_id", "clothing_intakes", ["user_id"])
    op.create_index("ix_clothing_intakes_product_id", "clothing_intakes", ["product_id"])
    op.create_index("ix_clothing_intakes_status", "clothing_intakes", ["status"])

    # Create product_reviews table
    op.create_table(
        "product_reviews",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_product_reviews_product_id"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], name="fk_product_reviews_order_id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_product_reviews_user_id"),
        sa.UniqueConstraint("product_id", "user_id", name="uq_review_product_user"),
    )
    op.create_index("ix_product_reviews_product_id", "product_reviews", ["product_id"])
    op.create_index("ix_product_reviews_order_id", "product_reviews", ["order_id"])
    op.create_index("ix_product_reviews_user_id", "product_reviews", ["user_id"])

    # Create after_sale_tickets table
    op.create_table(
        "after_sale_tickets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column(
            "category",
            sa.Enum("return", "exchange", "quality", "logistics", "other", name="after_sale_category"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("open", "in_progress", "resolved", "closed", name="after_sale_status"),
            server_default="open",
            nullable=False,
        ),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_after_sale_tickets_user_id"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], name="fk_after_sale_tickets_order_id"),
    )
    op.create_index("ix_after_sale_tickets_user_id", "after_sale_tickets", ["user_id"])
    op.create_index("ix_after_sale_tickets_order_id", "after_sale_tickets", ["order_id"])
    op.create_index("ix_after_sale_tickets_status", "after_sale_tickets", ["status"])

    # Extend products table: sustainability fields
    op.add_column("products", sa.Column("source_clothing_intake_id", sa.Integer(), nullable=True))
    op.add_column("products", sa.Column("sustainability_score", sa.Numeric(3, 2), nullable=True))
    op.add_column("products", sa.Column("sustainability_details", sa.JSON(), nullable=True))
    op.create_index("ix_products_source_clothing_intake_id", "products", ["source_clothing_intake_id"])

    # Extend orders table: logistics fields
    op.add_column("orders", sa.Column("tracking_number", sa.String(100), nullable=True))
    op.add_column("orders", sa.Column("carrier", sa.String(50), nullable=True))
    op.add_column("orders", sa.Column("logistics_events", sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove orders extensions
    op.drop_column("orders", "logistics_events")
    op.drop_column("orders", "carrier")
    op.drop_column("orders", "tracking_number")

    # Remove products extensions
    op.drop_index("ix_products_source_clothing_intake_id", table_name="products")
    op.drop_column("products", "sustainability_details")
    op.drop_column("products", "sustainability_score")
    op.drop_column("products", "source_clothing_intake_id")

    # Drop after_sale_tickets
    op.drop_index("ix_after_sale_tickets_status", table_name="after_sale_tickets")
    op.drop_index("ix_after_sale_tickets_order_id", table_name="after_sale_tickets")
    op.drop_index("ix_after_sale_tickets_user_id", table_name="after_sale_tickets")
    op.drop_table("after_sale_tickets")

    # Drop product_reviews
    op.drop_index("ix_product_reviews_user_id", table_name="product_reviews")
    op.drop_index("ix_product_reviews_order_id", table_name="product_reviews")
    op.drop_index("ix_product_reviews_product_id", table_name="product_reviews")
    op.drop_table("product_reviews")

    # Drop clothing_intakes
    op.drop_index("ix_clothing_intakes_status", table_name="clothing_intakes")
    op.drop_index("ix_clothing_intakes_product_id", table_name="clothing_intakes")
    op.drop_index("ix_clothing_intakes_user_id", table_name="clothing_intakes")
    op.drop_table("clothing_intakes")
