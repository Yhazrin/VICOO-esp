"""复现: 商品管理显示 95 页,翻页后空白。"""
import pytest


@pytest.mark.asyncio
async def test_products_pagination_pages_consistent(client, admin_auth_headers):
    """列表 total 翻页必须自洽: 每一页 ≤ page_size, 末页 < page_size (除非刚好整除)."""
    # Bulk seed enough products to span multiple pages
    for i in range(45):
        r = await client.post("/api/v1/products", json={
            "name": f"pagi-bug-{i:03d}", "price": "10.00", "stock": 1, "category": "apparel",
        }, headers=admin_auth_headers)
        assert r.status_code == 201, r.text

    r = await client.get("/api/v1/products?page=1&page_size=20", headers=admin_auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    total = body["total"]
    page_size = body["page_size"]
    items = body["data"]
    print(f"\n[pagination] total={total} page_size={page_size} items@page1={len(items)}")

    assert total >= 45, f"expected at least 45 seeded products, got {total}"
    assert len(items) == min(20, total), f"page1 should have ≤ 20 items, got {len(items)}"

    # Now try page 2 — must NOT be empty if total > page_size
    if total > page_size:
        r2 = await client.get("/api/v1/products?page=2&page_size=20", headers=admin_auth_headers)
        assert r2.status_code == 200, r2.text
        items2 = r2.json()["data"]
        print(f"[pagination] items@page2={len(items2)}")
        # If page 1 already fills 20 slots, page 2 MUST have at least 1 item
        if len(items) == 20:
            assert len(items2) >= 1, (
                f"PAGINATION BUG: page 1 has 20 items (total={total}), "
                f"but page 2 is empty ({len(items2)} items)"
            )


@pytest.mark.asyncio
async def test_products_pagination_jump_to_last_page(client, admin_auth_headers):
    """点击最后一页(高页码)→ 必须能拿到这一页应得的数据,不能空白。"""
    # Seed enough to have at least 3 pages
    for i in range(65):
        r = await client.post("/api/v1/products", json={
            "name": f"pagi-jump-{i:03d}", "price": "10.00", "stock": 1, "category": "apparel",
        }, headers=admin_auth_headers)
        assert r.status_code == 201, r.text

    r = await client.get("/api/v1/products?page=1&page_size=20", headers=admin_auth_headers)
    total = r.json()["total"]
    last_page = (total + 19) // 20
    print(f"\n[pagination-jump] total={total} last_page={last_page}")

    # Jump to last page
    r2 = await client.get(f"/api/v1/products?page={last_page}&page_size=20", headers=admin_auth_headers)
    assert r2.status_code == 200, r2.text
    items = r2.json()["data"]
    expected = total - (last_page - 1) * 20
    print(f"[pagination-jump] items@last_page={len(items)} expected≈{expected}")
    assert len(items) >= 1, f"Last page returned empty for total={total} last_page={last_page}"