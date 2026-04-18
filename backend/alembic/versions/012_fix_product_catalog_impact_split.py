"""Normalize zh product categories and is_impact_product flags for shop split.

Revision ID: 012
Revises: 011
"""

from alembic import op
import sqlalchemy as sa

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name
    if dialect == "postgresql":
        t, f = "true", "false"
    else:
        # sqlite, mysql, mariadb
        t, f = "1", "0"

    for s in (
        "UPDATE products SET category = 'apparel' WHERE category = '服装'",
        "UPDATE products SET category = 'accessories' WHERE category = '配饰'",
        "UPDATE products SET category = 'stationery' WHERE category = '文具'",
        "UPDATE products SET category = 'prints' WHERE category = '印刷'",
        "UPDATE products SET category = 'lifestyle' WHERE category = '生活'",
        "UPDATE products SET category = 'footwear' WHERE category = '鞋履'",
        "UPDATE products SET category = 'home' WHERE category = '家居'",
        "UPDATE products SET category = 'gift_box' WHERE category = '礼盒'",
    ):
        op.execute(sa.text(s))

    op.execute(
        sa.text(
            f"""
            UPDATE products SET is_impact_product = {t} WHERE
              name LIKE '%彩虹鱼%' OR name LIKE '%星星之夜%' OR name LIKE '%春天的花园%'
              OR name LIKE '%妈妈的手%' OR name LIKE '%太空旅行%' OR name LIKE '%我的家帆布鞋%'
              OR name LIKE '%画出未来%' OR name LIKE '%过年了%' OR name LIKE '%海豚之歌%'
              OR name LIKE '%牧羊曲%' OR name LIKE '%再生纤维披肩%' OR name LIKE '%手工拼布壁挂%'
              OR description LIKE '%收益%' OR description LIKE '%捐赠%' OR description LIKE '%美育%'
              OR description LIKE '%获奖作品%' OR description LIKE '%义卖%' OR description LIKE '%印有《%'
            """
        )
    )
    op.execute(
        sa.text(
            f"""
            UPDATE products SET is_impact_product = {f} WHERE
              name LIKE '%Organic Linen%' OR name LIKE '%Recycled Cashmere%'
              OR name LIKE '%Hemp Canvas%' OR name LIKE '%Merino Wool%'
            """
        )
    )


def downgrade() -> None:
    pass
