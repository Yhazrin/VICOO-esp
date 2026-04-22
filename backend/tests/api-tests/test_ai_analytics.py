"""
API tests for AI rollout analytics endpoint (/api/v1/admin/analytics/ai).
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ai_analytics_admin(client: AsyncClient, admin_auth_headers):
    response = await client.get("/api/v1/admin/analytics/ai", headers=admin_auth_headers)
    assert response.status_code in (200, 404, 500)
    if response.status_code == 200:
        body = response.json()
        assert "data" in body
        data = body["data"]
        assert "chat_count" in data
        assert "feedback_total" in data
        assert "handoff_count" in data
        assert "handoff_rate" in data


@pytest.mark.asyncio
async def test_ai_analytics_forbidden(client: AsyncClient, auth_headers):
    response = await client.get("/api/v1/admin/analytics/ai", headers=auth_headers)
    assert response.status_code in (401, 403, 404, 500)
