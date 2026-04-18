"""
优衣库式常规店默认 SKU（参考官网品类：轻羽绒、凉感针织、Easy Pants、摇粒绒等），
文案为原创描述，不使用第三方注册商标作为商品名。

配图：Unsplash（可直连）。
"""

from __future__ import annotations

from decimal import Decimal

_U = "https://images.unsplash.com"

# Product(...) / mock 共用的基础字段
REGULAR_CATALOG: list[dict] = [
    {
        "name": "Organic Linen Oversized Shirt",
        "description": "Relaxed-fit shirt in GOTS-certified organic linen. Pre-washed for a lived-in softness — everyday layering like a minimal essentials line.",
        "price": Decimal("328.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1594938291221-94f18cbb5660?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 150,
        "status": "active",
        "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
        "colors": [{"name": "White", "hex": "#F5F0E8"}, {"name": "Sand", "hex": "#C4A45A"}, {"name": "Sage", "hex": "#3F4F45"}],
    },
    {
        "name": "Recycled Cashmere Crewneck",
        "description": "100% recycled Italian cashmere. Circular knit, zero-waste pattern — warm without bulk for city commutes.",
        "price": Decimal("598.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 80,
        "status": "active",
        "sizes": ["S", "M", "L", "XL"],
        "colors": [{"name": "Black", "hex": "#1A1A16"}, {"name": "Navy", "hex": "#1C2841"}, {"name": "Rust", "hex": "#8B3A2A"}],
    },
    {
        "name": "Hemp Canvas Tote",
        "description": "Dense hemp-cotton canvas, reinforced handles. Minimal structure for work-to-weekend carry.",
        "price": Decimal("128.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80",
        "category": "accessories",
        "stock": 200,
        "status": "active",
    },
    {
        "name": "Merino Wool Scarf",
        "description": "Fine merino with hand-finished edges. Natural rust and sage overdye — soft on skin, easy to pack.",
        "price": Decimal("198.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1520903920243-bd6c79d4c0bc?auto=format&fit=crop&w=900&q=80",
        "category": "accessories",
        "stock": 120,
        "status": "active",
        "colors": [{"name": "Rust", "hex": "#8B3A2A"}, {"name": "Sage", "hex": "#3F4F45"}],
    },
    {
        "name": "男士轻盈便携保暖外套",
        "description": "高蓬松羽绒填充，防泼水面料，可收纳成小袋。应对换季与差旅温差，轻量不臃肿。（风格参考轻型羽绒外套品类）",
        "price": Decimal("499.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 220,
        "status": "active",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": [{"name": "Black", "hex": "#1A1A16"}, {"name": "Navy", "hex": "#1C2841"}, {"name": "Olive", "hex": "#3D4F3A"}],
    },
    {
        "name": "女装凉感速干圆领T恤",
        "description": "透气针织结构，吸湿速干，触感清凉。适合叠穿与运动休闲场景。（风格参考凉感功能针织系列）",
        "price": Decimal("79.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1576566588118-864fb183a329?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 400,
        "status": "active",
        "sizes": ["XS", "S", "M", "L", "XL"],
        "colors": [{"name": "White", "hex": "#F8F6F1"}, {"name": "Mist", "hex": "#C5CCD3"}, {"name": "Black", "hex": "#1A1A16"}],
    },
    {
        "name": "高性能弹力束脚慢跑裤",
        "description": "四向弹力面料，腰部抽绳，裤脚微收。快干透气，从通勤到轻运动一条搞定。（风格参考高弹慢跑裤）",
        "price": Decimal("199.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 310,
        "status": "active",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": [{"name": "Black", "hex": "#1A1A16"}, {"name": "Charcoal", "hex": "#3A3A38"}],
    },
    {
        "name": "免烫通勤弹力卡其裤",
        "description": "中腰直筒，抗皱处理，久坐不易变形。商务休闲通用。（风格参考易打理弹力长裤）",
        "price": Decimal("249.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1624378511005-6ffabeee817f?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 260,
        "status": "active",
        "sizes": ["28", "30", "32", "34", "36"],
        "colors": [{"name": "Khaki", "hex": "#B8A88A"}, {"name": "Navy", "hex": "#1C2841"}],
    },
    {
        "name": "美利奴混纺圆领针织衫",
        "description": "美利奴与棉混纺，细腻贴肤，可机洗。春秋单穿、冬季内搭皆宜。",
        "price": Decimal("299.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1576871337622-98d48c1b874b?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 180,
        "status": "active",
        "sizes": ["S", "M", "L", "XL"],
        "colors": [{"name": "Oat", "hex": "#D4C4B0"}, {"name": "Navy", "hex": "#1C2841"}, {"name": "Burgundy", "hex": "#5C2A32"}],
    },
    {
        "name": "拉链式连帽休闲卫衣",
        "description": "内里轻刷毛，拉链全开方便叠穿。城市骑行与周末散步的默认外套。",
        "price": Decimal("249.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 275,
        "status": "active",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": [{"name": "Heather Grey", "hex": "#9B9B97"}, {"name": "Black", "hex": "#1A1A16"}],
    },
    {
        "name": "经典窄口直筒牛仔裤",
        "description": "中弹丹宁，窄口直筒修饰腿型。水洗自然，耐穿不易形变。",
        "price": Decimal("299.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 340,
        "status": "active",
        "sizes": ["28", "30", "32", "34", "36"],
        "colors": [{"name": "Indigo", "hex": "#2F3A4A"}, {"name": "Light Blue", "hex": "#7A9EB8"}],
    },
    {
        "name": "长绒摇粒绒拉链外套",
        "description": "双面长绒锁温，立领设计防风。居家与户外轻徒步皆可。（风格参考抓绒外套品类）",
        "price": Decimal("199.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1591047139829-d91aecb6c9d5?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 290,
        "status": "active",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": [{"name": "Cream", "hex": "#EDE8E0"}, {"name": "Forest", "hex": "#2F4538"}],
    },
    {
        "name": "防泼水连帽功能风衣",
        "description": "轻量尼龙复合，防泼水涂层，帽檐可调节。折叠体积小，适合雨季与海边风大天气。",
        "price": Decimal("399.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 155,
        "status": "active",
        "sizes": ["S", "M", "L", "XL"],
        "colors": [{"name": "Stone", "hex": "#A8A29E"}, {"name": "Black", "hex": "#1A1A16"}],
    },
    {
        "name": "女式高腰针织直筒半裙",
        "description": "罗纹针织垂坠感，高腰直筒轮廓。搭配凉感T恤或针织开衫皆可。",
        "price": Decimal("179.00"),
        "currency": "CNY",
        "image_url": f"{_U}/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80",
        "category": "apparel",
        "stock": 165,
        "status": "active",
        "sizes": ["XS", "S", "M", "L"],
        "colors": [{"name": "Black", "hex": "#1A1A16"}, {"name": "Camel", "hex": "#A67C52"}],
    },
]


def regular_catalog_for_orm() -> list[dict]:
    """供 Product(**kwargs) 使用，剔除 ORM 不认识的 sizes/colors（由 API mock / 前端扩展读取）。"""
    out = []
    for row in REGULAR_CATALOG:
        d = {k: v for k, v in row.items() if k not in ("sizes", "colors")}
        d["is_impact_product"] = False
        out.append(d)
    return out


def regular_catalog_mock_dicts(start_id: int = 20) -> list[dict]:
    """DEMO_MODE 下 _mock_products 用的 dict，含 id 与字符串 price。默认 start_id=20，避免与公益 mock id 13/14 重叠。"""
    rows = []
    for i, spec in enumerate(REGULAR_CATALOG):
        d = {
            "id": start_id + i,
            "name": spec["name"],
            "description": spec["description"],
            "price": str(spec["price"]),
            "currency": spec["currency"],
            "image_url": spec["image_url"],
            "category": spec["category"],
            "stock": spec["stock"],
            "status": spec["status"],
            "is_impact_product": False,
            "campaign_id": None,
            "donation_percentage": None,
            "created_at": "2025-06-20T10:00:00",
        }
        if spec.get("sizes"):
            d["sizes"] = spec["sizes"]
        if spec.get("colors"):
            d["colors"] = spec["colors"]
        rows.append(d)
    return rows
