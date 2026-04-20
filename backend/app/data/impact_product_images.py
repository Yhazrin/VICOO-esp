"""
公益商店 SKU 主图 URL。

使用 Picsum Lorem（https://picsum.photos）固定 seed —— 真实摄影图、HTTPS、多数网络可直连。
此前使用的 images.unsplash.com 在部分网络环境下无法加载，导致前端长期停在骨架屏。
"""

# 键与 Product.name / seed.py / mock 完全一致
IMPACT_PRODUCT_IMAGE_BY_NAME: dict[str, str] = {
    "彩虹鱼棉质 T 恤": "https://picsum.photos/seed/vicoo-impact-tshirt/900/1200",
    "星星之夜帆布袋": "https://picsum.photos/seed/vicoo-impact-tote/900/1200",
    "春天的花园丝巾": "https://picsum.photos/seed/vicoo-impact-scarf/900/1200",
    "妈妈的手环保笔记本": "https://picsum.photos/seed/vicoo-impact-notebook/900/1200",
    "太空旅行马克杯": "https://picsum.photos/seed/vicoo-impact-mug/900/1200",
    "我的家帆布鞋": "https://picsum.photos/seed/vicoo-impact-sneaker/900/1200",
    "画出未来环保抱枕": "https://picsum.photos/seed/vicoo-impact-pillow/900/1200",
    "过年了限定礼盒": "https://picsum.photos/seed/vicoo-impact-giftbox/900/1200",
    "海豚之歌·再生纤维披肩": "https://picsum.photos/seed/vicoo-impact-shawl/900/1200",
    "牧羊曲·手工拼布壁挂": "https://picsum.photos/seed/vicoo-impact-tapestry/900/1200",
}
