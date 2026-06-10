"""
彩虹鱼棉质 T 恤 — 溯源节点配图（backend/static/photo/）。

按文件名对应供应链阶段；使用 ASCII 文件名，避免 Linux/nginx 对中文 URL 兼容问题。
"""

from __future__ import annotations

import json

RAINBOW_FISH_PRODUCT_NAME = "彩虹鱼棉质 T 恤"

# stage -> gallery items
RAINBOW_FISH_GALLERY_BY_STAGE: dict[str, list[dict[str, str]]] = {
    "material_sourcing": [
        {"type": "image", "url": "/static/photo/cotton-field-1.jpg", "caption": "新疆阿克苏有机棉田"},
        {"type": "image", "url": "/static/photo/cotton-field-2.jpg", "caption": "棉田采收现场"},
    ],
    "processing": [
        {"type": "image", "url": "/static/photo/fabric-dyeing.jpg", "caption": "纱线纺织与植物染料染色"},
    ],
    "manufacturing": [
        {"type": "image", "url": "/static/photo/textile-factory.jpg", "caption": "成衣裁剪与缝制车间"},
    ],
    "quality_check": [
        {"type": "image", "url": "/static/photo/quality-check.jpg", "caption": "成品质量检验"},
    ],
    "shipping": [
        {"type": "image", "url": "/static/photo/packaging.jpg", "caption": "可降解包装与出库"},
    ],
}


def rainbow_fish_gallery_json(stage: str) -> str | None:
    items = RAINBOW_FISH_GALLERY_BY_STAGE.get(stage)
    if not items:
        return None
    return json.dumps(items, ensure_ascii=False)
