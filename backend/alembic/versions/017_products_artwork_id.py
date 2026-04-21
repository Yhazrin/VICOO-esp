"""Add products.artwork_id (ORM had column; some DBs never got a migration).

Revision ID: c7f8a1b2e3d4
Revises: b2c3d4e5f6a7
Create Date: 2026-04-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "c7f8a1b2e3d4"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("products")}
    if "artwork_id" in cols:
        return
    op.add_column("products", sa.Column("artwork_id", sa.Integer(), nullable=True))
    op.create_index("ix_products_artwork_id", "products", ["artwork_id"], unique=False)
    op.create_foreign_key(
        "fk_products_artwork_id",
        "products",
        "artworks",
        ["artwork_id"],
        ["id"],
    )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("products")}
    if "artwork_id" not in cols:
        return
    op.drop_constraint("fk_products_artwork_id", "products", type_="foreignkey")
    op.drop_index("ix_products_artwork_id", table_name="products")
    op.drop_column("products", "artwork_id")
