"""
Canonical demo artwork catalog (20 items).

Image URLs use picsum.photos (external, always reachable).
If local static files are placed under backend/static/artworks/,
seed_artwork_assets.py will override these to /static/artworks/ paths on startup.

Order matches mock list in app.routers.artworks and app.seed artwork_data.
"""

from __future__ import annotations

from typing import Any

ARTWORK_COUNT = 20
# Keep local prefix for seed_artwork_assets.py compatibility
ARTWORK_STATIC_PREFIX = "/static/artworks/artwork_"
ARTWORK_THUMB_PREFIX = "/static/artworks/thumb_"


def artwork_image_url(seq: int) -> str:
    return f"https://picsum.photos/seed/vicoo-art-{seq}/900/900"


def artwork_thumb_url(seq: int) -> str:
    return f"https://picsum.photos/seed/vicoo-art-{seq}/400/400"


# child_index: index into seed child_participants list (0–9)
# campaign_index: index into seed campaigns (0–7), or None
ARTWORK_CATALOG: list[dict[str, Any]] = [
    {
        "seq": 1,
        "title": "春天的花园",
        "description": "用蜡笔描绘的五彩花园",
        "artist_name": "小明",
        "status": "approved",
        "like_count": 128,
        "view_count": 560,
        "child_index": 0,
        "campaign_index": 0,
    },
    {
        "seq": 2,
        "title": "彩虹鱼",
        "description": "水彩画出的深海彩虹鱼",
        "artist_name": "小红",
        "status": "approved",
        "like_count": 95,
        "view_count": 430,
        "child_index": 1,
        "campaign_index": 0,
    },
    {
        "seq": 3,
        "title": "我的家",
        "description": "温暖的家，有爸爸妈妈和小狗",
        "artist_name": "小丽",
        "status": "approved",
        "like_count": 210,
        "view_count": 890,
        "child_index": 2,
        "campaign_index": 1,
    },
    {
        "seq": 4,
        "title": "星星之夜",
        "description": "梵高风格的星空临摹",
        "artist_name": "小刚",
        "status": "featured",
        "like_count": 350,
        "view_count": 1200,
        "child_index": 3,
        "campaign_index": 0,
    },
    {
        "seq": 5,
        "title": "山间小溪",
        "description": "写生画：家乡的小溪",
        "artist_name": "小芳",
        "status": "approved",
        "like_count": 78,
        "view_count": 320,
        "child_index": 5,
        "campaign_index": 1,
    },
    {
        "seq": 6,
        "title": "小猫咪",
        "description": "我的第一只猫咪朋友",
        "artist_name": "小杰",
        "status": "approved",
        "like_count": 160,
        "view_count": 670,
        "child_index": 6,
        "campaign_index": 2,
    },
    {
        "seq": 7,
        "title": "丰收的秋天",
        "description": "金黄色的稻田和农民伯伯",
        "artist_name": "小雨",
        "status": "pending",
        "like_count": 45,
        "view_count": 180,
        "child_index": 4,
        "campaign_index": None,
    },
    {
        "seq": 8,
        "title": "雪人一家",
        "description": "冬天堆的雪人全家福",
        "artist_name": "小雪",
        "status": "approved",
        "like_count": 190,
        "view_count": 780,
        "child_index": 7,
        "campaign_index": 0,
    },
    {
        "seq": 9,
        "title": "海豚之歌",
        "description": "蓝色大海中跳跃的海豚",
        "artist_name": "小海",
        "status": "approved",
        "like_count": 130,
        "view_count": 520,
        "child_index": 8,
        "campaign_index": 1,
    },
    {
        "seq": 10,
        "title": "老房子",
        "description": "记录村里即将拆除的老房子",
        "artist_name": "小明",
        "status": "approved",
        "like_count": 88,
        "view_count": 390,
        "child_index": 0,
        "campaign_index": 2,
    },
    {
        "seq": 11,
        "title": "妈妈的手",
        "description": "画妈妈做家务的双手",
        "artist_name": "小花",
        "status": "featured",
        "like_count": 280,
        "view_count": 1050,
        "child_index": 9,
        "campaign_index": 0,
    },
    {
        "seq": 12,
        "title": "夏日池塘",
        "description": "荷叶上的青蛙和蜻蜓",
        "artist_name": "小丽",
        "status": "approved",
        "like_count": 105,
        "view_count": 440,
        "child_index": 2,
        "campaign_index": 1,
    },
    {
        "seq": 13,
        "title": "我的梦想",
        "description": "穿上白大褂当医生",
        "artist_name": "小红",
        "status": "approved",
        "like_count": 175,
        "view_count": 710,
        "child_index": 1,
        "campaign_index": 2,
    },
    {
        "seq": 14,
        "title": "田野之歌",
        "description": "风吹麦浪的田野",
        "artist_name": "小明",
        "status": "approved",
        "like_count": 62,
        "view_count": 290,
        "child_index": 0,
        "campaign_index": None,
    },
    {
        "seq": 15,
        "title": "太空旅行",
        "description": "坐火箭去月球",
        "artist_name": "小刚",
        "status": "approved",
        "like_count": 140,
        "view_count": 580,
        "child_index": 3,
        "campaign_index": 0,
    },
    {
        "seq": 16,
        "title": "好朋友",
        "description": "和朋友们在操场上玩",
        "artist_name": "小雨",
        "status": "pending",
        "like_count": 30,
        "view_count": 120,
        "child_index": 4,
        "campaign_index": None,
    },
    {
        "seq": 17,
        "title": "雨后彩虹",
        "description": "暴雨过后的双彩虹",
        "artist_name": "小丽",
        "status": "approved",
        "like_count": 92,
        "view_count": 410,
        "child_index": 2,
        "campaign_index": 1,
    },
    {
        "seq": 18,
        "title": "过年了",
        "description": "放鞭炮贴春联的热闹场面",
        "artist_name": "小雪",
        "status": "approved",
        "like_count": 220,
        "view_count": 900,
        "child_index": 7,
        "campaign_index": 2,
    },
    {
        "seq": 19,
        "title": "未来城市",
        "description": "飞行汽车和太阳能大楼",
        "artist_name": "小海",
        "status": "approved",
        "like_count": 115,
        "view_count": 470,
        "child_index": 8,
        "campaign_index": 0,
    },
    {
        "seq": 20,
        "title": "牧羊曲",
        "description": "草原上的小牧童和羊群",
        "artist_name": "小芳",
        "status": "approved",
        "like_count": 85,
        "view_count": 350,
        "child_index": 5,
        "campaign_index": 1,
    },
]

ARTWORK_TITLES_ZH = {row["title"] for row in ARTWORK_CATALOG}
