"""
公益活动封面 — 使用可直连的 Unsplash 图（VPS 上无 /static/campaigns 文件时仍可用）。

与 app/seed.py、app/add_campaigns_demo.py 保持同步。
"""
_U = "https://images.unsplash.com"
# 儿童 / 教育 / 自然 / 乡村 主题，固定参数便于缓存
COVER_SPRING = f"{_U}/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80"
COVER_HOMETOWN = f"{_U}/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
COVER_FUTURE = f"{_U}/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80"
COVER_WORKSHOP = f"{_U}/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
COVER_CHOIR = f"{_U}/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80"
