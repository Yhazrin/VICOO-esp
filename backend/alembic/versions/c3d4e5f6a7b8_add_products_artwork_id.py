"""Add missing products.artwork_id column for artwork linkage.

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = {c["name"] for c in inspector.get_columns("products")}
    if "artwork_id" not in columns:
        op.add_column("products", sa.Column("artwork_id", sa.Integer(), nullable=True))

    indexes = {ix["name"] for ix in inspector.get_indexes("products")}
    if "ix_products_artwork_id" not in indexes:
        op.create_index("ix_products_artwork_id", "products", ["artwork_id"], unique=False)

    fks = inspector.get_foreign_keys("products")
    has_artwork_fk = any(fk.get("constrained_columns") == ["artwork_id"] for fk in fks)
    if not has_artwork_fk:
        op.create_foreign_key(
            "fk_products_artwork_id_artworks",
            "products",
            "artworks",
            ["artwork_id"],
            ["id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    fks = inspector.get_foreign_keys("products")
    for fk in fks:
        if fk.get("constrained_columns") == ["artwork_id"] and fk.get("name"):
            op.drop_constraint(fk["name"], "products", type_="foreignkey")

    indexes = {ix["name"] for ix in inspector.get_indexes("products")}
    if "ix_products_artwork_id" in indexes:
        op.drop_index("ix_products_artwork_id", table_name="products")

    columns = {c["name"] for c in inspector.get_columns("products")}
    if "artwork_id" in columns:
        op.drop_column("products", "artwork_id")
