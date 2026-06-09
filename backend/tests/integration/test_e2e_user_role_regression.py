"""回归:admin 修改用户角色只允许 admin / user,其余全部拒绝。

前端已经从 UserPage 下拉框删除 editor / guardian / compliance。
后端 UserRoleUpdate 模式的正则 `^(admin|user)$` 已经做了硬约束,
本测试确保该约束持续生效,防止有人通过原始 POST 偷偷写入旧角色。
"""
import pytest

API = "/api/v1"


@pytest.mark.asyncio
async def test_user_role_update_accepts_only_admin_user(client, admin_auth_headers):
    """PUT /users/{id}/role → 只允许 'admin' / 'user',其它 422。"""
    # 1. 注册一个新用户作为被试
    r = await client.post(f"{API}/auth/register", json={
        "email": "role-regress@test.com",
        "password": "Test1234!",
        "nickname": "role-regress",
    })
    assert r.status_code in (200, 201), r.text
    body = r.json()["data"]
    uid = body["user"]["id"] if isinstance(body, dict) and "user" in body else body["id"]

    # 2. 合法角色:admin 与 user 都要接受
    for ok_role in ("admin", "user"):
        rr = await client.put(
            f"{API}/users/{uid}/role",
            json={"role": ok_role},
            headers=admin_auth_headers,
        )
        assert rr.status_code in (200, 201), f"{ok_role}: {rr.status_code} {rr.text}"

    # 3. 非法角色:全部 422
    for bad_role in ("editor", "guardian", "compliance", "viewer", "auditor", "root", "ADMIN", ""):
        rr = await client.put(
            f"{API}/users/{uid}/role",
            json={"role": bad_role},
            headers=admin_auth_headers,
        )
        assert rr.status_code == 422, f"{bad_role!r} should be rejected, got {rr.status_code} {rr.text}"


@pytest.mark.asyncio
async def test_user_role_update_rejects_missing_field(client, admin_auth_headers):
    """role 字段缺失 → 422。"""
    r = await client.post(f"{API}/auth/register", json={
        "email": "role-missing@test.com", "password": "Test1234!", "nickname": "missing",
    })
    uid = r.json()["data"]["user"]["id"] if "user" in r.json()["data"] else r.json()["data"]["id"]
    rr = await client.put(
        f"{API}/users/{uid}/role",
        json={},
        headers=admin_auth_headers,
    )
    assert rr.status_code == 422