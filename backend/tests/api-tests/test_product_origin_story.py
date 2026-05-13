import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_origin_countries(client: AsyncClient, no_auth_headers):
    response = await client.get("/api/v1/products/origins/countries", headers=no_auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert isinstance(data, list)
    assert any(item.get("code") == "CN" for item in data)


@pytest.mark.asyncio
async def test_list_origin_regions_with_filter(client: AsyncClient, no_auth_headers):
    countries_res = await client.get("/api/v1/products/origins/countries", headers=no_auth_headers)
    countries = countries_res.json()["data"]
    country_cn = next(item for item in countries if item.get("code") == "CN")

    response = await client.get(
        "/api/v1/products/origins/regions",
        params={"country_id": country_cn["id"]},
        headers=no_auth_headers,
    )
    assert response.status_code == 200
    rows = response.json()["data"]
    assert isinstance(rows, list)
    assert all(r.get("country_id") == country_cn["id"] for r in rows)


@pytest.mark.asyncio
async def test_create_product_with_origin_story_success(client: AsyncClient, admin_auth_headers):
    countries_res = await client.get("/api/v1/products/origins/countries", headers=admin_auth_headers)
    countries = countries_res.json()["data"]
    country_cn = next(item for item in countries if item.get("code") == "CN")
    regions_res = await client.get(
        "/api/v1/products/origins/regions",
        params={"country_id": country_cn["id"]},
        headers=admin_auth_headers,
    )
    region = regions_res.json()["data"][0]

    payload = {
        "name": "测试公益商品-溯源",
        "description": "测试商品",
        "price": 88.8,
        "currency": "CNY",
        "stock": 10,
        "status": "active",
        "is_impact_product": True,
        "origin_country_id": country_cn["id"],
        "origin_region_id": region["id"],
        "trace_story_title": "测试标题",
        "trace_story_content": "测试正文",
    }
    create_res = await client.post("/api/v1/products", json=payload, headers=admin_auth_headers)
    assert create_res.status_code == 201
    item = create_res.json()["data"]
    assert item["origin_country_id"] == country_cn["id"]
    assert item["origin_region_id"] == region["id"]
    assert item["trace_story_title"] == "测试标题"
    assert item["trace_story_content"] == "测试正文"


@pytest.mark.asyncio
async def test_create_product_region_country_mismatch_returns_400(client: AsyncClient, admin_auth_headers):
    countries_res = await client.get("/api/v1/products/origins/countries", headers=admin_auth_headers)
    countries = countries_res.json()["data"]
    country_cn = next(item for item in countries if item.get("code") == "CN")
    non_cn = next((item for item in countries if item.get("id") != country_cn["id"]), None)
    if non_cn is None:
        pytest.skip("No second country available in test database")

    regions_res = await client.get(
        "/api/v1/products/origins/regions",
        params={"country_id": country_cn["id"]},
        headers=admin_auth_headers,
    )
    region = regions_res.json()["data"][0]

    payload = {
        "name": "测试公益商品-错误外键",
        "description": "测试商品",
        "price": 66.6,
        "currency": "CNY",
        "stock": 5,
        "status": "active",
        "is_impact_product": True,
        "origin_country_id": non_cn["id"],
        "origin_region_id": region["id"],
    }
    create_res = await client.post("/api/v1/products", json=payload, headers=admin_auth_headers)
    assert create_res.status_code == 400
    assert "origin_region_id does not belong to origin_country_id" in create_res.text
