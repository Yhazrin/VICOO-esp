"""
Database seed script for Tonghua Public Welfare x Sustainable Fashion.

Usage:
    python -m app.seed

Creates tables and inserts sample data:
  - 5 users
  - 3 campaigns
  - 20 artworks
  - 10 donations
  - 8 products
  - 5 orders (with items)
  - supply chain records
  - audit logs
"""

import asyncio
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, Base, AsyncSessionLocal
from app.models.user import User, ChildParticipant
from app.models.artwork import Artwork
from app.models.campaign import Campaign
from app.models.donation import Donation
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.supply_chain import SupplyChainRecord
from app.models.payment import PaymentTransaction
from app.models.audit import AuditLog
from app.security import hash_password
from app.config import settings


async def seed():
    """Create all tables and insert sample data."""
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # ── Users ────────────────────────────────────────────────
        print("Seeding users...")
        users = [
            User(
                email="admin@tonghua.org",
                password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
                nickname="管理员",
                role="admin",
                status="active",
            ),
            User(
                email="editor@tonghua.org",
                password_hash=hash_password(settings.SEED_EDITOR_PASSWORD),
                nickname="编辑小王",
                role="editor",
                status="active",
            ),
            User(
                email="lihua@example.com",
                password_hash=hash_password(settings.SEED_USER_PASSWORD),
                nickname="李华",
                role="user",
                status="active",
            ),
            User(
                email="zhangwei@example.com",
                password_hash=hash_password(settings.SEED_USER_PASSWORD),
                nickname="张伟",
                role="user",
                status="active",
            ),
            User(
                email="wangfang@example.com",
                password_hash=hash_password(settings.SEED_USER_PASSWORD),
                nickname="王芳",
                role="user",
                status="active",
            ),
        ]
        session.add_all(users)
        await session.flush()
        user_ids = [u.id for u in users]

        # ── Child Participants ───────────────────────────────────
        print("Seeding child participants...")
        children = [
            ChildParticipant.create_with_encryption(
                child_name="小明", display_name="小小画家", age=10,
                guardian_name="李建国", region="云南大理", school="大理希望小学",
                consent_given=True, consent_date=datetime(2025, 1, 15),
                artwork_count=3, status="active",
            ),
            ChildParticipant.create_with_encryption(
                child_name="小红", display_name="彩虹小画家", age=8,
                guardian_name="张秀英", region="贵州遵义", school="遵义阳光小学",
                consent_given=True, consent_date=datetime(2025, 1, 20),
                artwork_count=2, status="active",
            ),
            ChildParticipant.create_with_encryption(
                child_name="小丽", display_name="丽丽的画笔", age=11,
                guardian_name="王大伟", region="甘肃定西", school="定西育才小学",
                consent_given=True, consent_date=datetime(2025, 2, 1),
                artwork_count=4, status="active",
            ),
            ChildParticipant.create_with_encryption(
                child_name="小刚", display_name="星空少年", age=12,
                guardian_name="刘芳", region="河南信阳", school="信阳实验小学",
                consent_given=True, consent_date=datetime(2025, 2, 10),
                artwork_count=2, status="active",
            ),
            ChildParticipant.create_with_encryption(
                child_name="小雨", display_name="雨滴画室", age=9,
                guardian_name="陈志明", region="四川凉山", school="凉山公益小学",
                consent_given=True, consent_date=datetime(2025, 2, 15),
                artwork_count=3, status="active",
            ),
            ChildParticipant.create_with_encryption(
                child_name="小芳", display_name="芳芳的小世界", age=10,
                guardian_name="赵刚", region="湖南湘西", school="湘西育苗小学",
                consent_given=True, consent_date=datetime(2025, 2, 20),
                artwork_count=1, status="active",
            ),
            ChildParticipant.create_with_encryption(
                child_name="小杰", display_name="杰杰的画廊", age=7,
                guardian_name="孙丽", region="江西赣州", school="赣州希望小学",
                consent_given=True, consent_date=datetime(2025, 3, 1),
                artwork_count=1, status="active",
            ),
            ChildParticipant.create_with_encryption(
                child_name="小雪", display_name="雪地精灵", age=9,
                guardian_name="周明", region="黑龙江齐齐哈尔", school="齐齐哈尔公益小学",
                consent_given=True, consent_date=datetime(2025, 3, 5),
                artwork_count=1, status="active",
            ),
            ChildParticipant.create_with_encryption(
                child_name="小海", display_name="海的那边", age=11,
                guardian_name="吴强", region="海南文昌", school="文昌公益小学",
                consent_given=True, consent_date=datetime(2025, 3, 10),
                artwork_count=1, status="active",
            ),
            ChildParticipant.create_with_encryption(
                child_name="小花", display_name="花田守望者", age=8,
                guardian_name="郑梅", region="广西百色", school="百色希望小学",
                consent_given=True, consent_date=datetime(2025, 3, 15),
                artwork_count=1, status="active",
            ),
        ]
        session.add_all(children)
        await session.flush()
        child_ids = [c.id for c in children]

        # ── Campaigns ────────────────────────────────────────────
        print("Seeding campaigns...")
        campaigns = [
            Campaign(
                title="春天的色彩 — 乡村儿童画展",
                description="征集来自全国各地乡村小学孩子们的画作，展示他们眼中的春天。优秀作品将在城市美术馆展出，并制成公益明信片义卖。",
                cover_image="/static/campaigns/campaign1.jpg",
                start_date=datetime(2025, 3, 1),
                end_date=datetime(2025, 6, 30),
                goal_amount=Decimal("50000.00"),
                current_amount=Decimal("32500.00"),
                status="active",
                participant_count=150,
                artwork_count=8,
            ),
            Campaign(
                title="我的家乡 — 故土记忆",
                description="邀请孩子们用画笔记录家乡的山川河流、风土人情。记录正在消失的乡村记忆，唤起社会对乡土文化的关注。",
                cover_image="/static/campaigns/campaign2.jpg",
                start_date=datetime(2025, 7, 1),
                end_date=datetime(2025, 10, 31),
                goal_amount=Decimal("80000.00"),
                current_amount=Decimal("15000.00"),
                status="active",
                participant_count=95,
                artwork_count=7,
            ),
            Campaign(
                title="画出未来 — 科技与梦想",
                description="以'未来科技'为主题，鼓励孩子们大胆想象未来世界。获奖作品将用于制作可持续时尚 T 恤图案，收益全部用于乡村美育。",
                cover_image="/static/campaigns/campaign3.jpg",
                start_date=datetime(2025, 11, 1),
                end_date=datetime(2026, 2, 28),
                goal_amount=Decimal("100000.00"),
                current_amount=Decimal("8500.00"),
                status="active",
                participant_count=60,
                artwork_count=5,
            ),
        ]
        session.add_all(campaigns)
        await session.flush()
        campaign_ids = [c.id for c in campaigns]

        # ── Artworks ─────────────────────────────────────────────
        print("Seeding artworks...")
        artwork_data = [
            ("春天的花园", "用蜡笔描绘的五彩花园", "小明", "approved", 128, 560, 0, child_ids[0]),
            ("彩虹鱼", "水彩画出的深海彩虹鱼", "小红", "approved", 95, 430, 0, child_ids[1]),
            ("我的家", "温暖的家，有爸爸妈妈和小狗", "小丽", "approved", 210, 890, 1, child_ids[2]),
            ("星星之夜", "梵高风格的星空临摹", "小刚", "featured", 350, 1200, 0, child_ids[3]),
            ("山间小溪", "写生画：家乡的小溪", "小芳", "approved", 78, 320, 1, child_ids[5]),
            ("小猫咪", "我的第一只猫咪朋友", "小杰", "approved", 160, 670, 2, child_ids[6]),
            ("丰收的秋天", "金黄色的稻田和农民伯伯", "小雨", "pending", 45, 180, None, child_ids[4]),
            ("雪人一家", "冬天堆的雪人全家福", "小雪", "approved", 190, 780, 0, child_ids[7]),
            ("海豚之歌", "蓝色大海中跳跃的海豚", "小海", "approved", 130, 520, 1, child_ids[8]),
            ("老房子", "记录村里即将拆除的老房子", "小明", "approved", 88, 390, 2, child_ids[0]),
            ("妈妈的手", "画妈妈做家务的双手", "小花", "featured", 280, 1050, 0, child_ids[9]),
            ("夏日池塘", "荷叶上的青蛙和蜻蜓", "小丽", "approved", 105, 440, 1, child_ids[2]),
            ("我的梦想", "穿上白大褂当医生", "小红", "approved", 175, 710, 2, child_ids[1]),
            ("田野之歌", "风吹麦浪的田野", "小明", "approved", 62, 290, None, child_ids[0]),
            ("太空旅行", "坐火箭去月球", "小刚", "approved", 140, 580, 0, child_ids[3]),
            ("好朋友", "和朋友们在操场上玩", "小雨", "pending", 30, 120, None, child_ids[4]),
            ("雨后彩虹", "暴雨过后的双彩虹", "小丽", "approved", 92, 410, 1, child_ids[2]),
            ("过年了", "放鞭炮贴春联的热闹场面", "小雪", "approved", 220, 900, 2, child_ids[7]),
            ("未来城市", "飞行汽车和太阳能大楼", "小海", "approved", 115, 470, 0, child_ids[8]),
            ("牧羊曲", "草原上的小牧童和羊群", "小芳", "approved", 85, 350, 1, child_ids[5]),
        ]
        artworks = []
        for i, (title, desc, artist, status, likes, views, ci, cpid) in enumerate(artwork_data):
            artworks.append(
                Artwork(
                    title=title,
                    description=desc,
                    image_url=f"/static/artworks/artwork_{i + 1}.jpg",
                    thumbnail_url=f"/static/artworks/thumb_{i + 1}.jpg",
                    child_participant_id=cpid,
                    artist_name=artist,
                    status=status,
                    like_count=likes,
                    view_count=views,
                    campaign_id=campaign_ids[ci] if ci is not None else None,
                )
            )
        session.add_all(artworks)
        await session.flush()

        # ── Products ─────────────────────────────────────────────
        print("Seeding products...")
        products = [
            Product(
                name="彩虹鱼棉质 T 恤",
                description="采用有机棉面料，印有获奖作品《彩虹鱼》。每件 T 恤的收益 30% 用于乡村美育基金。",
                price=Decimal("168.00"), currency="CNY",
                image_url="/static/products/tshirt1.jpg", category="服装", stock=200, status="active",
            ),
            Product(
                name="星星之夜帆布袋",
                description="再生帆布材质，印有梵高风格星空画作。环保材质，可持续时尚。",
                price=Decimal("89.00"), currency="CNY",
                image_url="/static/products/bag1.jpg", category="配饰", stock=150, status="active",
            ),
            Product(
                name="春天的花园丝巾",
                description="100% 真丝面料，孩子们的画作化为丝巾图案，每一条都是独一无二的艺术品。",
                price=Decimal("258.00"), currency="CNY",
                image_url="/static/products/scarf1.jpg", category="配饰", stock=80, status="active",
            ),
            Product(
                name="妈妈的手环保笔记本",
                description="再生纸制作，封面印有《妈妈的手》。可用于记录生活中的美好瞬间。",
                price=Decimal("39.00"), currency="CNY",
                image_url="/static/products/notebook1.jpg", category="文具", stock=500, status="active",
            ),
            Product(
                name="太空旅行马克杯",
                description="陶瓷马克杯，印有《太空旅行》画作。送给每个梦想家。",
                price=Decimal("68.00"), currency="CNY",
                image_url="/static/products/cup1.jpg", category="生活", stock=120, status="active",
            ),
            Product(
                name="我的家帆布鞋",
                description="有机棉帆布鞋面，可降解鞋底。鞋侧印有《我的家》画作。",
                price=Decimal("198.00"), currency="CNY",
                image_url="/static/products/shoes1.jpg", category="鞋履", stock=0, status="sold_out",
            ),
            Product(
                name="画出未来环保抱枕",
                description="再生棉填充，有机棉外套。科幻画作成为你客厅的亮点。",
                price=Decimal("128.00"), currency="CNY",
                image_url="/static/products/pillow1.jpg", category="家居", stock=90, status="active",
            ),
            Product(
                name="过年了限定礼盒",
                description="包含 T 恤、帆布袋、笔记本三件套，精美包装。限量 100 套。",
                price=Decimal("368.00"), currency="CNY",
                image_url="/static/products/giftbox1.jpg", category="礼盒", stock=35, status="active",
            ),
        ]
        session.add_all(products)
        await session.flush()
        product_ids = [p.id for p in products]

        # ── Supply Chain Records ─────────────────────────────────
        print("Seeding supply chain records...")
        supply_records = [
            SupplyChainRecord(
                product_id=product_ids[0], stage="material_sourcing",
                description="有机棉来自新疆阿克苏有机棉田，GOTS 认证",
                location="新疆阿克苏", certified=True,
                cert_image_url="/static/certs/gots_cert.jpg",
                timestamp=datetime(2025, 2, 1),
            ),
            SupplyChainRecord(
                product_id=product_ids[0], stage="processing",
                description="纱线纺织与面料染色，使用植物染料，无有害化学品",
                location="浙江绍兴", certified=True,
                cert_image_url="/static/certs/oeko_cert.jpg",
                timestamp=datetime(2025, 2, 15),
            ),
            SupplyChainRecord(
                product_id=product_ids[0], stage="manufacturing",
                description="成衣裁剪与缝制，ISO 9001 质量管理体系工厂",
                location="广东深圳", certified=True,
                cert_image_url="/static/certs/iso9001.jpg",
                timestamp=datetime(2025, 3, 1),
            ),
            SupplyChainRecord(
                product_id=product_ids[0], stage="quality_check",
                description="成品质量检验，甲醛含量、色牢度等 12 项指标检测",
                location="广东深圳", certified=True,
                timestamp=datetime(2025, 3, 10),
            ),
            SupplyChainRecord(
                product_id=product_ids[0], stage="shipping",
                description="使用可降解包装材料，碳中和物流",
                location="全国配送", certified=False,
                timestamp=datetime(2025, 3, 15),
            ),
        ]
        session.add_all(supply_records)
        await session.flush()

        # ── Donations ────────────────────────────────────────────
        print("Seeding donations...")
        donations = [
            Donation(
                donor_name="张先生", donor_user_id=user_ids[2],
                amount=Decimal("500.00"), currency="CNY", payment_method="wechat",
                payment_id="wx20250301123456", campaign_id=campaign_ids[0],
                status="completed", is_anonymous=False, message="支持孩子们的艺术梦想！",
            ),
            Donation(
                donor_name="李女士", donor_user_id=user_ids[3],
                amount=Decimal("1000.00"), currency="CNY", payment_method="alipay",
                payment_id="ali20250302654321", campaign_id=campaign_ids[0],
                status="completed", is_anonymous=False, message="为乡村美育尽一份力",
            ),
            Donation(
                donor_name="匿名好心人", donor_user_id=None,
                amount=Decimal("2000.00"), currency="CNY", payment_method="wechat",
                payment_id="wx20250303789012", campaign_id=campaign_ids[1],
                status="completed", is_anonymous=True, message=None,
            ),
            Donation(
                donor_name="John Smith", donor_user_id=None,
                amount=Decimal("100.00"), currency="USD", payment_method="stripe",
                payment_id="pi_stripe_001", campaign_id=campaign_ids[0],
                status="completed", is_anonymous=False, message="Happy to support!",
            ),
            Donation(
                donor_name="王先生", donor_user_id=user_ids[4],
                amount=Decimal("300.00"), currency="CNY", payment_method="wechat",
                payment_id="wx20250306345678", campaign_id=campaign_ids[1],
                status="completed", is_anonymous=False, message="保护我们的乡村记忆",
            ),
            Donation(
                donor_name="赵女士", donor_user_id=None,
                amount=Decimal("5000.00"), currency="CNY", payment_method="alipay",
                payment_id="ali20250310901234", campaign_id=campaign_ids[2],
                status="completed", is_anonymous=False, message="科技改变未来，希望改变孩子",
            ),
            Donation(
                donor_name="陈先生", donor_user_id=None,
                amount=Decimal("200.00"), currency="CNY", payment_method="wechat",
                payment_id="wx20250315567890", campaign_id=None,
                status="completed", is_anonymous=True, message="支持公益",
            ),
            Donation(
                donor_name="Emily Wang", donor_user_id=None,
                amount=Decimal("50.00"), currency="USD", payment_method="paypal",
                payment_id="pp_20250316", campaign_id=campaign_ids[0],
                status="completed", is_anonymous=False, message="Beautiful cause!",
            ),
            Donation(
                donor_name="刘先生", donor_user_id=None,
                amount=Decimal("1500.00"), currency="CNY", payment_method="wechat",
                payment_id="wx20250320123789", campaign_id=campaign_ids[1],
                status="pending", is_anonymous=False, message="家乡永远在心中",
            ),
            Donation(
                donor_name="孙女士", donor_user_id=None,
                amount=Decimal("800.00"), currency="CNY", payment_method="alipay",
                payment_id="ali20250325456789", campaign_id=campaign_ids[0],
                status="completed", is_anonymous=False, message="愿每个孩子都能画画",
            ),
        ]
        session.add_all(donations)
        await session.flush()

        # ── Orders ───────────────────────────────────────────────
        print("Seeding orders...")
        orders = [
            Order(
                user_id=user_ids[2], order_no="TH2025040110001",
                total_amount=Decimal("257.00"), status="completed",
                shipping_address="北京市朝阳区建国路88号",
                payment_method="wechat", payment_id="wx_order_001",
            ),
            Order(
                user_id=user_ids[3], order_no="TH2025040514002",
                total_amount=Decimal("258.00"), status="shipped",
                shipping_address="上海市浦东新区陆家嘴环路1000号",
                payment_method="alipay", payment_id="ali_order_002",
            ),
            Order(
                user_id=user_ids[4], order_no="TH2025041016003",
                total_amount=Decimal("368.00"), status="paid",
                shipping_address="广州市天河区体育西路103号",
                payment_method="wechat", payment_id="wx_order_003",
            ),
            Order(
                user_id=user_ids[2], order_no="TH2025041511004",
                total_amount=Decimal("157.00"), status="pending",
                shipping_address="北京市朝阳区建国路88号",
                payment_method=None, payment_id=None,
            ),
            Order(
                user_id=user_ids[3], order_no="TH2025042009005",
                total_amount=Decimal("326.00"), status="completed",
                shipping_address="上海市浦东新区陆家嘴环路1000号",
                payment_method="alipay", payment_id="ali_order_005",
            ),
        ]
        session.add_all(orders)
        await session.flush()

        # Order Items
        order_items = [
            OrderItem(order_id=orders[0].id, product_id=product_ids[0], quantity=1, price=Decimal("168.00")),
            OrderItem(order_id=orders[0].id, product_id=product_ids[3], quantity=2, price=Decimal("39.00")),
            OrderItem(order_id=orders[1].id, product_id=product_ids[2], quantity=1, price=Decimal("258.00")),
            OrderItem(order_id=orders[2].id, product_id=product_ids[7], quantity=1, price=Decimal("368.00")),
            OrderItem(order_id=orders[3].id, product_id=product_ids[1], quantity=1, price=Decimal("89.00")),
            OrderItem(order_id=orders[3].id, product_id=product_ids[4], quantity=1, price=Decimal("68.00")),
            OrderItem(order_id=orders[4].id, product_id=product_ids[0], quantity=1, price=Decimal("168.00")),
            OrderItem(order_id=orders[4].id, product_id=product_ids[6], quantity=1, price=Decimal("128.00")),
        ]
        session.add_all(order_items)
        await session.flush()

        # ── Audit Logs ───────────────────────────────────────────
        print("Seeding audit logs...")
        audit_logs = [
            AuditLog(user_id=user_ids[0], user_name="管理员", action="login", resource="auth",
                     details="管理员登录成功", ip_address="192.168.1.100"),
            AuditLog(user_id=user_ids[0], user_name="管理员", action="create", resource="campaign",
                     resource_id="1", details="创建活动：春天的色彩", ip_address="192.168.1.100"),
            AuditLog(user_id=user_ids[0], user_name="管理员", action="update", resource="artwork",
                     resource_id="4", details="将作品《星星之夜》设为推荐", ip_address="192.168.1.100"),
            AuditLog(user_id=user_ids[1], user_name="编辑小王", action="create", resource="product",
                     resource_id="1", details="上架商品：彩虹鱼棉质 T 恤", ip_address="192.168.1.101"),
            AuditLog(user_id=user_ids[1], user_name="编辑小王", action="approve", resource="artwork",
                     resource_id="7", details="审核通过作品《丰收的秋天》", ip_address="192.168.1.101"),
        ]
        session.add_all(audit_logs)

        await session.commit()
        print("Seed complete!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
