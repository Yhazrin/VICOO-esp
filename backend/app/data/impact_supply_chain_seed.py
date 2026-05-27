"""
公益店 SKU 溯源种子（5 阶段 / 条）：参考优衣库式全球协作与中国制造基地、日本面料与检品文化常见叙事。
与 app/seed.py 中公益商品顺序一致：索引 0=彩虹鱼T… 9=牧羊曲方巾；本模块为索引 1–9 生成记录（索引 0 在 seed 中已写）。
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from app.models.supply_chain import SupplyChainRecord

# 优衣库式叙事关键词：SPA 企划、长三角/珠三角伙伴工厂、日本检针与色牢度标准协同、对中生产与对日品质基准
_TRACE_NOTE = (
    "与日系品质基准对齐的检针、色牢度与缝制公差；"
    "原料与成衣批次可追溯，呼应优衣库全球供应链中「中国生产 + 日本标准」的常见结构。"
)


def _rec(
    *,
    product_id: int,
    stage: str,
    description: str,
    location: str,
    lat: float,
    lng: float,
    certified: bool,
    ts: datetime,
    carbon_kg: Decimal | None,
    carbon_note: str,
    cert_image_url: str | None = None,
    gallery_json: str | None = None,
) -> SupplyChainRecord:
    return SupplyChainRecord(
        product_id=product_id,
        stage=stage,
        description=description,
        location=location,
        latitude=lat,
        longitude=lng,
        certified=certified,
        cert_image_url=cert_image_url,
        carbon_kg=carbon_kg,
        carbon_note=carbon_note,
        timestamp=ts,
        gallery_json=gallery_json,
    )


def extra_impact_supply_records(product_ids: list[int]) -> list[SupplyChainRecord]:
    """
    为公益商品索引 1–9（对应 product_ids[1]..[9]）各写 5 条溯源。
    product_ids 须与 seed 中公益 SKU 顺序一致；不足 10 条时仅为已有索引补写。
    """
    if len(product_ids) < 2:
        return []

    out: list[SupplyChainRecord] = []
    # 索引 1：星星之夜帆布托特包 — 再生帆布、日系检品
    pid = product_ids[1]
    out += [
        _rec(
            product_id=pid,
            stage="material_sourcing",
            description=f"GRS 认证再生棉帆布坯布，宁波港集港；{_TRACE_NOTE}",
            location="浙江宁波",
            lat=29.87,
            lng=121.55,
            certified=True,
            ts=datetime(2025, 3, 5),
            carbon_kg=Decimal("2.6"),
            carbon_note="海运集港，短驳电动化试点",
        ),
        _rec(
            product_id=pid,
            stage="processing",
            description="宽幅染色与防水涂层，工艺参数与日本合作方提供的耐洗色牢度目标对齐",
            location="江苏无锡",
            lat=31.57,
            lng=120.30,
            certified=True,
            ts=datetime(2025, 3, 18),
            carbon_kg=Decimal("1.9"),
            carbon_note="园区集中供热",
        ),
        _rec(
            product_id=pid,
            stage="manufacturing",
            description="车缝、提手加固与《星星之夜》环保印刷，长三角伙伴工厂",
            location="上海嘉定",
            lat=31.39,
            lng=121.26,
            certified=True,
            ts=datetime(2025, 4, 2),
            carbon_kg=Decimal("1.2"),
            carbon_note="市域纯电城配",
            cert_image_url="/static/certs/iso9001.jpg",
        ),
        _rec(
            product_id=pid,
            stage="quality_check",
            description="检针、撕裂与耐磨抽检（日系买方检品标准抽样方案）",
            location="江苏苏州",
            lat=31.30,
            lng=120.62,
            certified=True,
            ts=datetime(2025, 4, 14),
            carbon_kg=Decimal("0.35"),
            carbon_note="同城实验室",
        ),
        _rec(
            product_id=pid,
            stage="shipping",
            description="华东中心仓生物基袋包装，铁路干线 + 末端电动车",
            location="浙江嘉兴",
            lat=30.75,
            lng=120.76,
            certified=False,
            ts=datetime(2025, 4, 22),
            carbon_kg=Decimal("1.35"),
            carbon_note="对日快船支线可选",
        ),
    ]

    # 索引 2：春天的花园丝巾 — 湖丝、杭州印花、日本真丝贸易传统
    if len(product_ids) <= 2:
        return out
    pid = product_ids[2]
    out += [
        _rec(
            product_id=pid,
            stage="material_sourcing",
            description="湖州桑蚕丝原料，与国内丝绸集团批次号绑定；历史上日丝贸易港（神户）同类分级思路做厂内分级",
            location="浙江湖州",
            lat=30.89,
            lng=120.09,
            certified=True,
            ts=datetime(2025, 2, 8),
            carbon_kg=Decimal("2.1"),
            carbon_note="产区短驳",
        ),
        _rec(
            product_id=pid,
            stage="processing",
            description="缫丝与精炼，废水深度处理达标排放",
            location="浙江湖州",
            lat=30.89,
            lng=120.09,
            certified=True,
            ts=datetime(2025, 2, 22),
            carbon_kg=Decimal("1.4"),
            carbon_note="峰谷用电",
        ),
        _rec(
            product_id=pid,
            stage="manufacturing",
            description="数码印花对齐儿童画作色域，苏州丝绸产业园内完成",
            location="江苏苏州",
            lat=31.30,
            lng=120.62,
            certified=True,
            ts=datetime(2025, 3, 8),
            carbon_kg=Decimal("1.0"),
            carbon_note="屋顶光伏",
            cert_image_url="/static/certs/oeko_cert.jpg",
        ),
        _rec(
            product_id=pid,
            stage="quality_check",
            description="摩擦色牢度、甲醛与可分解致癌芳香胺检测（GB + 买方日标对照）",
            location="上海",
            lat=31.23,
            lng=121.47,
            certified=True,
            ts=datetime(2025, 3, 20),
            carbon_kg=Decimal("0.45"),
            carbon_note="实验室集中送检",
        ),
        _rec(
            product_id=pid,
            stage="shipping",
            description="防震礼盒 + 华东发全国；对日空运包装加护角（可选渠道）",
            location="上海浦东",
            lat=31.14,
            lng=121.63,
            certified=False,
            ts=datetime(2025, 3, 28),
            carbon_kg=Decimal("1.5"),
            carbon_note="干线陆运为主",
        ),
    ]

    # 索引 3：妈妈的手棉麻衬衫 — 天然棉麻、刺绣风印花
    if len(product_ids) <= 3:
        return out
    pid = product_ids[3]
    out += [
        _rec(
            product_id=pid,
            stage="material_sourcing",
            description="GOTS 认证有机棉与亚麻混纺纱线，山东产区批次可追溯",
            location="山东济南",
            lat=36.65,
            lng=117.12,
            certified=True,
            ts=datetime(2025, 4, 1),
            carbon_kg=Decimal("2.0"),
            carbon_note="铁路集货",
        ),
        _rec(
            product_id=pid,
            stage="processing",
            description="棉麻混纺织造与预缩水处理，低温植物染色",
            location="山东潍坊",
            lat=36.71,
            lng=119.16,
            certified=True,
            ts=datetime(2025, 4, 10),
            carbon_kg=Decimal("1.5"),
            carbon_note="热电联产",
        ),
        _rec(
            product_id=pid,
            stage="manufacturing",
            description="裁剪缝制与刺绣风印花，珠三角伙伴工厂",
            location="广东深圳",
            lat=22.55,
            lng=114.05,
            certified=True,
            ts=datetime(2025, 4, 22),
            carbon_kg=Decimal("1.2"),
            carbon_note="绿电占比披露",
        ),
        _rec(
            product_id=pid,
            stage="quality_check",
            description="甲醛、色牢度与纤维成分抽检（GB + 日标对照）",
            location="广东深圳",
            lat=22.54,
            lng=114.06,
            certified=True,
            ts=datetime(2025, 5, 2),
            carbon_kg=Decimal("0.3"),
            carbon_note="同城质检",
        ),
        _rec(
            product_id=pid,
            stage="shipping",
            description="生物基包装袋 + 华南仓发运",
            location="广东佛山",
            lat=23.03,
            lng=113.11,
            certified=False,
            ts=datetime(2025, 5, 10),
            carbon_kg=Decimal("1.1"),
            carbon_note="电商包裹碳足迹核算",
        ),
    ]

    # 索引 4：太空旅行圆领卫衣 — 中厚卫衣面料、宇宙涂鸦印花
    if len(product_ids) <= 4:
        return out
    pid = product_ids[4]
    out += [
        _rec(
            product_id=pid,
            stage="material_sourcing",
            description="有机棉毛圈坯布，新疆阿克苏长绒棉产区批次绑定",
            location="新疆阿克苏",
            lat=41.17,
            lng=80.26,
            certified=True,
            ts=datetime(2025, 3, 12),
            carbon_kg=Decimal("2.8"),
            carbon_note="铁路干线集棉",
        ),
        _rec(
            product_id=pid,
            stage="processing",
            description="纺纱与毛圈织造，浙江绍兴面料产业带",
            location="浙江绍兴",
            lat=30.0,
            lng=120.58,
            certified=True,
            ts=datetime(2025, 3, 20),
            carbon_kg=Decimal("1.8"),
            carbon_note="园区集中供热",
        ),
        _rec(
            product_id=pid,
            stage="manufacturing",
            description="裁剪缝制与满版数码印花《太空旅行》，珠三角伙伴工厂",
            location="广东佛山",
            lat=23.03,
            lng=113.11,
            certified=True,
            ts=datetime(2025, 4, 5),
            carbon_kg=Decimal("1.5"),
            carbon_note="绿电采购协议",
        ),
        _rec(
            product_id=pid,
            stage="quality_check",
            description="缩水率、色牢度与甲醛检测（GB + 日标对照）",
            location="广东深圳",
            lat=22.55,
            lng=114.05,
            certified=True,
            ts=datetime(2025, 4, 16),
            carbon_kg=Decimal("0.35"),
            carbon_note="同城质检",
        ),
        _rec(
            product_id=pid,
            stage="shipping",
            description="生物基袋包装 + 华南仓发运全国",
            location="广东佛山",
            lat=23.03,
            lng=113.11,
            certified=False,
            ts=datetime(2025, 4, 24),
            carbon_kg=Decimal("1.3"),
            carbon_note="干线铁路减碳",
        ),
    ]

    # 索引 5：我的家帆布鞋 — 青岛硫化鞋产业带
    if len(product_ids) <= 5:
        return out
    pid = product_ids[5]
    out += [
        _rec(
            product_id=pid,
            stage="material_sourcing",
            description="有机棉帆布与天然橡胶底材，山东青岛鞋材集群",
            location="山东青岛",
            lat=36.07,
            lng=120.38,
            certified=True,
            ts=datetime(2025, 1, 18),
            carbon_kg=Decimal("2.4"),
            carbon_note="陆运集货",
        ),
        _rec(
            product_id=pid,
            stage="processing",
            description="裁片与帮面缝制准备，日企常用硫化工艺参数本地化",
            location="山东青岛",
            lat=36.07,
            lng=120.38,
            certified=True,
            ts=datetime(2025, 2, 1),
            carbon_kg=Decimal("1.5"),
            carbon_note="集中蒸汽",
        ),
        _rec(
            product_id=pid,
            stage="manufacturing",
            description="硫化成型与粘底，产线节拍与东京设计方封样一致",
            location="山东青岛",
            lat=36.08,
            lng=120.39,
            certified=True,
            ts=datetime(2025, 2, 18),
            carbon_kg=Decimal("2.0"),
            carbon_note="绿电采购协议",
        ),
        _rec(
            product_id=pid,
            stage="quality_check",
            description="曲折、耐磨与邻苯二甲酸酯抽检",
            location="山东青岛",
            lat=36.07,
            lng=120.38,
            certified=True,
            ts=datetime(2025, 3, 1),
            carbon_kg=Decimal("0.4"),
            carbon_note="实验室集中",
        ),
        _rec(
            product_id=pid,
            stage="shipping",
            description="华北仓发全国（商品已 sold_out 仍保留溯源演示）",
            location="天津",
            lat=39.12,
            lng=117.20,
            certified=False,
            ts=datetime(2025, 3, 8),
            carbon_kg=Decimal("1.4"),
            carbon_note="铁路电商专列",
        ),
    ]

    # 索引 6：未来城市连帽卫衣 — 加绒卫衣、满版印花
    if len(product_ids) <= 6:
        return out
    pid = product_ids[6]
    out += [
        _rec(
            product_id=pid,
            stage="material_sourcing",
            description="有机棉加绒卫衣坯布，江苏南通纺织集群批次绑定",
            location="江苏南通",
            lat=32.04,
            lng=120.86,
            certified=True,
            ts=datetime(2025, 5, 6),
            carbon_kg=Decimal("2.6"),
            carbon_note="园区短驳",
        ),
        _rec(
            product_id=pid,
            stage="processing",
            description="起绒、定型与预缩水处理",
            location="江苏南通",
            lat=32.04,
            lng=120.86,
            certified=True,
            ts=datetime(2025, 5, 18),
            carbon_kg=Decimal("1.5"),
            carbon_note="光伏屋顶",
        ),
        _rec(
            product_id=pid,
            stage="manufacturing",
            description="裁剪缝制与背面满版数码印花《未来城市》，连帽结构验针",
            location="江苏南通",
            lat=32.05,
            lng=120.87,
            certified=True,
            ts=datetime(2025, 6, 2),
            carbon_kg=Decimal("1.3"),
            carbon_note="产线平衡",
        ),
        _rec(
            product_id=pid,
            stage="quality_check",
            description="缩水率、色牢度、拉链与绳带安全抽检",
            location="江苏苏州",
            lat=31.30,
            lng=120.62,
            certified=True,
            ts=datetime(2025, 6, 14),
            carbon_kg=Decimal("0.35"),
            carbon_note="高铁送样",
        ),
        _rec(
            product_id=pid,
            stage="shipping",
            description="生物基袋包装 + 华东仓发运全国",
            location="浙江嘉兴",
            lat=30.75,
            lng=120.76,
            certified=False,
            ts=datetime(2025, 6, 22),
            carbon_kg=Decimal("1.25"),
            carbon_note="干线电动甩挂",
        ),
    ]

    # 索引 7：过年了针织开衫 — 可溯源羊毛混纺、提花织入
    if len(product_ids) <= 7:
        return out
    pid = product_ids[7]
    out += [
        _rec(
            product_id=pid,
            stage="material_sourcing",
            description="可溯源美利奴羊毛与再生纤维混纺纱线，内蒙古鄂尔多斯产区",
            location="内蒙古鄂尔多斯",
            lat=39.61,
            lng=109.78,
            certified=True,
            ts=datetime(2025, 1, 8),
            carbon_kg=Decimal("3.0"),
            carbon_note="牧区集货铁路",
        ),
        _rec(
            product_id=pid,
            stage="processing",
            description="梳绒、纺纱与配色，低温染整工艺",
            location="河北清河",
            lat=37.04,
            lng=115.67,
            certified=True,
            ts=datetime(2025, 1, 20),
            carbon_kg=Decimal("1.8"),
            carbon_note="热电联产",
        ),
        _rec(
            product_id=pid,
            stage="manufacturing",
            description="电脑横机编织提花图案《过年了》，手工缝合与整烫",
            location="浙江桐乡",
            lat=30.63,
            lng=120.57,
            certified=True,
            ts=datetime(2025, 2, 5),
            carbon_kg=Decimal("1.2"),
            carbon_note="产线平衡",
        ),
        _rec(
            product_id=pid,
            stage="quality_check",
            description="起球、缩水率与纤维成分抽检（GB + 日标对照）",
            location="上海",
            lat=31.23,
            lng=121.47,
            certified=True,
            ts=datetime(2025, 2, 18),
            carbon_kg=Decimal("0.4"),
            carbon_note="实验室集中送检",
        ),
        _rec(
            product_id=pid,
            stage="shipping",
            description="防蛀包装 + 华东仓发运全国",
            location="浙江嘉兴",
            lat=30.75,
            lng=120.76,
            certified=False,
            ts=datetime(2025, 2, 26),
            carbon_kg=Decimal("1.3"),
            carbon_note="干线铁路",
        ),
    ]

    # 索引 8：海豚之歌再生纤维披肩 — 再生纤维杭州/嘉兴
    if len(product_ids) <= 8:
        return out
    pid = product_ids[8]
    out += [
        _rec(
            product_id=pid,
            stage="material_sourcing",
            description="海洋塑料减量再生切片 + 有机棉混纺，嘉兴化纤园",
            location="浙江嘉兴",
            lat=30.75,
            lng=120.76,
            certified=True,
            ts=datetime(2025, 4, 8),
            carbon_kg=Decimal("3.4"),
            carbon_note="化工园区集中治污",
        ),
        _rec(
            product_id=pid,
            stage="processing",
            description="纺纱与织造，对日出口面料常见卷装与检验码",
            location="浙江杭州",
            lat=30.27,
            lng=120.15,
            certified=True,
            ts=datetime(2025, 4, 22),
            carbon_kg=Decimal("2.3"),
            carbon_note="屋顶光伏",
        ),
        _rec(
            product_id=pid,
            stage="manufacturing",
            description="数码印花披肩整饰与锁边，苏州吴江",
            location="江苏苏州",
            lat=31.16,
            lng=120.65,
            certified=True,
            ts=datetime(2025, 5, 6),
            carbon_kg=Decimal("1.1"),
            carbon_note="短驳纯电",
        ),
        _rec(
            product_id=pid,
            stage="quality_check",
            description="起球、成分与披肩尺寸稳定性",
            location="上海",
            lat=31.23,
            lng=121.47,
            certified=True,
            ts=datetime(2025, 5, 18),
            carbon_kg=Decimal("0.45"),
            carbon_note="实验室集中",
        ),
        _rec(
            product_id=pid,
            stage="shipping",
            description="生物基袋 + 华东仓发运",
            location="浙江嘉兴",
            lat=30.75,
            lng=120.76,
            certified=False,
            ts=datetime(2025, 5, 26),
            carbon_kg=Decimal("1.3"),
            carbon_note="干线铁路",
        ),
    ]

    # 索引 9：牧羊曲手绘方巾 — 定西工坊有机棉印制
    if len(product_ids) <= 9:
        return out
    pid = product_ids[9]
    out += [
        _rec(
            product_id=pid,
            stage="material_sourcing",
            description="有机棉坯布与植物染料，甘肃定西合作农社",
            location="甘肃定西",
            lat=35.58,
            lng=104.63,
            certified=True,
            ts=datetime(2025, 6, 1),
            carbon_kg=Decimal("2.0"),
            carbon_note="陆运集货",
        ),
        _rec(
            product_id=pid,
            stage="processing",
            description="手工裁切与植物染色，工坊生物质取暖与低尘管理",
            location="甘肃定西",
            lat=35.58,
            lng=104.63,
            certified=True,
            ts=datetime(2025, 6, 18),
            carbon_kg=Decimal("0.85"),
            carbon_note="小批量低库存",
        ),
        _rec(
            product_id=pid,
            stage="manufacturing",
            description="丝网印花牧羊图案与卷边缝制，兰州质检员驻点督导",
            location="甘肃兰州",
            lat=36.06,
            lng=103.83,
            certified=True,
            ts=datetime(2025, 7, 6),
            carbon_kg=Decimal("0.9"),
            carbon_note="城配纯电",
        ),
        _rec(
            product_id=pid,
            stage="quality_check",
            description="甲醛、色牢度与尺寸抽检，对照东部实验室互认",
            location="陕西西安",
            lat=34.27,
            lng=108.95,
            certified=True,
            ts=datetime(2025, 7, 20),
            carbon_kg=Decimal("0.35"),
            carbon_note="高铁送样",
        ),
        _rec(
            product_id=pid,
            stage="shipping",
            description="西北仓铁路干线 + 全国末端配送",
            location="陕西西安",
            lat=34.27,
            lng=108.95,
            certified=False,
            ts=datetime(2025, 7, 28),
            carbon_kg=Decimal("1.3"),
            carbon_note="铁路干线减碳",
        ),
    ]

    return out
