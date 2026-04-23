"""Add optional English fields for product name, description, trace story.

Revision ID: e1f2a3b4c5d6
Revises: d9e8f1a2b3c4
Create Date: 2026-04-23
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, None] = "d9e8f1a2b3c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("products")}
    if "name_en" not in cols:
        op.add_column("products", sa.Column("name_en", sa.String(300), nullable=True))
    if "description_en" not in cols:
        op.add_column("products", sa.Column("description_en", sa.Text(), nullable=True))
    if "trace_story_title_en" not in cols:
        op.add_column("products", sa.Column("trace_story_title_en", sa.String(300), nullable=True))
    if "trace_story_content_en" not in cols:
        op.add_column("products", sa.Column("trace_story_content_en", sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("products")}
    if "trace_story_content_en" in cols:
        op.drop_column("products", "trace_story_content_en")
    if "trace_story_title_en" in cols:
        op.drop_column("products", "trace_story_title_en")
    if "description_en" in cols:
        op.drop_column("products", "description_en")
    if "name_en" in cols:
        op.drop_column("products", "name_en")
