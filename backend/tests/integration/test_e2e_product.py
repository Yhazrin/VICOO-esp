"""端到端集成测试：admin 上架商品。

覆盖 Goal 子任务 #3。
"""
import pytest
from decimal import Decimal


@pytest.mark.asyncio
async def test_admin_can_create_and_publish_product(client, admin_auth_headers):
    """完整流程：admin 通过 API 创建商品 → DB 持久化 → 前台/管理列表可查询。"""
    from app.database import AsyncSessionLocal
    from app.models.product import Product

    payload = {
        "name": "希望T恤 Hope Tee",
        "name_en": "Hope Tee",
        "description": "公益商品",
        "price": "128.00",
        "currency": "CNY",
        "image_url": "https://cdn.vicoo.org/test/hope-tee.jpg",
        "category": "apparel",
        "stock": 50,
        "is_impact_product": True,
        "donation_percentage": "20.00",
    }

    response = await client.post(
        "/api/v1/products",
        json=payload,
        headers=admin_auth_headers,
    )
    assert response.status_code == 201, response.text
    data = response.json()["data"]
    assert data["name"] == "希望T恤 Hope Tee"
    assert Decimal(data["price"]) == Decimal("128.00")
    assert data["stock"] == 50
    assert data["is_impact_product"] is True
    product_id = data["id"]

    # DB 中确实有这条记录
    async with AsyncSessionLocal() as db:
        p = await db.get(Product, product_id)
        assert p is not None
        assert p.name == "希望T恤 Hope Tee"
        assert p.status == "active"
        assert p.stock == 50

    # 公开 API 可查到
    pub_resp = await client.get(f"/api/v1/products/{product_id}")
    assert pub_resp.status_code == 200
    pub_data = pub_resp.json()["data"]
    assert pub_data["id"] == product_id


@pytest.mark.asyncio
async def test_admin_can_update_product(client, admin_auth_headers):
    """admin 上架后能改价格、库存。"""
    from app.database import AsyncSessionLocal
    from app.models.product import Product

    create = await client.post(
        "/api/v1/products",
        json={"name": "Before Update", "price": "10.00", "stock": 5, "category": "apparel"},
        headers=admin_auth_headers,
    )
    assert create.status_code == 201
    product_id = create.json()["data"]["id"]

    # 修改价格、库存、状态
    upd = await client.put(
        f"/api/v1/products/{product_id}",
        json={"price": "15.50", "stock": 100, "status": "active"},
        headers=admin_auth_headers,
    )
    assert upd.status_code == 200, upd.text
    updated = upd.json()["data"]
    assert Decimal(updated["price"]) == Decimal("15.50")
    assert updated["stock"] == 100

    # 持久化确认
    async with AsyncSessionLocal() as db:
        p = await db.get(Product, product_id)
        assert Decimal(str(p.price)) == Decimal("15.50")
        assert p.stock == 100


@pytest.mark.asyncio
async def test_non_admin_cannot_create_product(client, auth_headers):
    """普通用户不能创建商品（权限隔离）。"""
    payload = {"name": "Sneaky", "price": "1.00", "stock": 1, "category": "apparel"}
    r = await client.post(
        "/api/v1/products", json=payload, headers=auth_headers
    )
    assert r.status_code == 403
