"""Backfill trace_story_title_en and trace_story_content_en for impact products.

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
"""

from alembic import op
import sqlalchemy as sa

revision = "l2m3n4o5p6q7"
down_revision = "k1l2m3n4o5p6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    updates = {
        "彩虹鱼棉质 T 恤": (
            "From Chinese Cotton Fields to Tokyo Displays",
            "This impact tee features certified cotton from Aksu, Xinjiang as its primary material. Spinning, weaving, and printing are completed in China, then distributed through Tokyo co-label channels for charitable outreach—creating a fully traceable story from origin to destination.",
        ),
        "星星之夜帆布托特包": (
            "Global Cotton, Local Reinvention",
            "This product blends globally certified cotton with recycled fibres. The primary batch comes from Mato Grosso, Brazil and Texas, USA, then undergoes local reprocessing in China before entering the impact channel—reducing virgin material dependence.",
        ),
        "春天的花园丝巾": (
            "Children's Art Seen in Tokyo",
            "The scarf pattern is sourced from a Chinese village child's painting. Fabric production takes place in China, while Tokyo serves as the brand showcase and co-label launch node—bringing the impact story into Asian urban consumer spaces.",
        ),
        "妈妈的手棉麻衬衫": (
            "Natural Fibres, Traceable Warmth",
            "This cotton-linen shirt uses natural cotton-linen blend from Shandong's certified cooperatives. Raw materials are traceable to local farming communities, supporting stable income growth while ensuring fabric transparency and sustainability.",
        ),
        "太空旅行圆领卫衣": (
            "Kids' Space Art, Traceable Craft",
            "This crewneck fleece features children's space doodle prints on Shaoxing-sourced premium cotton yarn. The full Shaoxing dyeing and quality inspection process is fully documented, with every unit traceable to its production batch and eco-certifications.",
        ),
        "我的家帆布鞋": (
            "Hometown Colours on Your Feet",
            "The shoe upper uses organic cotton canvas from Shandong certified organic farms. Biodegradable outsole materials come from renewable resources—the entire material stack is traceable, letting the child's artwork accompany every step.",
        ),
        "未来城市连帽卫衣": (
            "Sustainable Cotton and Future Creativity",
            "This hoodie blends sustainably certified cotton from Texas, USA with recycled polyester, manufactured in China before entering the impact channel—delivering quality while reducing environmental footprint.",
        ),
        "过年了针织开衫": (
            "Traditional Craft, Children's Joy Renewed",
            "This cardigan uses traditional knitting techniques from Dingxi, Gansu workshops with traceable wool and recycled fibres. Patterns are sourced from children's festival paintings, and partner workshops provide skills training and fair employment opportunities.",
        ),
        "海豚之歌再生纤维披肩": (
            "Ocean Dreams, Regenerative Journey",
            "This stole features an ocean-theme print from a child's painting. The recycled polyester and organic cotton blend is traceable to Brazilian recycled-cotton farms. 28% of each unit's revenue funds art education programmes for rural children.",
        ),
        "牧羊曲手绘方巾": (
            "Gansu Craft, Childlike Heart",
            "This bandana features a shepherd painting by a child from Dingxi, Gansu. Organic cotton fabric is hand-printed at Dingxi workshops—fully traceable. Each piece carries a rural child's imagination alongside local artisan heritage.",
        ),
    }

    for name, (title_en, content_en) in updates.items():
        # Escape single quotes in strings for SQL
        title_en_escaped = title_en.replace("'", "''")
        content_en_escaped = content_en.replace("'", "''")
        name_escaped = name.replace("'", "''")
        op.execute(
            sa.text(
                f"UPDATE products SET trace_story_title_en = '{title_en_escaped}', trace_story_content_en = '{content_en_escaped}' WHERE name = '{name_escaped}'"
            )
        )


def downgrade() -> None:
    op.execute(sa.text("UPDATE products SET trace_story_title_en = NULL, trace_story_content_en = NULL"))