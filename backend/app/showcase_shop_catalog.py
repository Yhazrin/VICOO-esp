"""
课程/路演用商店展示数据：图文为可直连的 Unsplash，文案为原创中文说明。
与 load_showcase_shop.py 配套；按商品名幂等更新或插入。
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

_U = "https://images.unsplash.com"
# 配图均为 Unsplash 可直连素材；每条 URL 与标题品类对应，便于路演展示。

# ── 常规店（公司店 /shop）：非公益 ─────────────────────────────────
SHOWCASE_REGULAR: list[dict] = [
    {
        "name": "有机棉松弛感圆领T恤",
        "description": (
            "GOTS 认证有机棉，成衣水洗定型，触感柔软。微落肩剪裁，适合日常叠穿与单穿。"
            "适合课堂展示「可持续基础款」叙事。"
        ),
        "price": Decimal("159.00"),
        "image_url": f"{_U}/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 320,
    },
    {
        "name": "再生羊毛混纺V领针织衫",
        "description": (
            "意大利再生羊毛与棉混纺，细腻不起球。V 领修饰颈线，春秋冬三季可穿。"
        ),
        "price": Decimal("329.00"),
        "image_url": f"{_U}/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 180,
    },
    {
        "name": "轻量便携保暖外套",
        "description": (
            "高蓬松羽绒填充，防泼水面料，可收纳。换季与差旅场景演示友好。"
        ),
        "price": Decimal("499.00"),
        "image_url": f"{_U}/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 240,
    },
    {
        "name": "凉感弹力束脚慢跑裤",
        "description": (
            "四向弹力、吸湿快干，腰头抽绳。从通勤到轻运动一条演示即可讲清场景。"
        ),
        "price": Decimal("199.00"),
        "image_url": f"{_U}/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 400,
    },
    {
        "name": "亚麻混纺休闲衬衫",
        "description": (
            "亚麻与有机棉混纺，透气抗皱。宽松版型，适合「慢时尚」与材质故事线。"
        ),
        "price": Decimal("289.00"),
        "image_url": f"{_U}/photo-1594938291221-94f18cbb5660?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 210,
    },
    {
        "name": "厚织再生帆布托特包",
        "description": (
            "再生棉帆布，加固提手与底部。适合作为「循环材料」视觉锚点。"
        ),
        "price": Decimal("139.00"),
        "image_url": f"{_U}/photo-1597484662317-9bd7bdda2907?auto=format&fit=crop&w=1200&q=85",
        "category": "accessories",
        "stock": 260,
    },
    {
        "name": "经典窄口直筒牛仔裤",
        "description": (
            "中弹丹宁，水洗自然。直筒窄口修饰腿型，耐穿不易形变。"
        ),
        "price": Decimal("299.00"),
        "image_url": f"{_U}/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 350,
    },
    {
        "name": "长绒摇粒绒拉链外套",
        "description": (
            "双面长绒锁温，立领防风。居家与户外轻徒步场景均可口头演示。"
        ),
        "price": Decimal("219.00"),
        "image_url": f"{_U}/photo-1591047139829-d91aecb6c9d5?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 300,
    },
]

# ── 公益店 /impact/shop：含溯源坐标（与 SupplyChainRecord 一致）──────────────
# trace: (stage, description, location, lat, lng, certified, timestamp, carbon_kg, carbon_note)
SHOWCASE_IMPACT: list[dict] = [
    {
        "name": "春野·儿童画联名有机棉T恤",
        "description": (
            "「春天的色彩」美育项目授权印花，有机棉面料，侧缝无感印刷。"
            "每件销售额的 28% 进入乡村儿童画材与驻校美育基金。"
        ),
        "price": Decimal("178.00"),
        "category": "apparel",
        "stock": 200,
        "donation_percentage": Decimal("28.00"),
        "campaign_i": 0,
        "artwork_i": 0,
        "image_url": f"{_U}/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=85",
        "trace": [
            ("material_sourcing", "新疆有机棉田直采，GOTS 证书批次可查", "新疆阿克苏", 41.17, 80.26, True, datetime(2025, 8, 1), Decimal("3.0"), "田间至轧花短驳"),
            ("processing", "绍兴纺纱与针织面料，植物染料小样对齐", "浙江绍兴", 30.0, 120.58, True, datetime(2025, 8, 18), Decimal("2.2"), "园区集中供热"),
            ("manufacturing", "成衣裁剪缝制，印花车间恒温恒湿", "广东东莞", 23.02, 113.75, True, datetime(2025, 9, 2), Decimal("1.8"), "产线绿电占比披露"),
            ("quality_check", "甲醛与色牢度抽检", "广东深圳", 22.54, 114.06, True, datetime(2025, 9, 12), Decimal("0.4"), "同城送检"),
            ("shipping", "可降解包装，华南仓发全国", "广东佛山", 23.03, 113.11, False, datetime(2025, 9, 20), Decimal("1.2"), "干线电动城配试点"),
        ],
    },
    {
        "name": "云岭·公益插画帆布托特",
        "description": (
            "云南山区小学孩子插画授权，厚织帆布与植物染内衬。"
            "销售额 25% 用于「云岭书屋」流动图书角。"
        ),
        "price": Decimal("98.00"),
        "category": "accessories",
        "stock": 280,
        "donation_percentage": Decimal("25.00"),
        "campaign_i": 1,
        "artwork_i": 1,
        "image_url": f"{_U}/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85",
        "trace": [
            ("material_sourcing", "再生棉帆布坯布，GRS 编号可追溯", "浙江宁波", 29.87, 121.55, True, datetime(2025, 7, 5), Decimal("2.9"), "海运集港"),
            ("processing", "植物靛蓝小批量浸染", "云南大理", 25.61, 100.27, True, datetime(2025, 7, 22), Decimal("1.7"), "日晒固色"),
            ("manufacturing", "车缝与提手加固", "云南昆明", 25.04, 102.71, True, datetime(2025, 8, 8), Decimal("1.1"), "短驳电动"),
            ("quality_check", "拉力与耐磨抽检", "云南昆明", 25.04, 102.71, True, datetime(2025, 8, 20), Decimal("0.3"), "同城实验室"),
            ("shipping", "西南中心仓发运", "重庆渝北", 29.72, 106.63, False, datetime(2025, 8, 28), Decimal("1.4"), "铁路+末端电动车"),
        ],
    },
    {
        "name": "星夜·再生纤维艺术披肩",
        "description": (
            "再生聚酯与有机棉混纺，星空主题儿童画授权。"
            "27% 销售额捐赠高海拔学校冬季取暖与艺术课堂。"
        ),
        "price": Decimal("228.00"),
        "category": "accessories",
        "stock": 120,
        "donation_percentage": Decimal("27.00"),
        "campaign_i": 2,
        "artwork_i": 2,
        "image_url": f"{_U}/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=1200&q=85",
        "trace": [
            ("material_sourcing", "再生切片纺丝，海洋塑料减量认证", "浙江嘉兴", 30.75, 120.76, True, datetime(2025, 6, 10), Decimal("3.5"), "化工园区集中治污"),
            ("processing", "织造与数码印花对齐色牢度", "江苏苏州", 31.30, 120.62, True, datetime(2025, 6, 25), Decimal("2.4"), "屋顶光伏"),
            ("manufacturing", "锁边与流苏手工整理", "上海松江", 31.03, 121.22, True, datetime(2025, 7, 12), Decimal("1.0"), "短驳纯电"),
            ("quality_check", "起球与成分抽检", "上海", 31.23, 121.47, True, datetime(2025, 7, 25), Decimal("0.5"), "实验室集中"),
            ("shipping", "华东仓生物基包装", "浙江嘉兴", 30.75, 120.76, False, datetime(2025, 8, 2), Decimal("1.3"), "干线甩挂运输"),
        ],
    },
    {
        "name": "泥与火·童心陶瓷杯礼盒",
        "description": (
            "德化白瓷工艺，再生瓷土配比。双杯印有两幅同班儿童画。"
            "23% 捐赠乡村学校陶艺兴趣角。"
        ),
        "price": Decimal("168.00"),
        "category": "lifestyle",
        "stock": 150,
        "donation_percentage": Decimal("23.00"),
        "campaign_i": 0,
        "artwork_i": 3,
        "image_url": f"{_U}/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=1200&q=85",
        "trace": [
            ("material_sourcing", "高岭土与回收瓷粉配比", "福建德化", 25.49, 118.24, True, datetime(2025, 5, 8), Decimal("2.0"), "园区短驳"),
            ("processing", "球磨与练泥", "福建德化", 25.49, 118.24, True, datetime(2025, 5, 16), Decimal("1.0"), "峰谷用电"),
            ("manufacturing", "注浆成型与釉下彩", "福建德化", 25.49, 118.24, True, datetime(2025, 6, 1), Decimal("3.0"), "天然气窑炉"),
            ("quality_check", "铅镉溶出抽检 GB 4806.4", "福建泉州", 24.91, 118.59, True, datetime(2025, 6, 14), Decimal("0.3"), "同城送检"),
            ("shipping", "防震包装+华东分拨", "福建厦门", 24.48, 118.09, False, datetime(2025, 6, 22), Decimal("1.6"), "海运支线"),
        ],
    },
    {
        "name": "禾风·手工拼布壁挂",
        "description": (
            "合作工坊手工拼布，图案来自《牧羊曲》主题儿童画授权。"
            "22% 用于乡村儿童画材与非遗手作课。"
        ),
        "price": Decimal("188.00"),
        "category": "home",
        "stock": 65,
        "donation_percentage": Decimal("22.00"),
        "campaign_i": 1,
        "artwork_i": 4,
        "image_url": f"{_U}/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85",
        "trace": [
            ("material_sourcing", "有机棉与植物染余料拼配", "甘肃定西", 35.58, 104.63, True, datetime(2025, 8, 3), Decimal("2.5"), "陆运集货"),
            ("processing", "手工裁片与配色", "甘肃定西", 35.58, 104.63, True, datetime(2025, 8, 20), Decimal("0.8"), "工坊生物质取暖"),
            ("manufacturing", "拼缝与装裱背板", "甘肃兰州", 36.06, 103.83, True, datetime(2025, 9, 5), Decimal("1.2"), "城配纯电"),
            ("quality_check", "甲醛与燃烧性能抽检", "陕西西安", 34.27, 108.95, True, datetime(2025, 9, 15), Decimal("0.4"), "高铁送样"),
            ("shipping", "西北仓发全国", "陕西西安", 34.27, 108.95, False, datetime(2025, 9, 22), Decimal("1.5"), "干线铁路"),
        ],
    },
]
