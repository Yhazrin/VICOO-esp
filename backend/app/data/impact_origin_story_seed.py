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
    “彩虹鱼棉质 T 恤”: {
        “country_code”: “CN”,
        “region_name_zh”: “新疆阿克苏”,
        “title”: “从中国棉田到东京展柜”,
        “content”: “这件公益 T 恤以新疆阿克苏认证棉花为主要原料，在中国完成纺纱、织造与印花，再通过东京联名渠道做公益传播，形成”产地可追溯、去向可解释”的完整故事线。”,
        “title_en”: “From Chinese Cotton Fields to Tokyo Displays”,
        “content_en”: “This impact tee features certified cotton from Aksu, Xinjiang as its primary material. Spinning, weaving, and printing are completed in China, then distributed through Tokyo co-label channels for charitable outreach—creating a fully traceable story from origin to destination.”,
    },
    “星星之夜帆布托特包”: {
        “country_code”: “GLOBAL”,
        “region_name_zh”: “巴西马托格罗索”,
        “title”: “全球棉源与在地再造”,
        “content”: “产品采用全球认证棉花与再生纤维混纺，主要批次来自巴西马托格罗索与美国得州，经过中国本地再造工艺后进入公益渠道，减少一次性原料依赖。”,
        “title_en”: “Global Cotton, Local Reinvention”,
        “content_en”: “This product blends globally certified cotton with recycled fibres. The primary batch comes from Mato Grosso, Brazil and Texas, USA, then undergoes local reprocessing in China before entering the impact channel—reducing virgin material dependence.”,
    },
    “春天的花园丝巾”: {
        “country_code”: “JP”,
        “region_name_zh”: “东京”,
        “title”: “儿童艺术在东京被看见”,
        “content”: “丝巾图案源自中国乡村儿童画作，面料在中国完成生产，东京作为品牌展示与联名发布节点，让公益故事在亚洲都市消费场景中被更多人看见。”,
        “title_en”: “Children's Art Seen in Tokyo”,
        “content_en”: “The scarf pattern is sourced from a Chinese village child's painting. Fabric production takes place in China, while Tokyo serves as the brand showcase and co-label launch node—bringing the impact story into Asian urban consumer spaces.”,
    },
    “妈妈的手棉麻衬衫”: {
        “country_code”: “CN”,
        “region_name_zh”: “山东”,
        “title”: “天然纤维，可追溯的温暖”,
        “content”: “这款棉麻衬衫采用山东产地天然棉麻混纺面料，原料可溯源至当地合作社，帮助当地农户实现稳定增收，同时确保面料品质的透明度与可持续性。”,
        “title_en”: “Natural Fibres, Traceable Warmth”,
        “content_en”: “This cotton-linen shirt uses natural cotton-linen blend from Shandong's certified cooperatives. Raw materials are traceable to local farming communities, supporting stable income growth while ensuring fabric transparency and sustainability.”,
    },
    “太空旅行圆领卫衣”: {
        “country_code”: “CN”,
        “region_name_zh”: “浙江绍兴”,
        “title”: “童趣印花，工艺可溯源”,
        “content”: “卫衣面料选用绍兴优质棉纱，印有儿童宇宙涂鸦，经绍兴印染工艺与质量检测全流程管控，每件产品均可追溯生产批次与环保认证。”,
        “title_en”: “Kids' Space Art, Traceable Craft”,
        “content_en”: “This crewneck fleece features children's space doodle prints on Shaoxing-sourced premium cotton yarn. The full Shaoxing dyeing and quality inspection process is fully documented, with every unit traceable to its production batch and eco-certifications.”,
    },
    “我的家帆布鞋”: {
        “country_code”: “CN”,
        “region_name_zh”: “山东”,
        “title”: “家乡的颜色穿在脚上”,
        “content”: “帆布鞋鞋面采用有机棉帆布，源自山东有机棉田认证农场，可降解鞋底材料来自可再生资源，整体材质均可溯源，让孩子的画作陪伴每一步。”,
        “title_en”: “Hometown Colours on Your Feet”,
        “content_en”: “The shoe upper uses organic cotton canvas from Shandong certified organic farms. Biodegradable outsole materials come from renewable resources—the entire material stack is traceable, letting the child's artwork accompany every step.”,
    },
    “未来城市连帽卫衣”: {
        “country_code”: “GLOBAL”,
        “region_name_zh”: “美国得州”,
        “title”: “可持续棉源与未来创意”,
        “content”: “卫衣面料采用美国得州可持续认证棉花与再生聚酯混纺，经中国工厂制成成衣后进入公益渠道，既保证品质，也降低环境负担。”,
        “title_en”: “Sustainable Cotton and Future Creativity”,
        “content_en”: “This hoodie blends sustainably certified cotton from Texas, USA with recycled polyester, manufactured in China before entering the impact channel—delivering quality while reducing environmental footprint.”,
    },
    “过年了针织开衫”: {
        “country_code”: “CN”,
        “region_name_zh”: “甘肃定西”,
        “title”: “传统织造，童趣新生”,
        “content”: “开衫采用甘肃定西工坊传统针织工艺与可溯源羊毛再生纤维，图案源自儿童节日画作，合作工坊为当地提供技能培训与公平就业机会。”,
        “title_en”: “Traditional Craft, Children's Joy Renewed”,
        “content_en”: “This cardigan uses traditional knitting techniques from Dingxi, Gansu workshops with traceable wool and recycled fibres. Patterns are sourced from children's festival paintings, and partner workshops provide skills training and fair employment opportunities.”,
    },
    “海豚之歌再生纤维披肩”: {
        “country_code”: “GLOBAL”,
        “region_name_zh”: “巴西马托格罗索”,
        “title”: “海洋之梦，再生之路”,
        “content”: “披肩采用海洋主题儿童画作印花，再生聚酯与有机棉混纺面料可溯源至巴西再生棉田，每件产品收益 28% 捐入美育公益项目，支持乡村儿童艺术教育。”,
        “title_en”: “Ocean Dreams, Regenerative Journey”,
        “content_en”: “This stole features an ocean-theme print from a child's painting. The recycled polyester and organic cotton blend is traceable to Brazilian recycled-cotton farms. 28% of each unit's revenue funds art education programmes for rural children.”,
    },
    “牧羊曲手绘方巾”: {
        “country_code”: “CN”,
        “region_name_zh”: “甘肃定西”,
        “title”: “甘肃手作，童心相伴”,
        “content”: “方巾图案源自甘肃定西儿童牧羊画作，有机棉面料由定西工坊手工印制，全程可溯源。每条方巾均承载乡村孩子的想象与在地手工艺传承。”,
        “title_en”: “Gansu Craft, Childlike Heart”,
        “content_en”: “This bandana features a shepherd painting by a child from Dingxi, Gansu. Organic cotton fabric is hand-printed at Dingxi workshops—fully traceable. Each piece carries a rural child's imagination alongside local artisan heritage.”,
    },
}


DEFAULT_IMPACT_TRACE_STORY = {
    "country_code": "CN",
    "region_name_zh": "山东",
    "title": "中国棉花与全球公益协作",
    "content": "该公益商品以中国棉花供应链为主线，并参考日本品牌协作经验与全球棉花来源框架，构建可持续、可叙述的虚拟溯源故事，用于公益传播与后续 AI 筛选。",
    "title_en": "Chinese Cotton and Global Impact Collaboration",
    "content_en": "This impact product traces its story through China's cotton supply chain, drawing on Japanese brand collaboration experience and global cotton sourcing frameworks to build a sustainable, narratable virtual traceable story for charitable outreach and AI-driven curation.",
}
