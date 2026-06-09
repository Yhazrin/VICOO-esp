"""端到端集成测试：admin 创建活动。

覆盖 Goal 子任务 #4。
"""
import pytest
from datetime import datetime, timezone, timedelta
from decimal import Decimal


@pytest.mark.asyncio
async def test_admin_can_create_campaign_and_it_persists(client, admin_auth_headers):
    """admin 创建活动 → 持久化到 DB → 公开 API 可查到。"""
    from app.database import AsyncSessionLocal
    from app.models.campaign import Campaign

    start = datetime.now(timezone.utc)
    end = start + timedelta(days=30)
    payload = {
        "title": "希望工程 2026",
        "subtitle": "为乡村孩子带去色彩",
        "description": "公益活动详情",
        "cover_image": "https://cdn.vicoo.org/test/campaign.jpg",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "goal_amount": "50000.00",
        "sustainability_eyebrow": "Materials · Welfare",
        "sustainability_title": "可持续承诺",
        "sustainability_subtitle": "我们对每一件产品负责",
        "sustainability_p1_title": "原料",
        "sustainability_p1_body": "有机棉认证",
    }

    r = await client.post(
        "/api/v1/campaigns", json=payload, headers=admin_auth_headers
    )
    assert r.status_code == 201, r.text
    data = r.json()["data"]
    campaign_id = data["id"]
    assert data["title"] == "希望工程 2026"
    assert Decimal(data["goal_amount"]) == Decimal("50000.00")
    assert data["sustainability_title"] == "可持续承诺"

    # DB 持久化
    async with AsyncSessionLocal() as db:
        c = await db.get(Campaign, campaign_id)
        assert c is not None
        assert c.title == "希望工程 2026"
        assert c.goal_amount == Decimal("50000.00")
        assert c.status == "draft" or c.status == "active"

    # 公开 API 可查
    pub = await client.get(f"/api/v1/campaigns/{campaign_id}")
    assert pub.status_code == 200
    pub_data = pub.json()["data"]
    assert pub_data["title"] == "希望工程 2026"

    # 出现在管理后台列表中
    admin_list = await client.get(
        "/api/v1/campaigns?page=1&pageSize=50", headers=admin_auth_headers
    )
    assert admin_list.status_code == 200
    listed = admin_list.json()["data"]
    assert any(c["id"] == campaign_id for c in listed)


@pytest.mark.asyncio
async def test_admin_can_activate_draft_campaign(client, admin_auth_headers):
    """admin 可将草稿活动切换为 active。"""
    start = datetime.now(timezone.utc)
    end = start + timedelta(days=30)
    r = await client.post(
        "/api/v1/campaigns",
        json={
            "title": "草稿活动",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "goal_amount": "10000.00",
        },
        headers=admin_auth_headers,
    )
    assert r.status_code == 201
    cid = r.json()["data"]["id"]

    upd = await client.put(
        f"/api/v1/campaigns/{cid}",
        json={"status": "active"},
        headers=admin_auth_headers,
    )
    assert upd.status_code == 200, upd.text
    assert upd.json()["data"]["status"] == "active"

    from app.database import AsyncSessionLocal
    from app.models.campaign import Campaign
    async with AsyncSessionLocal() as db:
        c = await db.get(Campaign, cid)
        assert c.status == "active"


@pytest.mark.asyncio
async def test_non_admin_cannot_create_campaign(client, auth_headers):
    """普通用户不能创建活动。"""
    start = datetime.now(timezone.utc)
    end = start + timedelta(days=30)
    r = await client.post(
        "/api/v1/campaigns",
        json={
            "title": "未授权",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "goal_amount": "1.00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 403
