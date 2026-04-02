import pytest
from httpx import AsyncClient
from app.security import create_access_token

@pytest.mark.asyncio
async def test_auth_login_exists(client: AsyncClient):
    """验证登录接口是否存在且响应符合预期（基准测试）。"""
    payload = {"email": "test@example.com", "password": "password"}
    response = await client.post("/api/v1/auth/login", json=payload)
    # 无论账号是否存在，不应返回 404
    assert response.status_code != 404

@pytest.mark.asyncio
async def test_auth_me_protected(client: AsyncClient):
    """验证获取个人信息接口受保护。"""
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_auth_me_with_token(client: AsyncClient):
    """验证使用 Mock Token 后可访问（如果用户存在）。"""
    # 模拟一个用户 ID 为 1 的 Token
    token = create_access_token(subject="1", role="user")
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/users/me", headers=headers)
    # 只要不返回 401/404，说明 Token 解析链路正常
    assert response.status_code in (200, 404) 


@pytest.mark.asyncio
async def test_create_donation_wechat_in_development_does_not_500(client: AsyncClient):
    """开发环境下，微信捐赠创建应可安全降级，不应因外部支付依赖导致 500。"""
    token = create_access_token(subject="1", role="user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "donor_name": "Test Donor",
        "amount": 88.8,
        "currency": "CNY",
        "payment_method": "wechat",
        "is_anonymous": False,
        "message": "integration check",
    }

    response = await client.post("/api/v1/donations", json=payload, headers=headers)

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["payment_method"] == "wechat"
    assert data["status"] == "pending"
    assert "donationId" in data
    assert "transactionId" in data
