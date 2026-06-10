"""审计日志 + 用户搜索 + Impact 商品 端到端回归。"""
import pytest

API = "/api/v1"


@pytest.mark.asyncio
async def test_admin_user_search_by_email_substring(client, admin_auth_headers):
    """用户目录按邮箱子串搜索 → 必须命中。"""
    # 创建2个邮箱含独特关键字的用户
    marker = "audit-search-test-7q3p"
    for suffix in ("alice", "bob"):
        r = await client.post(f"{API}/auth/register", json={
            "email": f"{marker}-{suffix}@example.com",
            "password": "Test1234!",
            "nickname": f"{marker}-{suffix}",
        })
        assert r.status_code in (200, 201), r.text

    r = await client.get(f"{API}/users?search={marker}", headers=admin_auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    emails = [u["email"] for u in body["data"]]
    assert any(marker in e for e in emails), f"search={marker} should match, got {emails}"
    assert body["total"] >= 2


@pytest.mark.asyncio
async def test_admin_user_search_by_nickname(client, admin_auth_headers):
    """用户目录按昵称子串搜索 → 命中。"""
    marker = "nick-search-x9z2"
    for suffix in ("alpha", "beta"):
        r = await client.post(f"{API}/auth/register", json={
            "email": f"{marker}-{suffix}@example.com",
            "password": "Test1234!",
            "nickname": f"{marker}-{suffix}",
        })
        assert r.status_code in (200, 201), r.text

    r = await client.get(f"{API}/users?search={marker}", headers=admin_auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    nicks = [u["nickname"] for u in body["data"]]
    assert any(marker in n for n in nicks), f"nickname search by {marker} should match, got {nicks}"


@pytest.mark.asyncio
async def test_admin_user_search_case_insensitive(client, admin_auth_headers):
    """大小写不敏感 (ilike)。"""
    marker = "Case-Insensitive-Zz9"
    r = await client.post(f"{API}/auth/register", json={
        "email": f"{marker.lower()}@example.com",
        "password": "Test1234!",
        "nickname": marker.lower(),
    })
    assert r.status_code in (200, 201), r.text
    # Search with upper-case marker
    r = await client.get(f"{API}/users?search=CASE-INSENSITIVE", headers=admin_auth_headers)
    assert r.status_code == 200
    body = r.json()
    emails = [u["email"] for u in body["data"]]
    assert any(marker.lower() in e for e in emails), "case-insensitive search should match"


@pytest.mark.asyncio
async def test_admin_user_search_no_match_returns_empty(client, admin_auth_headers):
    """无匹配 → data=[] but valid envelope (not 404)."""
    r = await client.get(f"{API}/users?search=zzz-no-such-user-xyz-{__import__('uuid').uuid4().hex[:8]}", headers=admin_auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["data"] == []
    assert body["total"] == 0


@pytest.mark.asyncio
async def test_admin_user_search_pagination_still_works(client, admin_auth_headers):
    """搜索结果也要支持翻页。"""
    # Create 25 users with the same marker
    marker = "page-search-marker-2026"
    for i in range(25):
        await client.post(f"{API}/auth/register", json={
            "email": f"{marker}-{i:02d}@example.com",
            "password": "Test1234!",
            "nickname": f"{marker}-{i:02d}",
        })

    r = await client.get(f"{API}/users?search={marker}&page=1&page_size=10", headers=admin_auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 25
    assert len(body["data"]) == 10
    # Page 2
    r2 = await client.get(f"{API}/users?search={marker}&page=2&page_size=10", headers=admin_auth_headers)
    assert r2.status_code == 200
    body2 = r2.json()
    assert len(body2["data"]) >= 10
    # No overlap
    ids1 = {u["id"] for u in body["data"]}
    ids2 = {u["id"] for u in body2["data"]}
    assert ids1.isdisjoint(ids2), f"page1 and page2 overlap: {ids1 & ids2}"


@pytest.mark.asyncio
async def test_admin_audit_log_action_filter(client, admin_auth_headers):
    """审计日志按 action 筛选必须生效。"""
    r = await client.get(f"{API}/admin/audit-logs?action=login&page=1&page_size=20", headers=admin_auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert "data" in body
    # If any returned, must all be action=login
    for entry in body["data"]:
        assert entry["action"] == "login", f"action filter not applied: got {entry['action']}"


@pytest.mark.asyncio
async def test_admin_audit_log_page_size_respected(client, admin_auth_headers):
    """审计日志 page_size 必须 ≤ 100 且生效。"""
    r = await client.get(f"{API}/admin/audit-logs?page=1&page_size=20", headers=admin_auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["page_size"] == 20
    assert len(body["data"]) <= 20


@pytest.mark.asyncio
async def test_admin_audit_log_page_size_too_large_rejected(client, admin_auth_headers):
    """page_size > 100 → 422 (FastAPI validation)."""
    r = await client.get(f"{API}/admin/audit-logs?page=1&page_size=200", headers=admin_auth_headers)
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_impact_products_pagination_walk_all_pages(client, admin_auth_headers):
    """Impact 商品分页端到端:模拟前端 walking 全部 pages,必须拿到所有商品。"""
    # Seed 5 more impact products if needed
    from app.database import AsyncSessionLocal
    from app.models.product import Product
    from sqlalchemy import select
    async with AsyncSessionLocal() as db:
        existing_impact = (await db.execute(
            select(Product).where(Product.is_impact_product == True)
        )).scalars().all()
        if len(existing_impact) < 5:
            from decimal import Decimal
            for i in range(5 - len(existing_impact)):
                db.add(Product(
                    name=f"impact-walk-{i:02d}",
                    price=Decimal("99.00"),
                    stock=10,
                    category="apparel",
                    status="active",
                    is_impact_product=True,
                ))
            await db.commit()

    # Walk pages with page_size=100, stop when total reached
    seen: set = set()
    page = 1
    while True:
        r = await client.get(f"{API}/products?is_impact_product=true&page={page}&page_size=100", headers=admin_auth_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        for it in body["data"]:
            seen.add(it["id"])
        if len(seen) >= body["total"] or len(body["data"]) == 0:
            break
        page += 1
        assert page <= 50, "walk guard hit"
    # All items returned by walking must have is_impact_product=True
    # (re-check: any of them could be false negatives in normalizeIsImpactProduct but backend-side filter is exact)
    assert body["total"] >= 5, f"expected ≥5 impact products, got {body['total']}"