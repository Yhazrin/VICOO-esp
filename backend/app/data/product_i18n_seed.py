"""Optional English copy for products keyed by primary (usually zh-CN) `name`.

Used by `backfill_product_i18n` and to enrich DEMO_MODE mock dicts. Unknown names keep API field null; front-end falls back to `name` / `description`.
"""

from __future__ import annotations

# Keys must match Product.name in DB / seed exactly.
PRODUCT_I18N_BY_NAME_ZH: dict[str, dict[str, str]] = {
    "彩虹鱼棉质 T 恤": {
        "name_en": "Rainbow Fish Organic Cotton Tee",
        "description_en": "GOTS-style organic cotton printed with the award-winning \"Rainbow Fish\" artwork. 30% of each tee supports rural art education.",
        "trace_story_title_en": "From Xinjiang cotton fields to a Tokyo display",
        "trace_story_content_en": "The tee's cotton is chiefly sourced from certified Aksu, Xinjiang, blended with traceable global cotton. Spinning and weaving finish in East China, then the piece enters a transparent co-label path in Tokyo.",
    },
    "星星之夜帆布托特包": {
        "name_en": "Starry Night Canvas Tote",
        "description_en": "GRS-certified recycled cotton canvas printed with the \"Starry Night\" painting. Traceable materials, everyday carry.",
        "trace_story_title_en": "A second life for global cotton",
        "trace_story_content_en": "The tote uses traceable cotton blended with recycled fibre, with notable batches from Mato Grosso, Brazil, and Texas, USA. Local remanufacturing in China shortens the chain and lowers the footprint for the charity line.",
    },
    "春天的花园丝巾": {
        "name_en": "Spring Garden Silk Scarf",
        "description_en": "Pure silk; each child's painting becomes a unique scarf pattern.",
        "trace_story_title_en": "Children's art seen in Tokyo",
        "trace_story_content_en": "The print comes from children's work in rural China, fabric is finished domestically, and Tokyo is the hub for co-branding\u2014placing the welfare story in a modern Asian retail context.",
    },
    "妈妈的手棉麻衬衫": {
        "name_en": "\"Mother's Hands\" Cotton-Linen Shirt",
        "description_en": "Natural cotton-linen blend with hand-drawn line art embroidery-style print from the award-winning \"Mother's Hands\" artwork. Traceable natural fibre origins.",
    },
    "太空旅行圆领卫衣": {
        "name_en": "\"Space Travel\" Crewneck Sweatshirt",
        "description_en": "Mid-weight fleece with all-over kids' space doodle print from \"Space Travel\". A gift for every dreamer who looks up.",
    },
    "我的家帆布鞋": {
        "name_en": "\"My Home\" Canvas Sneakers",
        "description_en": "Organic cotton uppers, biodegradable outsole, \"My Home\" on the side.",
    },
    "未来城市连帽卫衣": {
        "name_en": "\"Future City\" Hooded Sweatshirt",
        "description_en": "Fleece-lined hoodie with full-back kids' hand-drawn \"Future City\" print. A co-label piece for autumn/winter.",
    },
    "过年了针织开衫": {
        "name_en": "\"Spring Festival\" Knit Cardigan",
        "description_en": "Traceable wool & recycled fibre blend cardigan with kids' festival painting jacquard-knit motif. Warm, wearable welfare.",
    },
    "海豚之歌再生纤维披肩": {
        "name_en": "\"Song of the Dolphin\" Recycled-Fibre Stole",
        "description_en": "Ocean-theme print, recycled poly blended with organic cotton; 28% to the \"Spring Colours\" art fund.",
    },
    "牧羊曲手绘方巾": {
        "name_en": "\"Shepherd's Melody\" Hand-Drawn Bandana",
        "description_en": "Kids' pastoral painting turned into a wearable bandana. Organic cotton, hand-printed in Dingxi, Gansu. 22% to rural art supplies.",
    },
    # —— 常规店（中文品名见 default_regular_products） ——
    "男士轻盈便携保暖外套": {
        "name_en": "Men's Light Packable Warm Jacket",
        "description_en": "High-loft fill, DWR shell, packs small\u2014commutes and travel without bulk (light down\u2013style).",
    },
    "女装凉感速干圆领T恤": {
        "name_en": "Women's Cool & Dry Crew Tee",
        "description_en": "Breathable knit, quick-dry, cool touch\u2014layer or wear on its own (dry-tech tee style).",
    },
    "高性能弹力束脚慢跑裤": {
        "name_en": "High-Stretch Tapered Jogger",
        "description_en": "Four-way stretch, drawstring waist, slim cuff\u2014one pair from commute to light sport.",
    },
    "美利奴混纺圆领针织衫": {
        "name_en": "Merino Blend Crew Knit",
        "description_en": "Merino-cotton blend, machine-washable\u2014spring solo or winter layer.",
    },
    "拉链式连帽休闲卫衣": {
        "name_en": "Full-Zip Hooded Fleece",
        "description_en": "Light brushed interior, full zip for layering\u2014cycling and weekend walks.",
    },
    "经典窄口直筒牛仔裤": {
        "name_en": "Slim-Straight Denim",
        "description_en": "Medium-stretch, narrow straight leg; natural wash, durable shape.",
    },
    "长绒摇粒绒拉链外套": {
        "name_en": "Long-Pile Fleece Zip Jacket",
        "description_en": "Double-sided pile for warmth, stand collar\u2014home or light trail (fleece mid-layer style).",
    },
    "防泼水连帽功能风衣": {
        "name_en": "DWR Packable Parka",
        "description_en": "Light nylon shell, DWR, adjustable hood\u2014packs small for rain and wind.",
    },
    "女式高腰针织直筒半裙": {
        "name_en": "Women's High-Rise Knit Pencil Skirt",
        "description_en": "Ribbed knit drape, high waist straight silhouette\u2014pairs with cool tees or knits.",
    },
    "免烫通勤弹力卡其裤": {
        "name_en": "Non-Iron Stretch Chino",
        "description_en": "Mid rise straight, wrinkle-resistant\u2014office to weekend.",
    },
}
