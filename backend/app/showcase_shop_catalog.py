"""
Showcase product data for demos and courses: images from Unsplash, original copy.
配套 load_showcase_shop.py; idempotent upsert by product name.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

_U = "https://images.unsplash.com"
# All images are Unsplash direct-link assets; each URL matches the product title/category.

# -- Regular shop (/shop): non-impact ------------------------------------------------
SHOWCASE_REGULAR: list[dict] = [
    {
        "name": "Organic Cotton Relaxed Crew-Neck T-Shirt",
        "description": (
            "GOTS-certified organic cotton, garment-washed for a soft hand feel. "
            "Drop-shoulder cut ideal for layering or wearing alone. "
            "Perfect for showcasing the 'sustainable basics' narrative in class."
        ),
        "price": Decimal("159.00"),
        "image_url": f"{_U}/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 320,
    },
    {
        "name": "Recycled Wool Blend V-Neck Knit",
        "description": (
            "Italian recycled wool and cotton blend, fine-gauge and pill-resistant. "
            "V-neck flatters the neckline; wearable across spring, autumn, and winter."
        ),
        "price": Decimal("329.00"),
        "image_url": f"{_U}/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 180,
    },
    {
        "name": "Lightweight Packable Warm Jacket",
        "description": (
            "High-loft down fill, water-repellent shell, packs into its own pocket. "
            "Great for seasonal transitions and travel demos."
        ),
        "price": Decimal("499.00"),
        "image_url": f"{_U}/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 240,
    },
    {
        "name": "Cool-Stretch Tapered Joggers",
        "description": (
            "Four-way stretch, moisture-wicking, drawstring waist. "
            "One demo covers everything from commute to light workout."
        ),
        "price": Decimal("199.00"),
        "image_url": f"{_U}/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 400,
    },
    {
        "name": "Linen Blend Relaxed Shirt",
        "description": (
            "Linen and organic cotton blend, breathable and wrinkle-resistant. "
            "Relaxed fit — ideal for the 'slow fashion' and material storytelling angle."
        ),
        "price": Decimal("289.00"),
        "image_url": f"{_U}/photo-1594938291221-94f18cbb5660?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 210,
    },
    {
        "name": "Heavy Recycled Canvas Tote Bag",
        "description": (
            "Recycled cotton canvas with reinforced handles and base. "
            "A visual anchor for the 'circular materials' narrative."
        ),
        "price": Decimal("139.00"),
        "image_url": f"{_U}/photo-1597484662317-9bd7bdda2907?auto=format&fit=crop&w=1200&q=85",
        "category": "accessories",
        "stock": 260,
    },
    {
        "name": "Classic Slim Straight Jeans",
        "description": (
            "Medium-stretch denim, natural wash. Straight slim leg flatters the silhouette "
            "and holds its shape over time."
        ),
        "price": Decimal("299.00"),
        "image_url": f"{_U}/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 350,
    },
    {
        "name": "Long-Pile Fleece Zip Jacket",
        "description": (
            "Double-sided long-pile fleece for warmth, stand-up collar for wind protection. "
            "Works for both indoor lounging and light hiking demos."
        ),
        "price": Decimal("219.00"),
        "image_url": f"{_U}/photo-1591047139829-d91aecb6c9d5?auto=format&fit=crop&w=1200&q=85",
        "category": "apparel",
        "stock": 300,
    },
]

# -- Impact shop (/impact/shop): with trace coordinates (matching SupplyChainRecord) --
# trace: (stage, description, location, lat, lng, certified, timestamp, carbon_kg, carbon_note)
SHOWCASE_IMPACT: list[dict] = [
    {
        "name": "Spring Fields — Children's Art Organic Cotton T-Shirt",
        "description": (
            "Authorized print from the 'Colors of Spring' art education project, organic cotton fabric, "
            "tagless heat-transfer label at side seam. 28% of each sale funds rural children's art supplies "
            "and resident art-teacher programs."
        ),
        "price": Decimal("178.00"),
        "category": "apparel",
        "stock": 200,
        "donation_percentage": Decimal("28.00"),
        "campaign_i": 0,
        "artwork_i": 0,
        "image_url": f"{_U}/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=85",
        "trace": [
            ("material_sourcing", "Direct-sourced organic cotton from Xinjiang farms, GOTS certificate traceable by batch", "Aksu, Xinjiang", 41.17, 80.26, True, datetime(2025, 8, 1), Decimal("3.0"), "Field-to-gin short haul"),
            ("processing", "Yarn spinning and knit fabric production in Shaoxing, plant-dye sample matching", "Shaoxing, Zhejiang", 30.0, 120.58, True, datetime(2025, 8, 18), Decimal("2.2"), "Centralized park heating"),
            ("manufacturing", "Garment cutting and sewing, climate-controlled print workshop", "Dongguan, Guangdong", 23.02, 113.75, True, datetime(2025, 9, 2), Decimal("1.8"), "Production line green-electricity disclosure"),
            ("quality_check", "Formaldehyde and color fastness spot-check", "Shenzhen, Guangdong", 22.54, 114.06, True, datetime(2025, 9, 12), Decimal("0.4"), "Same-city lab delivery"),
            ("shipping", "Biodegradable packaging, ships nationwide from South China warehouse", "Foshan, Guangdong", 23.03, 113.11, False, datetime(2025, 9, 20), Decimal("1.2"), "Electric urban distribution pilot"),
        ],
    },
    {
        "name": "Cloud Ridge — Charity Illustration Canvas Tote",
        "description": (
            "Authorized illustrations from children in Yunnan mountain schools, heavy canvas with plant-dyed lining. "
            "25% of sales fund the 'Cloud Ridge Library' mobile reading corners."
        ),
        "price": Decimal("98.00"),
        "category": "accessories",
        "stock": 280,
        "donation_percentage": Decimal("25.00"),
        "campaign_i": 1,
        "artwork_i": 1,
        "image_url": f"{_U}/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85",
        "trace": [
            ("material_sourcing", "Recycled cotton canvas fabric, GRS number traceable", "Ningbo, Zhejiang", 29.87, 121.55, True, datetime(2025, 7, 5), Decimal("2.9"), "Sea freight consolidation"),
            ("processing", "Small-batch plant-indigo immersion dyeing", "Dali, Yunnan", 25.61, 100.27, True, datetime(2025, 7, 22), Decimal("1.7"), "Sun-cured color fixing"),
            ("manufacturing", "Sewing and handle reinforcement", "Kunming, Yunnan", 25.04, 102.71, True, datetime(2025, 8, 8), Decimal("1.1"), "Electric short-haul"),
            ("quality_check", "Tensile strength and abrasion spot-check", "Kunming, Yunnan", 25.04, 102.71, True, datetime(2025, 8, 20), Decimal("0.3"), "Same-city laboratory"),
            ("shipping", "Shipped from Southwest central warehouse", "Yubei, Chongqing", 29.72, 106.63, False, datetime(2025, 8, 28), Decimal("1.4"), "Rail + last-mile electric vehicles"),
        ],
    },
    {
        "name": "Starry Night — Recycled Fiber Art Shawl",
        "description": (
            "Recycled polyester and organic cotton blend, authorized starry-sky children's artwork. "
            "27% of sales donated to high-altitude school winter heating and art classes."
        ),
        "price": Decimal("228.00"),
        "category": "accessories",
        "stock": 120,
        "donation_percentage": Decimal("27.00"),
        "campaign_i": 2,
        "artwork_i": 2,
        "image_url": f"{_U}/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=1200&q=85",
        "trace": [
            ("material_sourcing", "Recycled chip spinning, ocean plastic reduction certified", "Jiaxing, Zhejiang", 30.75, 120.76, True, datetime(2025, 6, 10), Decimal("3.5"), "Chemical park centralized treatment"),
            ("processing", "Weaving and digital printing with color fastness alignment", "Suzhou, Jiangsu", 31.30, 120.62, True, datetime(2025, 6, 25), Decimal("2.4"), "Rooftop solar panels"),
            ("manufacturing", "Edge-locking and hand-finished fringe", "Songjiang, Shanghai", 31.03, 121.22, True, datetime(2025, 7, 12), Decimal("1.0"), "Pure-electric short-haul"),
            ("quality_check", "Pilling and composition spot-check", "Shanghai", 31.23, 121.47, True, datetime(2025, 7, 25), Decimal("0.5"), "Centralized laboratory"),
            ("shipping", "Bio-based packaging from East China warehouse", "Jiaxing, Zhejiang", 30.75, 120.76, False, datetime(2025, 8, 2), Decimal("1.3"), "Trunk swap-body transport"),
        ],
    },
    {
        "name": "Clay & Fire — Children's Ceramic Mug Gift Set",
        "description": (
            "Dehua white porcelain craft with recycled clay blend. Twin mugs feature two paintings "
            "from the same class. 23% donated to rural school pottery corners."
        ),
        "price": Decimal("168.00"),
        "category": "lifestyle",
        "stock": 150,
        "donation_percentage": Decimal("23.00"),
        "campaign_i": 0,
        "artwork_i": 3,
        "image_url": f"{_U}/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=1200&q=85",
        "trace": [
            ("material_sourcing", "Kaolin blended with recycled porcelain powder", "Dehua, Fujian", 25.49, 118.24, True, datetime(2025, 5, 8), Decimal("2.0"), "Park short-haul"),
            ("processing", "Ball milling and pugging", "Dehua, Fujian", 25.49, 118.24, True, datetime(2025, 5, 16), Decimal("1.0"), "Off-peak electricity"),
            ("manufacturing", "Slip casting and underglaze decoration", "Dehua, Fujian", 25.49, 118.24, True, datetime(2025, 6, 1), Decimal("3.0"), "Natural gas kiln"),
            ("quality_check", "Lead/cadmium leaching per GB 4806.4", "Quanzhou, Fujian", 24.91, 118.59, True, datetime(2025, 6, 14), Decimal("0.3"), "Same-city testing"),
            ("shipping", "Shock-proof packaging + East China distribution", "Xiamen, Fujian", 24.48, 118.09, False, datetime(2025, 6, 22), Decimal("1.6"), "Sea feeder route"),
        ],
    },
    {
        "name": "Harvest Wind — Handmade Patchwork Wall Hanging",
        "description": (
            "Hand-patched by partner workshop artisans, pattern from authorized 'Shepherd's Song' "
            "children's artwork. 22% funds rural children's art supplies and intangible heritage craft classes."
        ),
        "price": Decimal("188.00"),
        "category": "home",
        "stock": 65,
        "donation_percentage": Decimal("22.00"),
        "campaign_i": 1,
        "artwork_i": 4,
        "image_url": f"{_U}/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85",
        "trace": [
            ("material_sourcing", "Organic cotton and plant-dye offcuts assembled", "Dingxi, Gansu", 35.58, 104.63, True, datetime(2025, 8, 3), Decimal("2.5"), "Road freight consolidation"),
            ("processing", "Hand-cut pieces and color matching", "Dingxi, Gansu", 35.58, 104.63, True, datetime(2025, 8, 20), Decimal("0.8"), "Workshop biomass heating"),
            ("manufacturing", "Patchwork sewing and backing board mounting", "Lanzhou, Gansu", 36.06, 103.83, True, datetime(2025, 9, 5), Decimal("1.2"), "Pure-electric urban delivery"),
            ("quality_check", "Formaldehyde and combustion performance spot-check", "Xi'an, Shaanxi", 34.27, 108.95, True, datetime(2025, 9, 15), Decimal("0.4"), "High-speed rail sample delivery"),
            ("shipping", "Ships nationwide from Northwest warehouse", "Xi'an, Shaanxi", 34.27, 108.95, False, datetime(2025, 9, 22), Decimal("1.5"), "Rail trunk line"),
        ],
    },
]
