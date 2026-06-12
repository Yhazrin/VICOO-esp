"""验证 admin 前端序列化后的供应链节点 payload 完整可用。

模拟 admin/src/pages/ProductPage.tsx 的 serializeNode 输出:
  - 时间戳来自 <input type="datetime-local"> → "YYYY-MM-DDTHH:MM" (无秒,无时区)
  - 字符串字段为空时 → undefined (不发送)
  - 数字字段为 0 / 空时 → 0 / null (不能丢 0)
  - 必填字段齐全 (stage, certified, gallery)
"""
import pytest
from decimal import Decimal

API = "/api/v1"


def _iso_from_datetime_local(v: str) -> str:
    """前端 timestampOrNow 的复刻: 'YYYY-MM-DDTHH:MM' → ISO 8601."""
    from datetime import datetime
    return datetime.fromisoformat(v).isoformat()


@pytest.mark.asyncio
async def test_supply_chain_node_full_payload_accepted(client, admin_auth_headers):
    """前端 serializeNode 完整 payload → 后端 201 接收,字段全部落库。"""
    from app.database import AsyncSessionLocal
    from app.models.supply_chain import SupplyChainRecord
    from sqlalchemy import select

    # 1. Create product
    r = await client.post(f"{API}/products", json={
        "name": "完整链路-商品", "price": "199.00", "stock": 20, "category": "apparel",
    }, headers=admin_auth_headers)
    assert r.status_code == 201, r.text
    pid = r.json()["data"]["id"]

    # 2. Simulate frontend serializeNode output (with all fields, including 0/null edge cases)
    frontend_payload = {
        "product_id": pid,
        "stage": "material_sourcing",                # required
        "description": "新疆长绒棉",                  # zh non-empty
        "description_en": "Xinjiang long-staple cotton",  # en non-empty
        "location": "新疆阿克苏",                     # location non-empty
        "location_en": "Aksu, Xinjiang",             # location en non-empty
        "latitude": 41.17,                           # valid float
        "longitude": 80.27,                          # valid float
        "certified": True,                           # bool true
        "cert_image_url": "https://cdn.vicoo.org/cert.jpg",  # cert image
        "carbon_kg": "0",                            # edge: zero kept as Decimal("0")
        "carbon_note": "低碳认证",                    # carbon note
        "timestamp": _iso_from_datetime_local("2026-06-01T10:00"),  # local-time → ISO
        "gallery": [{"type": "image", "url": "https://cdn.vicoo.org/p1.jpg", "caption": "原料图"}],
    }
    r2 = await client.post(f"{API}/supply-chain/records", json=frontend_payload, headers=admin_auth_headers)
    assert r2.status_code == 201, r2.text
    body = r2.json()["data"]
    rid = body["id"]

    # 3. Response mirrors what frontend expects
    assert body["stage"] == "material_sourcing"
    assert body["description"] == "新疆长绒棉"
    assert body["description_en"] == "Xinjiang long-staple cotton"
    assert body["location"] == "新疆阿克苏"
    assert body["location_en"] == "Aksu, Xinjiang"
    assert abs(float(body["latitude"]) - 41.17) < 1e-6
    assert abs(float(body["longitude"]) - 80.27) < 1e-6
    assert body["certified"] is True
    assert body["cert_image_url"] == "https://cdn.vicoo.org/cert.jpg"
    assert Decimal(str(body["carbon_kg"])) == Decimal("0")  # ← critical: 0 must not be lost
    assert body["carbon_note"] == "低碳认证"
    assert body["gallery"][0]["url"] == "https://cdn.vicoo.org/p1.jpg"

    # 4. DB row verifies persistence
    async with AsyncSessionLocal() as db:
        rec = (await db.execute(select(SupplyChainRecord).where(SupplyChainRecord.id == rid))).scalar_one()
        assert rec.description == "新疆长绒棉"
        assert rec.description_en == "Xinjiang long-staple cotton"
        assert rec.location == "新疆阿克苏"
        assert rec.location_en == "Aksu, Xinjiang"
        assert abs(float(rec.latitude) - 41.17) < 1e-6
        assert abs(float(rec.longitude) - 80.27) < 1e-6
        assert rec.certified is True
        assert rec.carbon_kg == Decimal("0")


