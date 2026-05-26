"""
公益商店 SKU 主图 URL。

图片存放在 backend/static/products/，由 FastAPI StaticFiles 挂载至 /static/products/。
键与 Product.name / seed.py 完全一致。
"""

IMPACT_PRODUCT_IMAGE_BY_NAME: dict[str, str] = {
    "彩虹鱼棉质 T 恤": "/static/products/rainbow-fish-tee.jpg",
    "星星之夜帆布托特包": "/static/products/starry-night-tote.jpg",
    "春天的花园丝巾": "/static/products/spring-garden-scarf.jpg",
    "妈妈的手棉麻衬衫": "/static/products/mothers-hands-shirt.jpg",
    "太空旅行圆领卫衣": "/static/products/space-travel-sweatshirt.jpg",
    "我的家帆布鞋": "/static/products/my-home-sneaker.jpg",
    "未来城市连帽卫衣": "/static/products/future-city-hoodie.jpg",
    "过年了针织开衫": "/static/products/festival-knit-cardigan.jpg",
    "海豚之歌再生纤维披肩": "/static/products/dolphin-song-shawl.jpg",
    "牧羊曲手绘方巾": "/static/products/shepherd-melody-bandana.jpg",
}
