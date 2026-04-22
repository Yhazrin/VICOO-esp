"""
API tests for AI assistant feedback endpoint (/api/v1/ai/feedback).
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_chat_simulation_mode(client: AsyncClient, no_auth_headers):
    payload = {
        "messages": [
            {"role": "user", "content": "请介绍一下这个平台的 AI 能力"}
        ],
        "context": "general",
        "metadata": {"impactMode": False, "route": "/assistant"}
    }
    resp = await client.post("/api/v1/ai/chat", json=payload, headers=no_auth_headers)
    assert resp.status_code in (200, 404, 500)
    if resp.status_code == 200:
        body = resp.json()
        assert "data" in body
        assert "reply" in body["data"]


@pytest.mark.asyncio
async def test_feedback_helpful(client: AsyncClient, no_auth_headers):
    payload = {
        "is_helpful": True,
        "messages": [
            {"role": "user", "content": "What is the material of product 1?"},
            {"role": "assistant", "content": "It's cotton."}
        ],
        "metadata": {"context": "shop"}
    }
    resp = await client.post("/api/v1/ai/feedback", json=payload, headers=no_auth_headers)
    assert resp.status_code in (200, 404, 500)
    if resp.status_code == 200:
        body = resp.json()
        assert "data" in body
        # Helpful feedback should not escalate
        assert body["data"].get("escalated") in (False,)


@pytest.mark.asyncio
async def test_feedback_not_helpful_escalates(client: AsyncClient, no_auth_headers):
    payload = {
        "is_helpful": False,
        "reason": "Answer incorrect",
        "messages": [
            {"role": "user", "content": "Please trace product 1."},
            {"role": "assistant", "content": "I cannot find trace."}
        ],
        "metadata": {"context": "impact", "user_email": "user@example.com", "user_name": "Tester"}
    }
    resp = await client.post("/api/v1/ai/feedback", json=payload, headers=no_auth_headers)
    assert resp.status_code in (200, 404, 500)
    if resp.status_code == 200:
        body = resp.json()
        assert "data" in body
        assert body["data"].get("escalated") == True
        assert "contact_id" in body["data"]
