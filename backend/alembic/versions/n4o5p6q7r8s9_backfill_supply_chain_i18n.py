"""Backfill description_en and location_en for supply chain records.

Revision ID: n4o5p6q7r8s9
Revises: m3n4o5p6q7r8
"""

from alembic import op
import sqlalchemy as sa

revision = "n4o5p6q7r8s9"
down_revision = "m3n4o5p6q7r8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Map stage+product pattern to (description_en, location_en)
    # Pattern: record identified by product_id + stage + location (partial match)
    updates = [
        # Index 0: 彩虹鱼棉质 T 恤 (product_id 10 in regular catalog, offset varies)
        # Material sourcing
        ("有机棉来自新疆阿克苏有机棉田，GOTS 认证", "新疆阿克苏",
         "GOTS-certified organic cotton from Aksu, Xinjiang", "Aksu, Xinjiang"),
        # Processing
        ("纱线纺织与面料染色，使用植物染料，无有害化学品", "浙江绍兴",
         "Spinning, weaving and fabric dyeing using plant-based dyes, free from harmful chemicals", "Shaoxing, Zhejiang"),
        # Manufacturing
        ("成衣裁剪与缝制，ISO 9001 质量管理体系工厂", "广东深圳",
         "Garment cutting and sewing at ISO 9001 certified factory", "Shenzhen, Guangdong"),
        # Quality check
        ("成品质量检验，甲醛含量、色牢度等 12 项指标检测", "广东深圳",
         "Finished product quality inspection: formaldehyde content, colour fastness and 12 other indicators", "Shenzhen, Guangdong"),
        # Shipping
        ("使用可降解包装材料，碳中和物流", "全国配送",
         "Biodegradable packaging materials, carbon-neutral logistics", "Nationwide delivery"),

        # Index 1: 星星之夜帆布托特包
        ("GRS 认证再生棉帆布坯布，宁波港集港；与日系品质基准对齐的检针、色牢度与缝制公差；原料与成衣批次可追溯，呼应优衣库全球供应链中「中国生产 + 日本标准」的常见结构。",
         "浙江宁波",
         "GRS-certified recycled cotton canvas greige, collected at Ningbo port; needle detection, colour fastness and sewing tolerances aligned with Japanese quality benchmarks; full batch traceability from raw material to finished garment, mirroring the common Uniqlo supply chain model of 'Made in China + Japanese standards'.", "Ningbo, Zhejiang"),
        ("宽幅染色与防水涂层，工艺参数与日本合作方提供的耐洗色牢度目标对齐", "江苏无锡",
         "Wide-width dyeing and water-repellent coating, process parameters aligned with wash-fastness targets provided by Japanese partner", "Wuxi, Jiangsu"),
        ("车缝、提手加固与《星星之夜》环保印刷，长三角伙伴工厂", "上海嘉定",
         "Sewing, handle reinforcement and eco-printing of 'Starry Night' design at Yangtze River Delta partner factory", "Jiading, Shanghai"),
        ("检针、撕裂与耐磨抽检（日系买方检品标准抽样方案）", "江苏苏州",
         "Needle detection, tear strength and abrasion resistance sampling (Japanese buyer inspection standard sampling plan)", "Suzhou, Jiangsu"),
        ("华东中心仓生物基袋包装，铁路干线 + 末端电动车", "浙江嘉兴",
         "Bio-based bag packaging at East China central warehouse, rail mainline + last-mile electric vehicle delivery", "Jiaxing, Zhejiang"),

        # Index 2: 春天的花园丝巾
        ("湖州桑蚕丝原料，与国内丝绸集团批次号绑定；历史上日丝贸易港（神户）同类分级思路做厂内分级", "浙江湖州",
         "Huzhou mulberry silk raw material, bound to domestic silk group batch numbers; factory grading follows the same classification approach as historical Japanese silk trade port (Kobe) standards", "Huzhou, Zhejiang"),
        ("缫丝与精炼，废水深度处理达标排放", "浙江湖州",
         "Silk reeling and refining, with advanced wastewater treatment and compliant discharge", "Huzhou, Zhejiang"),
        ("数码印花对齐儿童画作色域，苏州丝绸产业园内完成", "江苏苏州",
         "Digital printing aligned with child's painting colour gamut, completed within Suzhou Silk Industrial Park", "Suzhou, Jiangsu"),
        ("摩擦色牢度、甲醛与可分解致癌芳香胺检测（GB + 买方日标对照）", "上海",
         "Colour fastness to rubbing, formaldehyde and分解 carcinogenic aromatic amines testing (GB + Japanese buyer standard reference)", "Shanghai"),
        ("防震礼盒 + 华东发全国；对日空运包装加护角（可选渠道）", "上海浦东",
         "Shockproof gift box packaging + nationwide distribution from East China; reinforced corners for Japan air freight (optional channel)", "Pudong, Shanghai"),

        # Index 3: 妈妈的手棉麻衬衫
        ("GOTS 认证有机棉与亚麻混纺纱线，山东产区批次可追溯", "山东济南",
         "GOTS-certified organic cotton and linen blended yarn, with traceable Shandong production area batches", "Jinan, Shandong"),
        ("棉麻混纺织造与预缩水处理，低温植物染色", "山东潍坊",
         "Cotton-linen blended weaving and pre-shrinking treatment, low-temperature plant-based dyeing", "Weifang, Shandong"),
        ("裁剪缝制与刺绣风印花，珠三角伙伴工厂", "广东深圳",
         "Cutting, sewing and embroidery-style printing at Pearl River Delta partner factory", "Shenzhen, Guangdong"),
        ("甲醛、色牢度与纤维成分抽检（GB + 日标对照）", "广东深圳",
         "Formaldehyde, colour fastness and fibre composition sampling (GB + Japanese standard reference)", "Shenzhen, Guangdong"),
        ("生物基包装袋 + 华南仓发运", "广东佛山",
         "Bio-based packaging bags + dispatch from South China warehouse", "Foshan, Guangdong"),

        # Index 4: 太空旅行圆领卫衣
        ("有机棉毛圈坯布，新疆阿克苏长绒棉产区批次绑定", "新疆阿克苏",
         "Organic cotton terry greige, batch-bound to Xinjiang Aksu long-staple cotton production area", "Aksu, Xinjiang"),
        ("纺纱与毛圈织造，浙江绍兴面料产业带", "浙江绍兴",
         "Spinning and terry weaving at Shaoxing, Zhejiang fabric industry belt", "Shaoxing, Zhejiang"),
        ("裁剪缝制与满版数码印花《太空旅行》，珠三角伙伴工厂", "广东佛山",
         "Cutting, sewing and all-over digital printing of 'Space Travel' design at Pearl River Delta partner factory", "Foshan, Guangdong"),
        ("缩水率、色牢度与甲醛检测（GB + 日标对照）", "广东深圳",
         "Shrinkage, colour fastness and formaldehyde testing (GB + Japanese standard reference)", "Shenzhen, Guangdong"),
        ("生物基袋包装 + 华南仓发运全国", "广东佛山",
         "Bio-based bag packaging + nationwide dispatch from South China warehouse", "Foshan, Guangdong"),

        # Index 5: 我的家帆布鞋
        ("有机棉帆布与天然橡胶底材，山东青岛鞋材集群", "山东青岛",
         "Organic cotton canvas and natural rubber sole material from Qingdao, Shandong footwear cluster", "Qingdao, Shandong"),
        ("裁片与帮面缝制准备，日企常用硫化工艺参数本地化", "山东青岛",
         "Upper cutting and sewing preparation, localisation of Japanese enterprise common vulcanisation process parameters", "Qingdao, Shandong"),
        ("硫化成型与粘底，产线节拍与东京设计方封样一致", "山东青岛",
         "Vulcanised forming and sole bonding, production line pace consistent with Tokyo design party seal sample", "Qingdao, Shandong"),
        ("曲折、耐磨与邻苯二甲酸酯抽检", "山东青岛",
         "Flex, abrasion resistance and phthalate sampling", "Qingdao, Shandong"),
        ("华北仓发全国（商品已 sold_out 仍保留溯源演示）", "天津",
         "Dispatch nationwide from North China warehouse (records preserved for demo even though product is sold out)", "Tianjin"),

        # Index 6: 未来城市连帽卫衣
        ("有机棉加绒卫衣坯布，江苏南通纺织集群批次绑定", "江苏南通",
         "Organic cotton fleece hoodie greige, batch-bound to Nantong, Jiangsu textile cluster", "Nantong, Jiangsu"),
        ("起绒、定型与预缩水处理", "江苏南通",
         "Brushing, setting and pre-shrinking treatment", "Nantong, Jiangsu"),
        ("裁剪缝制与背面满版数码印花《未来城市》，连帽结构验针", "江苏南通",
         "Cutting, sewing and full-back digital printing of 'Future City' design, needle detection for hoodie structure", "Nantong, Jiangsu"),
        ("缩水率、色牢度、拉链与绳带安全抽检", "江苏苏州",
         "Shrinkage, colour fastness, zipper and cord safety sampling", "Suzhou, Jiangsu"),
        ("生物基袋包装 + 华东仓发运全国", "浙江嘉兴",
         "Bio-based bag packaging + nationwide dispatch from East China warehouse", "Jiaxing, Zhejiang"),

        # Index 7: 过年了针织开衫
        ("可溯源美利奴羊毛与再生纤维混纺纱线，内蒙古鄂尔多斯产区", "内蒙古鄂尔多斯",
         "Traceable merino wool and recycled fibre blended yarn from Ordos, Inner Mongolia production area", "Ordos, Inner Mongolia"),
        ("梳绒、纺纱与配色，低温染整工艺", "河北清河",
         "Carding, spinning and colour matching, low-temperature dyeing and finishing process", "Qinghe, Hebei"),
        ("电脑横机编织提花图案《过年了》，手工缝合与整烫", "浙江桐乡",
         "Computerised flat knitting of jacquard pattern 'Spring Festival', manual seaming and finishing", "Tongxiang, Zhejiang"),
        ("起球、缩水率与纤维成分抽检（GB + 日标对照）", "上海",
         "Pilling, shrinkage and fibre composition sampling (GB + Japanese standard reference)", "Shanghai"),
        ("防蛀包装 + 华东仓发运全国", "浙江嘉兴",
         "Moth-proof packaging + nationwide dispatch from East China warehouse", "Jiaxing, Zhejiang"),

        # Index 8: 海豚之歌再生纤维披肩
        ("海洋塑料减量再生切片 + 有机棉混纺，嘉兴化纤园", "浙江嘉兴",
         "Ocean plastic reduction recycled chips + organic cotton blend, at Jiaxing Chemical Fibre Park", "Jiaxing, Zhejiang"),
        ("纺纱与织造，对日出口面料常见卷装与检验码", "浙江杭州",
         "Spinning and weaving, with roll packaging and inspection codes common for Japan-export fabrics", "Hangzhou, Zhejiang"),
        ("数码印花披肩整饰与锁边，苏州吴江", "江苏苏州",
         "Digital printed stole finishing and overlocking in Suzhou Wujiang", "Suzhou, Jiangsu"),
        ("起球、成分与披肩尺寸稳定性", "上海",
         "Pilling, composition and stole dimensional stability", "Shanghai"),
        ("生物基袋 + 华东仓发运", "浙江嘉兴",
         "Bio-based bags + dispatch from East China warehouse", "Jiaxing, Zhejiang"),

        # Index 9: 牧羊曲手绘方巾
        ("有机棉坯布与植物染料，甘肃定西合作农社", "甘肃定西",
         "Organic cotton greige and plant-based dyes from Gansu Dingxi cooperative farm", "Dingxi, Gansu"),
        ("手工裁切与植物染色，工坊生物质取暖与低尘管理", "甘肃定西",
         "Manual cutting and plant-based dyeing, workshop biomass heating and low-dust management", "Dingxi, Gansu"),
        ("丝网印花牧羊图案与卷边缝制，兰州质检员驻点督导", "甘肃兰州",
         "Screen printed shepherd pattern and rolled-edge sewing, with Lanzhou quality inspector on-site supervision", "Lanzhou, Gansu"),
        ("甲醛、色牢度与尺寸抽检，对照东部实验室互认", "陕西西安",
         "Formaldehyde, colour fastness and dimension sampling, with mutual recognition from Eastern testing labs", "Xi'an, Shaanxi"),
        ("西北仓铁路干线 + 全国末端配送", "陕西西安",
         "Northwest warehouse rail mainline + nationwide last-mile delivery", "Xi'an, Shaanxi"),
    ]

    for zh_desc, zh_loc, en_desc, en_loc in updates:
        zh_desc_escaped = zh_desc.replace("'", "''")
        zh_loc_escaped = zh_loc.replace("'", "''")
        en_desc_escaped = en_desc.replace("'", "''")
        en_loc_escaped = en_loc.replace("'", "''")
        op.execute(
            sa.text(
                f"UPDATE supply_chain_records SET description_en = '{en_desc_escaped}', location_en = '{en_loc_escaped}' "
                f"WHERE description = '{zh_desc_escaped}' AND location = '{zh_loc_escaped}'"
            )
        )


def downgrade() -> None:
    op.execute(sa.text("UPDATE supply_chain_records SET description_en = NULL, location_en = NULL"))