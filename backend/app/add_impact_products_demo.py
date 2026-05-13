"""
向数据库追加「真实感」公益商品及全链路溯源节点（含 WGS84 坐标），可安全多次执行（按商品名去重）。

运行（容器内）:
  cd /app/backend && python -m app.add_impact_products_demo
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select

from app.database import AsyncSessionLocal, engine
from app.models.artwork import Artwork
from app.models.campaign import Campaign
from app.models.country import Country
from app.models.product import Product
from app.models.region import Region
from app.models.supply_chain import SupplyChainRecord
from app.data.impact_origin_story_seed import (
    DEFAULT_IMPACT_TRACE_STORY,
    IMPACT_TRACE_STORY_BY_NAME,
    ORIGIN_COUNTRIES,
    ORIGIN_REGIONS,
)

# 与 seed.py 风格一致的可直连图片
_U = "https://images.unsplash.com"

# 去重用的固定名称
IMPACT_PRODUCT_NAMES = frozenset(
    {
        "云南大理·白族扎染儿童画联名方巾",
        "贵州侗寨靛蓝帆布包「侗乡晨雾」",
        "青海祁连牦牛绒儿童画披肩",
        "德化再生瓷·童心马克杯对杯",
    }
)


def _impact_catalog() -> list[dict]:
    """每条含 campaign_i / artwork_i（在库内按序取模绑定真实 id）。"""
    return [
        {
            "name": "云南大理·白族扎染儿童画联名方巾",
            "description": (
                "大理周城非遗扎染工坊与「春天的色彩」项目联名，方巾图案来自合作小学孩子的获奖画作。"
                "植物靛蓝染色，手工缝边。每件销售额的 26% 进入乡村美育画材基金。"
            ),
            "price": Decimal("128.00"),
            "category": "accessories",
            "stock": 160,
            "donation_percentage": Decimal("26.00"),
            "campaign_i": 0,
            "artwork_i": 0,
            "image_url": f"{_U}/photo-1504196606672-aef5d9a7b792?auto=format&fit=crop&w=900&q=80",
            # 坐标取近似：县城/市政府驻地 WGS84（周城=喜洲镇周城村，非大理古城）
            "trace": [
                ("material_sourcing", "有机棉纱线由云南楚雄合作棉田直供，田间农残抽检合格", "云南楚雄", 25.0330, 101.5330, True, datetime(2025, 8, 5), Decimal("2.8"), "棉田灌溉与采摘运输"),
                ("processing", "大理周城工坊植物靛蓝发酵染，无偶氮染料", "云南大理·周城", 25.8547, 100.2139, True, datetime(2025, 8, 22), Decimal("1.9"), "太阳能辅助晒布"),
                ("manufacturing", "手工裁切与缝边，合作绣娘按件计酬", "云南大理", 25.6065, 100.2676, True, datetime(2025, 9, 8), Decimal("0.6"), "工坊内短驳电动缝纫"),
                ("quality_check", "昆明第三方实验室抽检色牢度与甲醛", "云南昆明", 25.0389, 102.7183, True, datetime(2025, 9, 18), Decimal("0.4"), "送检物流纳入碳排估算"),
                ("shipping", "可降解纸包装，昆明仓发全国", "云南昆明", 25.0389, 102.7183, False, datetime(2025, 9, 25), Decimal("1.1"), "干线冷链零担+末端电动车"),
            ],
        },
        {
            "name": "贵州侗寨靛蓝帆布包「侗乡晨雾」",
            "description": (
                "黔东南侗族地区靛蓝染帆布，印有《侗乡晨雾》主题儿童画（经授权）。"
                "厚织再生棉帆布，承重升级。销售额 24% 捐赠「我的家乡」乡土记忆项目。"
            ),
            "price": Decimal("96.00"),
            "category": "accessories",
            "stock": 220,
            "donation_percentage": Decimal("24.00"),
            "campaign_i": 1,
            "artwork_i": 1,
            "image_url": f"{_U}/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
            "trace": [
                ("material_sourcing", "再生棉帆布坯布，供应商提供 GRS 追溯编号", "浙江宁波", 29.8747, 121.5507, True, datetime(2025, 7, 12), Decimal("3.1"), "海运集港至钦州"),
                ("processing", "凯里合作染坊侗族靛蓝浸染七道，日晒固色", "贵州凯里", 26.5836, 107.9803, True, datetime(2025, 7, 28), Decimal("2.0"), "染缸加热使用生物质颗粒"),
                ("manufacturing", "柳州车缝厂完成裁片与提手加固", "广西柳州", 24.3263, 109.4281, True, datetime(2025, 8, 15), Decimal("1.4"), "厂区屋顶光伏"),
                ("quality_check", "拉力与色牢度抽检，SGS 合作实验室", "广东深圳", 22.5431, 114.0579, True, datetime(2025, 8, 29), Decimal("0.5"), "抽检样品空运"),
                ("shipping", "华南中心仓发运，面单碳中和补偿", "广东佛山", 23.0297, 113.1056, False, datetime(2025, 9, 6), Decimal("1.3"), "干线电动卡车试点线路"),
            ],
        },
        {
            "name": "青海祁连牦牛绒儿童画披肩",
            "description": (
                "祁连山下牧场牦牛绒混纺，轻柔保暖。印花图案来自海北州公益小学孩子画作。"
                "每件捐赠 27% 用于高海拔学校冬季取暖与艺术课堂。"
            ),
            "price": Decimal("268.00"),
            "category": "accessories",
            "stock": 85,
            "donation_percentage": Decimal("27.00"),
            "campaign_i": 2,
            "artwork_i": 2,
            "image_url": f"{_U}/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80",
            "trace": [
                ("material_sourcing", "祁连牧场分梳牦牛绒，牧民合作社直采", "青海祁连", 38.1754, 100.2497, True, datetime(2025, 6, 3), Decimal("4.2"), "牧场至西宁冷链短驳"),
                ("processing", "西宁毛纺厂洗绒、分梳与精纺成纱", "青海西宁", 36.6171, 101.7782, True, datetime(2025, 6, 20), Decimal("2.6"), "工业余热回收"),
                # 原 39.34°N 已偏至宁河/冀东一带，非天津中心城区针织产业带
                ("manufacturing", "天津针织厂横机织造与数码印花", "天津", 39.0842, 117.2010, True, datetime(2025, 7, 8), Decimal("2.9"), "电网绿电占比年度披露"),
                ("quality_check", "起球与成分含量检测，符合 FZ/T 标准", "河北廊坊", 39.5239, 116.7044, True, datetime(2025, 7, 22), Decimal("0.7"), "实验室集中送检"),
                ("shipping", "华北仓组单，生物基包装袋", "北京通州", 39.9097, 116.6576, False, datetime(2025, 8, 1), Decimal("1.5"), "铁路干线+城配"),
            ],
        },
        {
            "name": "德化再生瓷·童心马克杯对杯",
            "description": (
                "德化白瓷工艺，30% 再生瓷土。对杯印有两幅不同儿童画（同一班级姊妹篇）。"
                "销售额 23% 捐入福建乡村学校陶艺兴趣角。"
            ),
            "price": Decimal("158.00"),
            "category": "lifestyle",
            "stock": 140,
            "donation_percentage": Decimal("23.00"),
            "campaign_i": 0,
            "artwork_i": 3,
            "image_url": f"{_U}/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=900&q=80",
            "trace": [
                ("material_sourcing", "高岭土掺配建筑陶瓷回收粉料，批次可追溯", "福建德化", 25.4897, 118.2417, True, datetime(2025, 5, 10), Decimal("2.2"), "短途汽运至园区"),
                ("processing", "球磨、除铁与真空练泥", "福建德化", 25.4897, 118.2417, True, datetime(2025, 5, 18), Decimal("1.1"), "峰谷电价生产"),
                ("manufacturing", "高压注浆成型、釉下彩贴花与 1280℃ 氧化烧成", "福建德化", 25.4897, 118.2417, True, datetime(2025, 6, 2), Decimal("3.4"), "天然气窑炉热效率改造"),
                # 原 118.68°E 已偏至泉州湾以东近海/莆田沿岸，改用鲤城区一带市区坐标
                ("quality_check", "铅镉溶出量抽检（GB 4806.4）", "福建泉州", 24.9139, 118.5859, True, datetime(2025, 6, 15), Decimal("0.3"), "送检同城"),
                ("shipping", "厦门港支线+华东电商仓分拨", "福建厦门", 24.4798, 118.0894, False, datetime(2025, 6, 22), Decimal("1.8"), "海运干线主力"),
            ],
        },
    ]


async def main() -> None:
    try:
        async with AsyncSessionLocal() as session:
            country_id_by_code: dict[str, int] = {}
            for row in ORIGIN_COUNTRIES:
                existing_country = (
                    await session.execute(select(Country).where(Country.code == row["code"]))
                ).scalar_one_or_none()
                if existing_country is None:
                    existing_country = Country(**row)
                    session.add(existing_country)
                    await session.flush()
                country_id_by_code[row["code"]] = existing_country.id

            region_id_by_name_zh: dict[str, int] = {}
            for row in ORIGIN_REGIONS:
                existing_region = (
                    await session.execute(select(Region).where(Region.name_zh == row["name_zh"]))
                ).scalar_one_or_none()
                if existing_region is None:
                    existing_region = Region(
                        country_id=country_id_by_code[row["country_code"]],
                        name_zh=row["name_zh"],
                        name_en=row["name_en"],
                        region_type=row.get("region_type"),
                    )
                    session.add(existing_region)
                    await session.flush()
                region_id_by_name_zh[row["name_zh"]] = existing_region.id

            existing = await session.execute(select(Product.name).where(Product.name.in_(IMPACT_PRODUCT_NAMES)))
            existing_names = set(existing.scalars().all())
            if existing_names == IMPACT_PRODUCT_NAMES:
                print("公益溯源商品已存在，跳过插入。")
                return

            c_res = await session.execute(select(Campaign.id).order_by(Campaign.id))
            campaign_ids = list(c_res.scalars().all())
            if not campaign_ids:
                print("错误：数据库中无活动（campaigns），请先运行种子或创建活动。")
                return

            a_res = await session.execute(
                select(Artwork.id).where(Artwork.status == "approved").order_by(Artwork.id)
            )
            artwork_ids = list(a_res.scalars().all())
            if len(artwork_ids) < 4:
                a2 = await session.execute(select(Artwork.id).order_by(Artwork.id).limit(8))
                artwork_ids = list(dict.fromkeys(artwork_ids + list(a2.scalars().all())))
            if not artwork_ids:
                print("错误：数据库中无画作（artworks），请先运行种子。")
                return

            catalog = _impact_catalog()
            to_insert = [c for c in catalog if c["name"] not in existing_names]
            new_products: list[Product] = []

            for item in to_insert:
                story = IMPACT_TRACE_STORY_BY_NAME.get(item["name"], DEFAULT_IMPACT_TRACE_STORY)
                p = Product(
                    name=item["name"],
                    description=item["description"],
                    price=item["price"],
                    currency="CNY",
                    image_url=item["image_url"],
                    category=item["category"],
                    stock=item["stock"],
                    status="active",
                    is_impact_product=True,
                    campaign_id=campaign_ids[item["campaign_i"] % len(campaign_ids)],
                    donation_percentage=item["donation_percentage"],
                    artwork_id=artwork_ids[item["artwork_i"] % len(artwork_ids)],
                    origin_country_id=country_id_by_code.get(story["country_code"]),
                    origin_region_id=region_id_by_name_zh.get(story["region_name_zh"]),
                    trace_story_title=story["title"],
                    trace_story_content=story["content"],
                )
                session.add(p)
                new_products.append(p)

            await session.flush()

            for p, item in zip(new_products, to_insert, strict=True):
                for row in item["trace"]:
                    stage, desc, loc, lat, lon, cert, ts, carbon_kg, carbon_note = row
                    session.add(
                        SupplyChainRecord(
                            product_id=p.id,
                            stage=stage,
                            description=desc,
                            location=loc,
                            latitude=lat,
                            longitude=lon,
                            certified=cert,
                            cert_image_url=None,
                            timestamp=ts,
                            carbon_kg=carbon_kg,
                            carbon_note=carbon_note,
                        )
                    )

            await session.commit()
            print(f"已新增 {len(new_products)} 个公益商品及溯源节点。")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
