"""Expand users.role ENUM with guardian, compliance (align ORM / API).

Revision ID: h1a2b3c4d5e6
Revises: g9f0e1d2c3b4
Create Date: 2026-05-14

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "h1a2b3c4d5e6"
down_revision: Union[str, None] = "g9f0e1d2c3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "mysql":
        return
    row = bind.execute(
        text(
            "SELECT COLUMN_TYPE FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'"
        )
    ).fetchone()
    col_type = (row[0] or "") if row else ""
    if "guardian" in col_type and "compliance" in col_type:
        return
    op.execute(
        text(
            "ALTER TABLE users MODIFY COLUMN role "
            "ENUM('admin','editor','user','guardian','compliance') NOT NULL DEFAULT 'user'"
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "mysql":
        return
    op.execute(
        text(
            "ALTER TABLE users MODIFY COLUMN role "
            "ENUM('admin','editor','user') NOT NULL DEFAULT 'user'"
        )
    )
