"""端到端集成测试：admin 创建作品 + 角色清理。

覆盖 Goal 子任务 #6。
"""
import pytest


@pytest.mark.asyncio
async def test_admin_can_create_artwork_via_admin_endpoint(client, admin_auth_headers):
    """admin 用 /artworks/admin 端点直接创建作品（绕过 consent 检查）。"""
    from app.database import AsyncSessionLocal
    from app.models.artwork import Artwork

    payload = {
        "title": "管理员录入作品",
        "description": "Admin 录入",
        "image_url": "https://cdn.vicoo.org/test/admin-art.jpg",
        "artist_name": "Admin",
        "campaign_id": 1,
    }
    r = await client.post(
        "/api/v1/artworks/admin", json=payload, headers=admin_auth_headers
    )
    assert r.status_code == 201, r.text
    data = r.json()["data"]
    artwork_id = data["id"]
    assert data["title"] == "管理员录入作品"
    assert data["status"] in ("pending", "draft", "approved")

    async with AsyncSessionLocal() as db:
        a = await db.get(Artwork, artwork_id)
        assert a is not None
        assert a.title == "管理员录入作品"


@pytest.mark.asyncio
async def test_non_admin_cannot_use_admin_create(client, auth_headers):
    """普通用户不能调 admin 端点。"""
    payload = {
        "title": "X",
        "image_url": "https://x",
        "artist_name": "X",
    }
    r = await client.post(
        "/api/v1/artworks/admin", json=payload, headers=auth_headers
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_manage_artwork_full_lifecycle(client, admin_auth_headers):
    """admin 完整生命周期：create → update → status change → delete。"""
    # 1) create
    r = await client.post(
        "/api/v1/artworks/admin",
        json={
            "title": "Life cycle test",
            "image_url": "https://cdn/life.jpg",
            "artist_name": "Admin",
        },
        headers=admin_auth_headers,
    )
    assert r.status_code == 201
    aid = r.json()["data"]["id"]

    # 2) update title/description
    upd = await client.put(
        f"/api/v1/artworks/{aid}",
        json={"title": "Life cycle (updated)"},
        headers=admin_auth_headers,
    )
    assert upd.status_code == 200
    assert upd.json()["data"]["title"] == "Life cycle (updated)"

    # 3) status change
    stat = await client.put(
        f"/api/v1/artworks/{aid}/status",
        json={"status": "approved"},
        headers=admin_auth_headers,
    )
    assert stat.status_code == 200
    assert stat.json()["data"]["status"] == "approved"

    # 4) delete
    delete = await client.delete(
        f"/api/v1/artworks/{aid}", headers=admin_auth_headers
    )
    assert delete.status_code in (200, 204)


@pytest.mark.asyncio
async def test_role_update_rejects_unknown_role(client, admin_auth_headers):
    """UserRoleUpdate schema 现在只允许 admin/user，不再允许 editor/guardian/compliance。"""
    from app.database import AsyncSessionLocal
    from app.models.user import User
    from app.security import hash_password
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        u = User(
            email="role-test@vicoo.test",
            password_hash=hash_password("pass12345"),
            nickname="RoleTester",
            role="user",
            status="active",
        )
        db.add(u)
        await db.commit()
        await db.refresh(u)
        uid = u.id

    # 尝试设为 editor
    r = await client.put(
        f"/api/v1/users/{uid}/role",
        json={"role": "editor"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 422  # Pydantic 拒绝

    # 设为 user / admin 应该成功
    r2 = await client.put(
        f"/api/v1/users/{uid}/role",
        json={"role": "user"},
        headers=admin_auth_headers,
    )
    assert r2.status_code in (200, 204)
