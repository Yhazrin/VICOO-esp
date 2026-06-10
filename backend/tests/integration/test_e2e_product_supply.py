"""端到端集成测试：admin 修改商品 + 添加供应链节点，覆盖 Goal 子任务 #9。"""
import pytest
from decimal import Decimal


@pytest.mark.asyncio
async def test_admin_can_update_product_with_persistence(client, admin_auth_headers):
    """admin 改商品价格/库存 → DB 持久化，刷新后仍生效。"""
    payload = {
        "name": "供应链测试商品",
        "name_en": "Supply Chain Test Product",
        "price": "199.00",
        "stock": 30,
        "category": "apparel",
    }
    r = await client.post("/api/v1/products", json=payload, headers=admin_auth_headers)
    assert r.status_code == 201, r.text
    pid = r.json()["data"]["id"]

    upd = {"price": "159.00", "stock": 100, "status": "active"}
    r2 = await client.put(f"/api/v1/products/{pid}", json=upd, headers=admin_auth_headers)
    assert r2.status_code == 200, r2.text
    body = r2.json()["data"]
    assert Decimal(body["price"]) == Decimal("159.00")
    assert body["stock"] == 100
    assert body["status"] == "active"

    # Verify DB persistence
    from app.database import AsyncSessionLocal
    from app.models.product import Product
    from sqlalchemy import select
    async with AsyncSessionLocal() as db:
        p = (await db.execute(select(Product).where(Product.id == pid))).scalar_one()
        assert Decimal(str(p.price)) == Decimal("159.00")
        assert p.stock == 100


@pytest.mark.asyncio
async def test_admin_can_add_supply_chain_node(client, admin_auth_headers):
    """admin 为商品添加一条供应链记录。"""
    # 先有一个 product
    r = await client.post(
        "/api/v1/products",
        json={"name": "链上商品", "price": "99.00", "stock": 5, "category": "accessories"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 201, r.text
    pid = r.json()["data"]["id"]

    # Add a node
    node = {
        "product_id": pid,
        "stage": "manufacturing",
        "operator": "工厂A",
        "operator_en": "Factory A",
        "location": "浙江杭州",
        "location_en": "Hangzhou, Zhejiang",
        "description": "棉花加工",
        "description_en": "Cotton processing",
        "timestamp": "2026-05-01T10:00:00",
    }
    r2 = await client.post("/api/v1/supply-chain/records", json=node, headers=admin_auth_headers)
    assert r2.status_code == 201, r2.text
    body = r2.json()["data"]
    assert body["product_id"] == pid
    assert body["stage"] == "manufacturing"
    record_id = body["id"]

    # Verify trace query
    r3 = await client.get(f"/api/v1/supply-chain/trace/{pid}")
    assert r3.status_code == 200
    trace = r3.json()["data"]
    stages = [rec["stage"] for rec in trace.get("records", [])]
    assert "manufacturing" in stages

    # Update the record
    upd = {"description": "已升级工艺", "description_en": "Upgraded process"}
    r4 = await client.patch(
        f"/api/v1/supply-chain/records/{record_id}", json=upd, headers=admin_auth_headers
    )
    assert r4.status_code == 200, r4.text
    assert "已升级工艺" in r4.json()["data"]["description"]


@pytest.mark.asyncio
async def test_supply_chain_node_save_records_admin_audit_log(client, admin_auth_headers):
    """保存供应链节点 → 审计日志应记录 admin 操作人。"""
    from app.database import AsyncSessionLocal
    from app.models.audit import AuditLog
    from sqlalchemy import select

    r = await client.post(
        "/api/v1/products",
        json={"name": "审计测试商品", "price": "88.00", "stock": 10, "category": "apparel"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 201
    pid = r.json()["data"]["id"]

    r2 = await client.post(
        "/api/v1/supply-chain/records",
        json={"product_id": pid, "stage": "manufacturing", "description": "audit", "location": "Beijing"},
        headers=admin_auth_headers,
    )
    assert r2.status_code == 201

    async with AsyncSessionLocal() as db:
        logs = (await db.execute(
            select(AuditLog)
            .where(AuditLog.action == "create_traceability_record")
            .where(AuditLog.resource_id == str(r2.json()["data"]["id"]))
        )).scalars().all()
        assert len(logs) >= 1
        for e in logs:
            assert e.user_id is not None
            assert e.user_name in ("Test Admin",)  # admin nickname resolved via DB
