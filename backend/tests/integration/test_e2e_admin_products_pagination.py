"""商品管理翻页真实场景回归 — 模拟前端 admin/src/services/api.ts 的 adaptPaginated。"""
import pytest


@pytest.mark.asyncio
async def test_admin_products_pagination_full_lifecycle(client, admin_auth_headers):
    """注册/创建商品直到 total > 100,翻到中后页必须每页 ≤ page_size 且有数据。"""
    from app.database import AsyncSessionLocal
    from app.models.product import Product
    from sqlalchemy import select, func

    # Seed until total >= 100 (idempotent)
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(func.count(Product.id)))).scalar() or 0
        target = max(0, 105 - existing)
        for i in range(target):
            db.add(Product(
                name=f"deep-pagi-{existing + i:04d}",
                price=10.0, stock=1, category="apparel", status="active",
            ))
        if target:
            await db.commit()

    seen_ids: set = set()
    last_total = None
    last_page_size = None
    # Walk all pages, including page=2..50
    for page in (1, 2, 3, 10, 25, 50, 100):
        r = await client.get(f"/api/v1/products?page={page}&page_size=20", headers=admin_auth_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "data" in body
        assert "total" in body
        assert "page_size" in body
        items = body["data"]
        assert len(items) <= 20, f"page={page}: returned {len(items)} > 20"
        if last_total is None:
            last_total = body["total"]
            last_page_size = body["page_size"]
        # Consistency: total/page_size must not change across pages
        assert body["total"] == last_total, f"total changed between pages: {body['total']} vs {last_total}"
        assert body["page_size"] == last_page_size
        # Each page must return ≤ page_size unique items
        for it in items:
            iid = it.get("id")
            assert iid not in seen_ids, f"duplicate id {iid} on page {page}"
            seen_ids.add(iid)
        # CRITICAL: if total > (page-1)*page_size, this page must have at least 1 item
        if body["total"] > (page - 1) * 20:
            assert len(items) >= 1, (
                f"PAGINATION BUG: page={page} returned 0 items but "
                f"total={body['total']} page_size=20 implies {body['total'] - (page-1)*20} items available"
            )


@pytest.mark.asyncio
async def test_admin_products_pagination_total_pages_consistent(client, admin_auth_headers):
    """最后一页必须能拿到数据,且 items count = total - (last_page-1)*page_size。"""
    r = await client.get("/api/v1/products?page=1&page_size=20", headers=admin_auth_headers)
    assert r.status_code == 200
    body = r.json()
    total = body["total"]
    page_size = body["page_size"]
    last_page = (total + page_size - 1) // page_size
    if last_page < 1:
        return
    r2 = await client.get(f"/api/v1/products?page={last_page}&page_size={page_size}", headers=admin_auth_headers)
    assert r2.status_code == 200
    items = r2.json()["data"]
    expected = total - (last_page - 1) * page_size
    assert len(items) == expected, f"last page: got {len(items)} expected {expected}"


@pytest.mark.asyncio
async def test_admin_products_pagination_total_field_camel_and_snake(client, admin_auth_headers):
    """前端 adaptPaginated 兼容 pageSize 和 page_size 两个键 — 后端必须同时返回。"""
    r = await client.get("/api/v1/products?page=1&page_size=20", headers=admin_auth_headers)
    body = r.json()
    assert "pageSize" in body, f"missing pageSize (camelCase): keys={sorted(body.keys())}"
    assert "page_size" in body, f"missing page_size (snake_case): keys={sorted(body.keys())}"
    assert body["pageSize"] == body["page_size"] == 20