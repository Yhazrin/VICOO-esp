"""merge migration heads

Revision ID: s9t0u1v2w3x4
Revises: r8s9t0u1v2w3, l3m4n5o6p7q8
Create Date: 2026-06-10

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 's9t0u1v2w3x4'
down_revision: Union[str, Sequence[str], None] = ('r8s9t0u1v2w3', 'l3m4n5o6p7q8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
