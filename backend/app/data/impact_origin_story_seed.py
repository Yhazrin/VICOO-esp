from __future__ import annotations

ORIGIN_COUNTRIES = [
    {"code": "CN", "name_zh": "中国", "name_en": "China"},
    {"code": "JP", "name_zh": "日本", "name_en": "Japan"},
    {"code": "GLOBAL", "name_zh": "全球", "name_en": "Global"},
]

ORIGIN_REGIONS = [
    {"country_code": "CN", "name_zh": "新疆阿克苏", "name_en": "Aksu, Xinjiang", "region_type": "cotton_origin"},
    {"country_code": "CN", "name_zh": "山东", "name_en": "Shandong", "region_type": "cotton_origin"},
    {"country_code": "CN", "name_zh": "浙江绍兴", "name_en": "Shaoxing, Zhejiang", "region_type": "processing"},
    {"country_code": "JP", "name_zh": "东京", "name_en": "Tokyo", "region_type": "brand_hub"},
    {"country_code": "GLOBAL", "name_zh": "巴西马托格罗索", "name_en": "Mato Grosso, Brazil", "region_type": "global_cotton"},
    {"country_code": "GLOBAL", "name_zh": "美国得州", "name_en": "Texas, USA", "region_type": "global_cotton"},
    {"country_code": "GLOBAL", "name_zh": "印度古吉拉特", "name_en": "Gujarat, India", "region_type": "global_cotton"},
]

IMPACT_TRACE_STORY_BY_NAME = {
    "彩虹鱼棉质 T 恤": {
        "country_code": "CN",
        "region_name_zh": "新疆阿克苏",
        "title": "从中国棉田到东京展柜",
        "content": "这件公益 T 恤以新疆阿克苏认证棉花为主要原料，在中国完成纺纱、织造与印花，再通过东京联名渠道做公益传播，形成“产地可追溯、去向可解释”的完整故事线。",
    },
    "星星之夜帆布袋": {
        "country_code": "GLOBAL",
        "region_name_zh": "巴西马托格罗索",
        "title": "全球棉源与在地再造",
        "content": "产品采用全球认证棉花与再生纤维混纺，主要批次来自巴西马托格罗索与美国得州，经过中国本地再造工艺后进入公益渠道，减少一次性原料依赖。",
    },
    "春天的花园丝巾": {
        "country_code": "JP",
        "region_name_zh": "东京",
        "title": "儿童艺术在东京被看见",
        "content": "丝巾图案源自中国乡村儿童画作，面料在中国完成生产，东京作为品牌展示与联名发布节点，让公益故事在亚洲都市消费场景中被更多人看见。",
    },
}


DEFAULT_IMPACT_TRACE_STORY = {
    "country_code": "CN",
    "region_name_zh": "山东",
    "title": "中国棉花与全球公益协作",
    "content": "该公益商品以中国棉花供应链为主线，并参考日本品牌协作经验与全球棉花来源框架，构建可持续、可叙述的虚拟溯源故事，用于公益传播与后续 AI 筛选。",
}
