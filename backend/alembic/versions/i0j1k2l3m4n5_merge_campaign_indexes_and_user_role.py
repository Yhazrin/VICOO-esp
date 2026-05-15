"""merge heads: campaign indexes branch + users.role enum branch

Revision ID: i0j1k2l3m4n5
Revises: a3b4c5d6e7f8, h1a2b3c4d5e6
Create Date: 2026-05-15

"""
from typing import Sequence, Union


revision: str = "i0j1k2l3m4n5"
down_revision: Union[str, Sequence[str], None] = ("a3b4c5d6e7f8", "h1a2b3c4d5e6")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
