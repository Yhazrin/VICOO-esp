import pytest
from datetime import datetime, timedelta
from app.services.supply_chain.service import SupplyChainService
from app.models.supply_chain import SupplyChainRecord

@pytest.mark.asyncio
async def test_supply_chain_timeline(app):
    """
    测试产品供应链溯源时间线生成。
    """
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        sc_service = SupplyChainService(db)
        
        # 1. 为产品 ID 1 增加两条记录
        now = datetime.now()
        await sc_service.add_record(product_id=1, record_data={
            "stage": "material_sourcing",
            "description": "Organic cotton sourcing",
            "location": "Xinjiang",
            "certified": True,
            "timestamp": now - timedelta(days=10)
        })
        
        await sc_service.add_record(product_id=1, record_data={
            "stage": "manufacturing",
            "description": "Garment sewing",
            "location": "Guangzhou",
            "certified": True,
            "timestamp": now - timedelta(days=5)
        })
        await db.commit()
        
        # 2. 获取时间线
        timeline = await sc_service.get_sustainability_timeline(product_id=1)
        
        assert len(timeline) >= 2
        # 验证排序是否正确 (按时间升序)
        assert timeline[0]["stage"] == "material_sourcing"
        assert timeline[1]["stage"] == "manufacturing"
        assert timeline[0]["is_certified"] is True
