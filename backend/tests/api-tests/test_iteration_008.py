import pytest
from httpx import AsyncClient
from app.core.errors import ResourceNotFoundException

@pytest.mark.asyncio
class TestArchitectureAndOps:
    """Tests for Iteration 8: Health checks and Unified Error Handling."""

    async def test_detailed_health_check(self, client: AsyncClient):
        """验证健康检查包含数据库状态探测。"""
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        assert data["services"]["database"] in ["healthy", "unhealthy"]
        assert "timestamp" in data

    async def test_unified_error_format(self, client: AsyncClient, auth_headers):
        """验证 BusinessException 被正确映射为统一 JSON 格式。"""
        # 访问一个肯定不存在的资源 ID
        response = await client.get("/api/users/99999", headers=auth_headers)
        
        # 此时后端应返回 404，且格式符合 {"success": false, "code": "...", "message": "..."}
        assert response.status_code == 404
        body = response.json()
        assert body["success"] is False
        assert "code" in body
        assert body["code"] == "RESOURCE_NOT_FOUND"
        assert "message" in body

    async def test_validation_error_format(self, client: AsyncClient, auth_headers):
        """验证 422 验证错误也被统一拦截。"""
        # 发送一个格式错误的请求（缺少必填字段）
        response = await client.post("/api/donations", json={"invalid": "data"}, headers=auth_headers)
        
        assert response.status_code == 422
        body = response.json()
        assert body["success"] is False
        assert body["code"] == "VALIDATION_FAILED"
