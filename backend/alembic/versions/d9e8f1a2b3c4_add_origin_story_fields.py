"""Add origin dictionaries and product trace story fields.

Revision ID: d9e8f1a2b3c4
Revises: c7f8a1b2e3d4
Create Date: 2026-04-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "d9e8f1a2b3c4"
down_revision: Union[str, None] = "c7f8a1b2e3d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(table_name: str) -> bool:
    bind = op.get_bind()
    return inspect(bind).has_table(table_name)


def _column_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    insp = inspect(bind)
    return {c["name"] for c in insp.get_columns(table_name)}


def _index_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    insp = inspect(bind)
    return {i["name"] for i in insp.get_indexes(table_name)}


def _fk_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    insp = inspect(bind)
    return {fk["name"] for fk in insp.get_foreign_keys(table_name) if fk.get("name")}


def upgrade() -> None:
    if not _has_table("countries"):
        op.create_table(
            "countries",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("code", sa.String(length=8), nullable=False),
            sa.Column("name_zh", sa.String(length=100), nullable=False),
            sa.Column("name_en", sa.String(length=100), nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        )
    if "ix_countries_code" not in _index_names("countries"):
        op.create_index("ix_countries_code", "countries", ["code"], unique=True)

    if not _has_table("regions"):
        op.create_table(
            "regions",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("country_id", sa.Integer(), nullable=False),
            sa.Column("name_zh", sa.String(length=120), nullable=False),
            sa.Column("name_en", sa.String(length=120), nullable=False),
            sa.Column("region_type", sa.String(length=50), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        )
    if "ix_regions_country_id" not in _index_names("regions"):
        op.create_index("ix_regions_country_id", "regions", ["country_id"], unique=False)
    if "fk_regions_country_id" not in _fk_names("regions"):
        op.create_foreign_key(
            "fk_regions_country_id",
            "regions",
            "countries",
            ["country_id"],
            ["id"],
        )

    cols = _column_names("products")
    if "origin_country_id" not in cols:
        op.add_column("products", sa.Column("origin_country_id", sa.Integer(), nullable=True))
    if "origin_region_id" not in cols:
        op.add_column("products", sa.Column("origin_region_id", sa.Integer(), nullable=True))
    if "trace_story_title" not in cols:
        op.add_column("products", sa.Column("trace_story_title", sa.String(length=300), nullable=True))
    if "trace_story_content" not in cols:
        op.add_column("products", sa.Column("trace_story_content", sa.Text(), nullable=True))

    idx_names = _index_names("products")
    if "ix_products_origin_country_id" not in idx_names:
        op.create_index("ix_products_origin_country_id", "products", ["origin_country_id"], unique=False)
    if "ix_products_origin_region_id" not in idx_names:
        op.create_index("ix_products_origin_region_id", "products", ["origin_region_id"], unique=False)

    fk_names = _fk_names("products")
    if "fk_products_origin_country_id" not in fk_names:
        op.create_foreign_key(
            "fk_products_origin_country_id",
            "products",
            "countries",
            ["origin_country_id"],
            ["id"],
        )
    if "fk_products_origin_region_id" not in fk_names:
        op.create_foreign_key(
            "fk_products_origin_region_id",
            "products",
            "regions",
            ["origin_region_id"],
            ["id"],
        )


def downgrade() -> None:
    if _has_table("products"):
        fk_names = _fk_names("products")
        if "fk_products_origin_region_id" in fk_names:
            op.drop_constraint("fk_products_origin_region_id", "products", type_="foreignkey")
        if "fk_products_origin_country_id" in fk_names:
            op.drop_constraint("fk_products_origin_country_id", "products", type_="foreignkey")

        idx_names = _index_names("products")
        if "ix_products_origin_region_id" in idx_names:
            op.drop_index("ix_products_origin_region_id", table_name="products")
        if "ix_products_origin_country_id" in idx_names:
            op.drop_index("ix_products_origin_country_id", table_name="products")

        cols = _column_names("products")
        if "trace_story_content" in cols:
            op.drop_column("products", "trace_story_content")
        if "trace_story_title" in cols:
            op.drop_column("products", "trace_story_title")
        if "origin_region_id" in cols:
            op.drop_column("products", "origin_region_id")
        if "origin_country_id" in cols:
            op.drop_column("products", "origin_country_id")

    if _has_table("regions"):
        fk_names = _fk_names("regions")
        if "fk_regions_country_id" in fk_names:
            op.drop_constraint("fk_regions_country_id", "regions", type_="foreignkey")
        if "ix_regions_country_id" in _index_names("regions"):
            op.drop_index("ix_regions_country_id", table_name="regions")
        op.drop_table("regions")

    if _has_table("countries"):
        if "ix_countries_code" in _index_names("countries"):
            op.drop_index("ix_countries_code", table_name="countries")
        op.drop_table("countries")
