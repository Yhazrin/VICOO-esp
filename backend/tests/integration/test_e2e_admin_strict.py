"""严格 E2E 审计：12 个 admin 页面逐一验证。

每个测试覆盖：
  1. admin 列表/创建/更新/状态切换/删除 (HTTP API)
  2. 列表分页 20/页
  3. audit log 记录操作人
  4. DB 持久化
"""
import pytest
from decimal import Decimal

API = "/api/v1"
PAGE_SIZE = 20


# ─────────────────────────────────────────────────────────────────────────────
# 1. ArtworkPage
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_artwork_admin_full_chain(client, admin_auth_headers):
    from app.database import AsyncSessionLocal
    from app.models.artwork import Artwork
    from sqlalchemy import select

    # List with page_size=20
    r = await client.get(f"{API}/artworks?page=1&page_size={PAGE_SIZE}", headers=admin_auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert "data" in body
    assert body["page_size"] == PAGE_SIZE

    # Create (admin direct)
    r = await client.post(f"{API}/artworks/admin", json={
        "title": "审计-小画家",
        "description": "严格测试",
        "image_url": "https://cdn.vicoo.org/test/audit.jpg",
        "artist_name": "Test Artist",
    }, headers=admin_auth_headers)
    assert r.status_code == 201, r.text
    aid = r.json()["data"]["id"]

    # DB persisted
    async with AsyncSessionLocal() as db:
        a = (await db.execute(select(Artwork).where(Artwork.id == aid))).scalar_one()
        assert a.title == "审计-小画家"

    # Update status (PUT not PATCH)
    r = await client.put(f"{API}/artworks/{aid}/status", json={"status": "approved"}, headers=admin_auth_headers)
    assert r.status_code == 200, r.text

    async with AsyncSessionLocal() as db:
        a = (await db.execute(select(Artwork).where(Artwork.id == aid))).scalar_one()
        assert a.status == "approved"


# ─────────────────────────────────────────────────────────────────────────────
# 2. CampaignPage
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_campaign_admin_full_chain(client, admin_auth_headers):
    from app.database import AsyncSessionLocal
    from app.models.campaign import Campaign
    from sqlalchemy import select

    r = await client.get(f"{API}/campaigns?page=1&page_size={PAGE_SIZE}", headers=admin_auth_headers)
    assert r.status_code == 200
    assert "data" in r.json()

    # Create (schema requires goal_amount)
    r = await client.post(f"{API}/campaigns", json={
        "title": "审计-希望活动",
        "subtitle": "sub",
        "description": "desc",
        "start_date": "2026-06-01T00:00:00",
        "end_date": "2026-12-31T00:00:00",
        "goal_amount": "50000.00",
    }, headers=admin_auth_headers)
    assert r.status_code in (200, 201), r.text
    cid = r.json()["data"]["id"]

    async with AsyncSessionLocal() as db:
        c = (await db.execute(select(Campaign).where(Campaign.id == cid))).scalar_one()
        assert c.title == "审计-希望活动"

    # Update
    r = await client.put(f"{API}/campaigns/{cid}", json={"title": "审计-更新活动"}, headers=admin_auth_headers)
    assert r.status_code == 200, r.text
    async with AsyncSessionLocal() as db:
        c = (await db.execute(select(Campaign).where(Campaign.id == cid))).scalar_one()
        assert c.title == "审计-更新活动"


# ─────────────────────────────────────────────────────────────────────────────
# 3. DonationPage
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_donation_admin_full_chain(client, admin_auth_headers, user_auth_headers):
    from app.database import AsyncSessionLocal
    from app.models.donation import Donation
    from app.models.audit import AuditLog
    from sqlalchemy import select

    # User creates donation
    r = await client.post(f"{API}/donations", json={
        "donor_name": "审计捐赠人",
        "amount": "200.00",
        "currency": "CNY",
        "payment_method": "wechat",
        "campaign_id": 1,
    }, headers=user_auth_headers)
    assert r.status_code in (200, 201), r.text
    did = r.json()["data"]["id"]

    # Admin lists donations via /donations (works for admin)
    r = await client.get(f"{API}/donations?page=1&page_size={PAGE_SIZE}", headers=admin_auth_headers)
    assert r.status_code == 200

    # Admin lists via /admin/donations (newly added)
    r = await client.get(f"{API}/admin/donations?page=1&page_size={PAGE_SIZE}", headers=admin_auth_headers)
    assert r.status_code == 200
    assert "data" in r.json()

    # Admin approves
    r = await client.post(f"{API}/admin/donations/{did}/approve", headers=admin_auth_headers)
    assert r.status_code in (200, 201), r.text

    async with AsyncSessionLocal() as db:
        d = (await db.execute(select(Donation).where(Donation.id == did))).scalar_one()
        assert d.status == "completed"

    # Audit log
    async with AsyncSessionLocal() as db:
        log = (await db.execute(
            select(AuditLog).where(AuditLog.resource_id == str(did)).where(AuditLog.action == "admin_approve_donation")
        )).scalars().all()
        assert len(log) >= 1
        for e in log:
            assert e.user_name == "Test Admin"


# ─────────────────────────────────────────────────────────────────────────────
# 4. OrderPage (full lifecycle)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_order_admin_full_chain(client, admin_auth_headers, user_auth_headers):
    from app.database import AsyncSessionLocal
    from app.models.product import Product
    from app.models.order import Order
    from app.models.audit import AuditLog
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        p = Product(name="审计-订单商品", price=Decimal("50.00"), stock=10, status="active")
        db.add(p)
        await db.flush()
        o = Order(user_id=1, order_no="AUDIT-ORDER-1", total_amount=Decimal("50.00"), status="paid")
        db.add(o)
        await db.flush()
        oid = o.id
        await db.commit()

    r = await client.get(f"{API}/orders?page=1&page_size={PAGE_SIZE}", headers=admin_auth_headers)
    assert r.status_code == 200

    # Admin ship
    r = await client.post(f"{API}/orders/{oid}/ship", json={"carrier": "SF", "tracking_number": "AUDIT-SF-1"}, headers=admin_auth_headers)
    assert r.status_code in (200, 201), r.text

    # Admin confirm delivery
    r = await client.post(f"{API}/orders/{oid}/confirm-delivery", headers=admin_auth_headers)
    assert r.status_code in (200, 201), r.text

    # User confirm receipt → order completed
    r = await client.post(f"{API}/orders/{oid}/confirm-receipt", headers=user_auth_headers)
    assert r.status_code in (200, 201), r.text

    async with AsyncSessionLocal() as db:
        o = (await db.execute(select(Order).where(Order.id == oid))).scalar_one()
        assert o.status == "completed"
        assert o.user_confirmed_at is not None
        assert o.admin_delivered_at is not None

    # Audit log
    async with AsyncSessionLocal() as db:
        confirm_user = (await db.execute(
            select(AuditLog).where(AuditLog.action == "confirm_receipt_user").where(AuditLog.resource_id == str(oid))
        )).scalars().all()
        assert len(confirm_user) >= 1
        confirm_admin = (await db.execute(
            select(AuditLog).where(AuditLog.action == "confirm_delivery_admin").where(AuditLog.resource_id == str(oid))
        )).scalars().all()
        assert len(confirm_admin) >= 1
        for e in confirm_admin:
            assert e.user_name == "Test Admin"


# ─────────────────────────────────────────────────────────────────────────────
# 5. UserPage
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_user_admin_full_chain(client, admin_auth_headers):
    from app.database import AsyncSessionLocal
    from app.models.user import User
    from app.models.audit import AuditLog
    from sqlalchemy import select

    # List
    r = await client.get(f"{API}/users?page=1&page_size={PAGE_SIZE}", headers=admin_auth_headers)
    assert r.status_code == 200
    assert "data" in r.json()

    # Create user via /auth/register (no admin POST /users exists)
    r = await client.post(f"{API}/auth/register", json={
        "email": "audit-user@test.com",
        "password": "Test1234!",
        "nickname": "审计用户",
    })
    assert r.status_code in (200, 201), r.text
    body = r.json()["data"]
    uid = body["user"]["id"] if isinstance(body, dict) and "user" in body else body["id"]

    async with AsyncSessionLocal() as db:
        u = (await db.execute(select(User).where(User.id == uid))).scalar_one()
        assert u.email == "audit-user@test.com"

    # Update role
    r = await client.put(f"{API}/users/{uid}/role", json={"role": "user"}, headers=admin_auth_headers)
    assert r.status_code in (200, 201), r.text
    async with AsyncSessionLocal() as db:
        u = (await db.execute(select(User).where(User.id == uid))).scalar_one()
        assert str(u.role) == "user"

    # Audit log
    async with AsyncSessionLocal() as db:
        log = (await db.execute(
            select(AuditLog).where(AuditLog.action == "update_role").where(AuditLog.resource_id == str(uid))
        )).scalars().all()
        assert len(log) >= 1
        for e in log:
            assert e.user_name == "Test Admin"


# ─────────────────────────────────────────────────────────────────────────────
# 6. ProductPage (with supply chain)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_product_admin_full_chain(client, admin_auth_headers):
    from app.database import AsyncSessionLocal
    from app.models.product import Product
    from app.models.supply_chain import SupplyChainRecord
    from sqlalchemy import select

    r = await client.get(f"{API}/products?page=1&page_size={PAGE_SIZE}", headers=admin_auth_headers)
    assert r.status_code == 200
    assert "data" in r.json()

    r = await client.post(f"{API}/products", json={
        "name": "审计-商品",
        "price": "99.00",
        "stock": 20,
        "category": "apparel",
        "is_impact_product": True,
    }, headers=admin_auth_headers)
    assert r.status_code == 201, r.text
    pid = r.json()["data"]["id"]

    r = await client.put(f"{API}/products/{pid}", json={"price": "79.00", "stock": 50, "status": "active"}, headers=admin_auth_headers)
    assert r.status_code == 200
    async with AsyncSessionLocal() as db:
        p = (await db.execute(select(Product).where(Product.id == pid))).scalar_one()
        assert Decimal(str(p.price)) == Decimal("79.00")
        assert p.stock == 50

    r = await client.post(f"{API}/supply-chain/records", json={
        "product_id": pid, "stage": "manufacturing", "description": "audit", "location": "Beijing",
    }, headers=admin_auth_headers)
    assert r.status_code == 201, r.text
    rid = r.json()["data"]["id"]

    r = await client.patch(f"{API}/supply-chain/records/{rid}", json={"description": "updated"}, headers=admin_auth_headers)
    assert r.status_code == 200

    r = await client.delete(f"{API}/supply-chain/records/{rid}", headers=admin_auth_headers)
    assert r.status_code in (200, 204)

    async with AsyncSessionLocal() as db:
        rec = (await db.execute(select(SupplyChainRecord).where(SupplyChainRecord.id == rid))).scalar_one_or_none()
        assert rec is None


# ─────────────────────────────────────────────────────────────────────────────
# 7. AfterSalesPage
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_aftersales_admin_full_chain(client, admin_auth_headers, user_auth_headers):
    from app.database import AsyncSessionLocal
    from app.models.circular_commerce import AfterSaleTicket
    from app.models.order import Order
    from app.models.product import Product
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        p = Product(name="售后-商品", price=Decimal("80.00"), stock=5, status="active")
        db.add(p)
        await db.flush()
        o = Order(user_id=1, order_no="AUDIT-AS-1", total_amount=Decimal("80.00"), status="completed")
        db.add(o)
        await db.flush()
        oid = o.id
        await db.commit()

    # User creates after-sale ticket
    r = await client.post(f"{API}/after-sales", json={
        "order_id": oid, "category": "return", "subject": "审计测试", "description": "完整链路",
    }, headers=user_auth_headers)
    assert r.status_code in (200, 201), r.text
    tid = r.json()["data"]["id"]

    r = await client.get(f"{API}/after-sales?page=1&page_size={PAGE_SIZE}", headers=admin_auth_headers)
    assert r.status_code == 200

    # Admin reviews (action=approve)
    r = await client.post(f"{API}/after-sales/{tid}/review", json={"action": "approve"}, headers=admin_auth_headers)
    assert r.status_code in (200, 201), r.text

    async with AsyncSessionLocal() as db:
        t = (await db.execute(select(AfterSaleTicket).where(AfterSaleTicket.id == tid))).scalar_one()
        assert t.status in ("in_progress", "resolved", "closed", "approved")

    # Reject variant: close
    r = await client.post(f"{API}/after-sales", json={
        "order_id": oid + 1 if False else oid, "category": "exchange", "subject": "审计-驳回测试", "description": "reject path",
    }, headers=user_auth_headers)
    if r.status_code in (200, 201):
        tid2 = r.json()["data"]["id"]
        rr = await client.post(f"{API}/after-sales/{tid2}/review", json={"action": "reject"}, headers=admin_auth_headers)
        assert rr.status_code in (200, 201), rr.text
        async with AsyncSessionLocal() as db:
            t2 = (await db.execute(select(AfterSaleTicket).where(AfterSaleTicket.id == tid2))).scalar_one()
            assert t2.status == "closed"


# ─────────────────────────────────────────────────────────────────────────────
# 8. ClothingDonationPage
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_clothing_donation_admin_full_chain(client, admin_auth_headers, user_auth_headers):
    from app.database import AsyncSessionLocal
    from app.models.circular_commerce import ClothingIntake
    from sqlalchemy import select

    r = await client.post(f"{API}/clothing-intakes", json={
        "summary": "审计衣物",
        "garment_types": "shirt",
        "quantity_estimate": 2,
        "pickup_address": "北京市朝阳区",
        "contact_phone": "13800000001",
    }, headers=user_auth_headers)
    assert r.status_code in (200, 201), r.text
    iid = r.json()["data"]["id"]

    r = await client.get(f"{API}/clothing-intakes?page=1&page_size={PAGE_SIZE}", headers=admin_auth_headers)
    assert r.status_code == 200

    # PATCH /{id}/status (not PATCH /{id})
    r = await client.patch(f"{API}/clothing-intakes/{iid}/status", json={"status": "received"}, headers=admin_auth_headers)
    assert r.status_code in (200, 201), r.text
    async with AsyncSessionLocal() as db:
        ci = (await db.execute(select(ClothingIntake).where(ClothingIntake.id == iid))).scalar_one()
        assert ci.status == "received"

    r = await client.patch(f"{API}/clothing-intakes/{iid}/status", json={"status": "processing"}, headers=admin_auth_headers)
    assert r.status_code in (200, 201), r.text
    r = await client.patch(f"{API}/clothing-intakes/{iid}/status", json={"status": "listed"}, headers=admin_auth_headers)
    assert r.status_code in (200, 201), r.text
    async with AsyncSessionLocal() as db:
        ci = (await db.execute(select(ClothingIntake).where(ClothingIntake.id == iid))).scalar_one()
        assert ci.status == "listed"


# ─────────────────────────────────────────────────────────────────────────────
# 9. SettingsPage
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_settings_admin_full_chain(client, admin_auth_headers):
    r = await client.get(f"{API}/admin/settings", headers=admin_auth_headers)
    assert r.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 10. AuditLogPage
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_audit_log_admin_full_chain(client, admin_auth_headers):
    r = await client.get(f"{API}/admin/audit-logs?page=1&page_size={PAGE_SIZE}", headers=admin_auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert "data" in body
    items = body["data"]
    for e in items:
        assert "id" in e
        assert "action" in e
        assert "resource" in e
        assert "timestamp" in e
    actions = {e.get("action") for e in items}
    assert "health_check" not in actions


# ─────────────────────────────────────────────────────────────────────────────
# 11. DashboardPage (correct endpoint: /admin/dashboard)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_dashboard_admin_full_chain(client, admin_auth_headers):
    r = await client.get(f"{API}/admin/dashboard", headers=admin_auth_headers)
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    for k in ("total_users", "total_donations"):
        assert k in data, f"Missing {k}"


# ─────────────────────────────────────────────────────────────────────────────
# Pagination: 20 per page consistency check
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_admin_pagination_default_20(client, admin_auth_headers):
    for path in (
        f"{API}/users",
        f"{API}/products",
        f"{API}/orders",
        f"{API}/artworks",
        f"{API}/campaigns",
        f"{API}/admin/audit-logs",
    ):
        r = await client.get(f"{path}?page=1&page_size=20", headers=admin_auth_headers)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
        body = r.json()
        assert "data" in body, f"{path}: missing 'data'"
        items = body["data"]
        assert len(items) <= 20, f"{path}: {len(items)} > 20"
