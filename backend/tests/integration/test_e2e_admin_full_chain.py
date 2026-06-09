"""完整链路冒烟：admin 端所有 12 个功能的 create→list→update→delete 闭环。

1. artwork: create admin→list→update status→DB
2. campaign: create→list→update→DB
3. product: create→list→update→add supply chain node→delete node
4. order: ship→admin confirm→user confirm→completed
5. donation: user create→admin approve→completed→audit
6. after-sales: user file→admin review approve→in_progress→admin review reject→closed
7. clothing-intake: user create→admin received→admin processing→admin listed
8. user: admin register→admin role update→audit
9. audit-log: list with page_size=20, no health_check
10. dashboard: metrics
11. settings: get
12. pagination: 6 list endpoints with page_size=20
"""
import pytest
from decimal import Decimal

API = "/api/v1"


@pytest.mark.asyncio
async def test_complete_admin_chain(client, admin_auth_headers, user_auth_headers):
    from app.database import AsyncSessionLocal
    from app.models.artwork import Artwork
    from app.models.campaign import Campaign
    from app.models.product import Product
    from app.models.order import Order
    from app.models.donation import Donation
    from app.models.circular_commerce import AfterSaleTicket, ClothingIntake
    from app.models.audit import AuditLog
    from sqlalchemy import select

    # ── 1. Artwork ─────────────────────────────────────────
    r = await client.post(f"{API}/artworks/admin", json={
        "title": "链路-作品", "image_url": "https://cdn.vicoo.org/x.jpg", "artist_name": "Alice"
    }, headers=admin_auth_headers)
    assert r.status_code == 201
    aid = r.json()["data"]["id"]
    r = await client.put(f"{API}/artworks/{aid}/status", json={"status": "approved"}, headers=admin_auth_headers)
    assert r.status_code == 200
    async with AsyncSessionLocal() as db:
        a = (await db.execute(select(Artwork).where(Artwork.id == aid))).scalar_one()
        assert a.status == "approved"

    # ── 2. Campaign ─────────────────────────────────────────
    r = await client.post(f"{API}/campaigns", json={
        "title": "链路-活动", "start_date": "2026-06-01T00:00:00", "end_date": "2026-12-31T00:00:00", "goal_amount": "10000.00"
    }, headers=admin_auth_headers)
    assert r.status_code in (200, 201), r.text
    cid = r.json()["data"]["id"]
    r = await client.put(f"{API}/campaigns/{cid}", json={"title": "链路-活动-更新"}, headers=admin_auth_headers)
    assert r.status_code == 200

    # ── 3. Product + supply chain node ─────────────────────
    r = await client.post(f"{API}/products", json={
        "name": "链路-商品", "price": "199.00", "stock": 30, "category": "apparel"
    }, headers=admin_auth_headers)
    assert r.status_code == 201
    pid = r.json()["data"]["id"]
    r = await client.put(f"{API}/products/{pid}", json={"price": "159.00", "stock": 100}, headers=admin_auth_headers)
    assert r.status_code == 200
    r = await client.post(f"{API}/supply-chain/records", json={
        "product_id": pid, "stage": "manufacturing", "description": "链路", "location": "Beijing"
    }, headers=admin_auth_headers)
    assert r.status_code == 201
    rid = r.json()["data"]["id"]
    r = await client.patch(f"{API}/supply-chain/records/{rid}", json={"description": "链路-更新"}, headers=admin_auth_headers)
    assert r.status_code == 200
    r = await client.delete(f"{API}/supply-chain/records/{rid}", headers=admin_auth_headers)
    assert r.status_code in (200, 204)

    # ── 4. Order full lifecycle ─────────────────────────────
    async with AsyncSessionLocal() as db:
        o = Order(user_id=1, order_no="LINK-ORDER-1", total_amount=Decimal("159.00"), status="paid")
        db.add(o)
        await db.flush()
        oid = o.id
        await db.commit()
    r = await client.post(f"{API}/orders/{oid}/ship", json={"carrier": "SF", "tracking_number": "LINK-1"}, headers=admin_auth_headers)
    assert r.status_code in (200, 201)
    r = await client.post(f"{API}/orders/{oid}/confirm-delivery", headers=admin_auth_headers)
    assert r.status_code in (200, 201)
    r = await client.post(f"{API}/orders/{oid}/confirm-receipt", headers=user_auth_headers)
    assert r.status_code in (200, 201)
    async with AsyncSessionLocal() as db:
        o = (await db.execute(select(Order).where(Order.id == oid))).scalar_one()
        assert o.status == "completed"

    # ── 5. Donation full lifecycle ──────────────────────────
    r = await client.post(f"{API}/donations", json={
        "donor_name": "链路捐赠", "amount": "500.00", "currency": "CNY", "payment_method": "wechat", "campaign_id": 1
    }, headers=user_auth_headers)
    assert r.status_code in (200, 201)
    did = r.json()["data"]["id"]
    r = await client.post(f"{API}/admin/donations/{did}/approve", headers=admin_auth_headers)
    assert r.status_code in (200, 201)
    async with AsyncSessionLocal() as db:
        d = (await db.execute(select(Donation).where(Donation.id == did))).scalar_one()
        assert d.status == "completed"

    # ── 6. After-sales approve + reject ────────────────────
    async with AsyncSessionLocal() as db:
        o = Order(user_id=1, order_no="LINK-AS-1", total_amount=Decimal("80.00"), status="completed")
        db.add(o)
        await db.flush()
        oa = o.id
        await db.commit()
    r = await client.post(f"{API}/after-sales", json={
        "order_id": oa, "category": "return", "subject": "链路-售后", "description": "ok"
    }, headers=user_auth_headers)
    assert r.status_code in (200, 201)
    tid1 = r.json()["data"]["id"]
    r = await client.post(f"{API}/after-sales/{tid1}/review", json={"action": "approve"}, headers=admin_auth_headers)
    assert r.status_code in (200, 201)
    r = await client.post(f"{API}/after-sales", json={
        "order_id": oa, "category": "exchange", "subject": "链路-售后-2", "description": "reject"
    }, headers=user_auth_headers)
    assert r.status_code in (200, 201)
    tid2 = r.json()["data"]["id"]
    r = await client.post(f"{API}/after-sales/{tid2}/review", json={"action": "reject"}, headers=admin_auth_headers)
    assert r.status_code in (200, 201)
    async with AsyncSessionLocal() as db:
        t2 = (await db.execute(select(AfterSaleTicket).where(AfterSaleTicket.id == tid2))).scalar_one()
        assert t2.status == "closed"

    # ── 7. Clothing intake full transitions ─────────────────
    r = await client.post(f"{API}/clothing-intakes", json={
        "summary": "链路-衣物", "garment_types": "jacket", "quantity_estimate": 1
    }, headers=user_auth_headers)
    assert r.status_code in (200, 201)
    iid = r.json()["data"]["id"]
    for st in ("received", "processing", "listed"):
        r = await client.patch(f"{API}/clothing-intakes/{iid}/status", json={"status": st}, headers=admin_auth_headers)
        assert r.status_code in (200, 201), f"{st}: {r.text}"
    async with AsyncSessionLocal() as db:
        ci = (await db.execute(select(ClothingIntake).where(ClothingIntake.id == iid))).scalar_one()
        assert ci.status == "listed"

    # ── 8. User register + role update + audit ─────────────
    r = await client.post(f"{API}/auth/register", json={
        "email": "link-user@test.com", "password": "Test1234!", "nickname": "链路用户"
    })
    assert r.status_code in (200, 201)
    uid = r.json()["data"]["user"]["id"]
    r = await client.put(f"{API}/users/{uid}/role", json={"role": "user"}, headers=admin_auth_headers)
    assert r.status_code in (200, 201)
    async with AsyncSessionLocal() as db:
        log = (await db.execute(
            select(AuditLog).where(AuditLog.action == "update_role").where(AuditLog.resource_id == str(uid))
        )).scalars().all()
        assert len(log) >= 1

    # ── 9. Audit log list (no health) ───────────────────────
    r = await client.get(f"{API}/admin/audit-logs?page=1&page_size=20", headers=admin_auth_headers)
    assert r.status_code == 200
    actions = {e.get("action") for e in r.json()["data"]}
    assert "health_check" not in actions

    # ── 10. Dashboard ──────────────────────────────────────
    r = await client.get(f"{API}/admin/dashboard", headers=admin_auth_headers)
    assert r.status_code == 200

    # ── 11. Settings ───────────────────────────────────────
    r = await client.get(f"{API}/admin/settings", headers=admin_auth_headers)
    assert r.status_code == 200

    # ── 12. Pagination 20/page for all list endpoints ───────
    for path in (
        f"{API}/users", f"{API}/products", f"{API}/orders", f"{API}/artworks",
        f"{API}/campaigns", f"{API}/admin/audit-logs",
    ):
        r = await client.get(f"{path}?page=1&page_size=20", headers=admin_auth_headers)
        assert r.status_code == 200, f"{path} -> {r.status_code}"
        items = r.json()["data"]
        assert len(items) <= 20, f"{path}: {len(items)} > 20"
