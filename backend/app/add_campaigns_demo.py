"""
向数据库幂等插入/修正公益活动（可直连 Unsplash 封面图）。

- 新库可补充多条图文活动
- 已有旧数据若 cover_image 为 /static/campaigns/ 等相对路径，会更新为 https 地址（修复 VPS 配图不显示）

在服务器/容器内执行:
  cd /path/to/VICOO-esp/backend && python -m app.add_campaigns_demo

或 docker:
  docker compose -f deploy/easy/docker-compose.host-nginx.yml exec backend \
    python -m app.add_campaigns_demo
"""
from __future__ import annotations

import asyncio
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select

from app.data.campaign_covers import (
    COVER_CHOIR,
    COVER_FUTURE,
    COVER_HOMETOWN,
    COVER_SPRING,
    COVER_WORKSHOP,
)
from app.database import AsyncSessionLocal, engine
from app.models.campaign import Campaign
from app.utils.cache import invalidate_cache

# 与 seed 中前三条 title 一致，便于合并环境
def _rows() -> list[dict]:
    return [
        {
            "title": "春天的色彩 — 乡村儿童画展",
            "description": (
                "征集来自全国各地乡村小学孩子们的画作，展示他们眼中的春天。"
                "优秀作品将在城市美术馆展出，并制成公益明信片义卖。"
            ),
            "cover_image": COVER_SPRING,
            "start_date": datetime(2025, 3, 1),
            "end_date": datetime(2025, 6, 30),
            "goal_amount": Decimal("50000.00"),
            "current_amount": Decimal("32500.00"),
            "status": "active",
            "participant_count": 150,
            "artwork_count": 8,
        },
        {
            "title": "我的家乡 — 故土记忆",
            "description": (
                "邀请孩子们用画笔记录家乡的山川河流、风土人情。记录正在消失的乡村记忆，唤起社会对乡土文化的关注。"
            ),
            "cover_image": COVER_HOMETOWN,
            "start_date": datetime(2025, 7, 1),
            "end_date": datetime(2025, 10, 31),
            "goal_amount": Decimal("80000.00"),
            "current_amount": Decimal("15000.00"),
            "status": "active",
            "participant_count": 95,
            "artwork_count": 7,
        },
        {
            "title": "画出未来 — 科技与梦想",
            "description": (
                "以「未来科技」为主题，鼓励孩子们大胆想象未来世界。"
                "获奖作品将用于制作公益行动 T 恤图案，收益全部用于乡村美育。"
            ),
            "cover_image": COVER_FUTURE,
            "start_date": datetime(2025, 11, 1),
            "end_date": datetime(2026, 2, 28),
            "goal_amount": Decimal("100000.00"),
            "current_amount": Decimal("8500.00"),
            "status": "active",
            "participant_count": 60,
            "artwork_count": 5,
        },
        {
            "title": "童心织梦 — 可持续材料工作坊",
            "description": (
                "在乡村小学开设再生面料与植物染入门课，用回收布料完成小幅拼布与围巾。"
                "材料费与讲师补贴由本活动募捐支持。"
            ),
            "cover_image": COVER_WORKSHOP,
            "start_date": datetime(2025, 9, 1),
            "end_date": datetime(2026, 1, 31),
            "goal_amount": Decimal("40000.00"),
            "current_amount": Decimal("12000.00"),
            "status": "active",
            "participant_count": 48,
            "artwork_count": 4,
        },
        {
            "title": "云岭之声 — 乡村儿童合唱团",
            "description": "为云南、贵州多地村小组建小型合唱团，提供乐谱、服装与一次进城展演机会。",
            "cover_image": COVER_CHOIR,
            "start_date": datetime(2025, 4, 1),
            "end_date": datetime(2025, 12, 20),
            "goal_amount": Decimal("60000.00"),
            "current_amount": Decimal("28000.00"),
            "status": "active",
            "participant_count": 120,
            "artwork_count": 6,
        },
    ]


async def main() -> None:
    rows = _rows()
    titles = [r["title"] for r in rows]
    inserted = 0
    updated = 0

    async with AsyncSessionLocal() as session:
        existing = (await session.execute(select(Campaign).where(Campaign.title.in_(titles)))).scalars().all()
        by_title = {c.title: c for c in existing}

        for r in rows:
            t = r["title"]
            if t not in by_title:
                c = Campaign(
                    title=r["title"],
                    description=r["description"],
                    cover_image=r["cover_image"],
                    start_date=r["start_date"],
                    end_date=r["end_date"],
                    goal_amount=r["goal_amount"],
                    current_amount=r["current_amount"],
                    status=r["status"],
                    participant_count=r["participant_count"],
                    artwork_count=r["artwork_count"],
                )
                session.add(c)
                inserted += 1
            else:
                c = by_title[t]
                old = c.cover_image or ""
                if old.startswith("/static/") or not old.startswith("http"):
                    c.cover_image = r["cover_image"]
                    if not (c.description or "").strip():
                        c.description = r["description"]
                    updated += 1

        await session.commit()

    # 列表缓存
    try:
        await invalidate_cache("campaigns:")
    except Exception:
        pass

    print(f"活动：新增 {inserted} 条，更新封面/描述 {updated} 条。")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