@pytest.mark.asyncio
async def test_supply_chain_node_minimal_payload_accepted(client, admin_auth_headers):
    """最小可行 payload (只有 stage + 必填). 空字符串字段不发送."""
    from app.database import AsyncSessionLocal
    from app.models.supply_chain import SupplyChainRecord
    from sqlalchemy import select

    r = await client.post(f"{API}/products", json={
        "name": "最小链路-商品", "price": "50.00", "stock": 5, "category": "apparel",
    }, headers=admin_auth_headers)
    assert r.status_code == 201, r.text
    pid = r.json()["data"]["id"]

    # 模拟前端: 用户没填任何可选字段
    minimal = {
        "product_id": pid,
        "stage": "shipping",
        "description": None,
        "description_en": None,
        "location": None,
        "location_en": None,
        "latitude": None,
        "longitude": None,
        "certified": False,
        "cert_image_url": None,
        "carbon_kg": None,
        "carbon_note": None,
        "timestamp": None,  # → router uses server-side default
        "gallery": [],
    }
    r2 = await client.post(f"{API}/supply-chain/records", json=minimal, headers=admin_auth_headers)
    assert r2.status_code == 201, r2.text
    rid = r2.json()["data"]["id"]

    async with AsyncSessionLocal() as db:
        rec = (await db.execute(select(SupplyChainRecord).where(SupplyChainRecord.id == rid))).scalar_one()
        assert rec.stage == "shipping"
        assert rec.certified is False
        assert rec.description is None
        assert rec.latitude is None
        assert rec.carbon_kg is None


@pytest.mark.asyncio
async def test_supply_chain_node_update_full_payload(client, admin_auth_headers):
    """编辑节点时完整 payload 可被 PATCH 接受 (frontend openNodeEdit → serializeNode)."""
    from app.database import AsyncSessionLocal
    from app.models.supply_chain import SupplyChainRecord
    from sqlalchemy import select

    r = await client.post(f"{API}/products", json={
        "name": "编辑链路-商品", "price": "88.00", "stock": 8, "category": "accessories",
    }, headers=admin_auth_headers)
    pid = r.json()["data"]["id"]

    # Create initial node
    r2 = await client.post(f"{API}/supply-chain/records", json={
        "product_id": pid, "stage": "processing",
        "description": "原", "location": "原地址",
    }, headers=admin_auth_headers)
    assert r2.status_code == 201
    rid = r2.json()["data"]["id"]

    # PATCH with frontend-shaped payload (snake_case from api.ts)
    patch = {
        "stage": "quality_check",
        "description": "QC 通过",
        "description_en": "QC passed",
        "location": "上海质检中心",
        "location_en": "Shanghai QC Center",
        "latitude": 31.23,
        "longitude": 121.47,
        "certified": True,
        "cert_image_url": "https://cdn.vicoo.org/qc.pdf",
        "carbon_kg": "0.5",
        "carbon_note": "环保",
        "timestamp": _iso_from_datetime_local("2026-06-09T14:30"),
        "gallery": [{"type": "image", "url": "https://cdn.vicoo.org/qc.jpg"}],
    }
    r3 = await client.patch(f"{API}/supply-chain/records/{rid}", json=patch, headers=admin_auth_headers)
    assert r3.status_code == 200, r3.text

    async with AsyncSessionLocal() as db:
        rec = (await db.execute(select(SupplyChainRecord).where(SupplyChainRecord.id == rid))).scalar_one()
        assert rec.stage == "quality_check"
        assert rec.description == "QC 通过"
        assert rec.description_en == "QC passed"
        assert rec.location == "上海质检中心"
        assert rec.location_en == "Shanghai QC Center"
        assert abs(float(rec.latitude) - 31.23) < 1e-6
        assert abs(float(rec.longitude) - 121.47) < 1e-6
        assert rec.certified is True
        assert rec.carbon_kg == Decimal("0.5")


@pytest.mark.asyncio
async def test_list_records_backfills_from_donor_product(client, admin_auth_headers):
    """GET /supply-chain/records?product_id=X 应与 /trace 一样触发 lazy-backfill。"""
    donor_name = "回填测试-同名商品"

    r1 = await client.post(f"{API}/products", json={
        "name": donor_name, "price": "99.00", "stock": 10, "category": "apparel",
    }, headers=admin_auth_headers)
    assert r1.status_code == 201, r1.text
    donor_id = r1.json()["data"]["id"]

    r2 = await client.post(f"{API}/supply-chain/records", json={
        "product_id": donor_id,
        "stage": "material_sourcing",
        "description": "原料",
        "location": "新疆",
    }, headers=admin_auth_headers)
    assert r2.status_code == 201, r2.text

    r3 = await client.post(f"{API}/products", json={
        "name": donor_name, "price": "99.00", "stock": 5, "category": "apparel",
    }, headers=admin_auth_headers)
    assert r3.status_code == 201, r3.text
    target_id = r3.json()["data"]["id"]

    r4 = await client.get(
        f"{API}/supply-chain/records",
        params={"product_id": target_id, "page_size": 100},
    )
    assert r4.status_code == 200, r4.text
    body = r4.json()
    assert body["total"] >= 1
    assert any(row["stage"] == "material_sourcing" for row in body["data"])
    assert all(row["product_id"] == target_id for row in body["data"])
