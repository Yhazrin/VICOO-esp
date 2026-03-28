import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_api_path_is_alive():
    """验证当前简化路径 /api/auth/login 已经可用。"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/auth/login", json={"email": "test@test.com", "password": "password"})
        # 凭证是否正确不重要；关键是路由不能是 404
        assert response.status_code != 404

@pytest.mark.asyncio
async def test_verify_legacy_v1_path_still_works():
    """验证旧路径 /api/v1/auth/login 仍然兼容。"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", json={"email": "test@test.com", "password": "password"})
        assert response.status_code != 404
