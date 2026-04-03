import pytest
from decimal import Decimal
from app.services.admin.service import AdminService
from app.services.donation.service import DonationService
from app.models.artwork import Artwork
from app.models.donation import Donation
from sqlalchemy import select, func

@pytest.mark.asyncio
async def test_admin_dashboard_stats(app):
    """
    测试管理后台看板数据聚合逻辑。
    """
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        admin_service = AdminService(db)
        donation_service = DonationService(db)
        
        # 1. 先注入一笔完成的捐赠以产生统计数据
        await donation_service.create_donation({
            "donor_name": "Stats Tester",
            "amount": Decimal("500.00"),
            "currency": "CNY",
            "payment_method": "wechat",
            "status": "completed",
            "is_anonymous": False
        })
        await db.commit()
        
        # 2. 获取看板统计
        stats = await admin_service.get_dashboard_stats()
        
        assert float(stats["total_donation_amount"]) >= 500.00
        assert "pending_artworks_count" in stats
        assert "total_users_count" in stats

@pytest.mark.asyncio
async def test_admin_batch_moderate_artworks(app):
    """
    测试作品批量审批功能。
    """
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        # 1. 查找一些待审核的作品（使用 seed 数据）
        stmt = select(Artwork).where(Artwork.status == "pending").limit(2)
        result = await db.execute(stmt)
        artworks = result.scalars().all()
        
        if not artworks:
            pytest.skip("No pending artworks found in seed data")
            
        art_ids = [a.id for a in artworks]
        admin_service = AdminService(db)
        
        # 2. 执行批量审批为已通过
        res = await admin_service.batch_moderate_artworks(art_ids, status="approved")
        await db.commit()
        
        assert res["modified_count"] == len(art_ids)
        
        # 3. 验证状态已更新
        check_stmt = select(Artwork).where(Artwork.id.in_(art_ids))
        updated_arts = (await db.execute(check_stmt)).scalars().all()
        for art in updated_arts:
            assert art.status == "approved"

@pytest.mark.asyncio
async def test_donation_simulation_mode(client):
    """
    测试支付沙箱/模拟模式：验证 500 错误是否已修复并返回 simulation_mode。
    """
    payload = {
        "donor_name": "Sandbox Tester",
        "amount": 100.00,
        "currency": "CNY",
        "payment_method": "wechat",
        "is_anonymous": False
    }
    # 模拟一个已登录用户（ID 1）
    from app.security import create_access_token
    token = create_access_token(subject="1", role="user")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = await client.post("/api/donations", json=payload, headers=headers)
    
    # 验证不再返回 500
    assert response.status_code == 201
    data = response.json()["data"]
    # 验证是否触发了模拟模式（因为本地通常没有配置微信密钥）
    if "payment_error" in data:
        assert data["simulation_mode"] is True
