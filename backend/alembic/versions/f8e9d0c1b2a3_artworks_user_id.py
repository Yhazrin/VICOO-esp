"""Add artworks.user_id (ORM column; migrations never added it).

Revision ID: f8e9d0c1b2a3
Revises: e1f2a3b4c5d6
Create Date: 2026-05-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "f8e9d0c1b2a3"
down_revision: Union[str, None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("artworks")}
    if "user_id" in cols:
        return
    op.add_column("artworks", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_index("ix_artworks_user_id", "artworks", ["user_id"], unique=False)
    op.create_foreign_key(
        "fk_artworks_user_id",
        "artworks",
        "users",
        ["user_id"],
        ["id"],
    )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("artworks")}
    if "user_id" not in cols:
        return
    op.drop_constraint("fk_artworks_user_id", "artworks", type_="foreignkey")
    op.drop_index("ix_artworks_user_id", table_name="artworks")
    op.drop_column("artworks", "user_id")
