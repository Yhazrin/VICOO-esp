"""
在已有数据库上回填 product name_en / description_en / trace_story_*_en。

用法：
  cd backend && python update_i18n.py

在 CI/CD 中可以这样调用：
  docker exec <container> python -c "
import sys; sys.path.insert(0, '/app');
exec(open('update_i18n.py').read())
"
"""
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal, engine
from app.models.product import Product
from app.data.product_i18n_seed import PRODUCT_I18N_BY_NAME_ZH


async def run() -> None:
    updated = 0
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Product))
        products = result.scalars().all()
        for p in products:
            key = (p.name or "").strip()
            m = PRODUCT_I18N_BY_NAME_ZH.get(key)
            if not m:
                continue
            changed = False
            if m.get("name_en"):
                p.name_en = m["name_en"]
                changed = True
            if m.get("description_en"):
                p.description_en = m["description_en"]
                changed = True
            if m.get("trace_story_title_en"):
                p.trace_story_title_en = m["trace_story_title_en"]
                changed = True
            if m.get("trace_story_content_en"):
                p.trace_story_content_en = m["trace_story_content_en"]
                changed = True
            if changed:
                updated += 1
        await session.commit()
    print(f"update_i18n: updated {updated} products.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
