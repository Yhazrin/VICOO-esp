"""Apply locale-specific overrides to API content dicts (zh primary + *_en fields)."""

from __future__ import annotations

from typing import Any

from app.data.artwork_i18n_seed import ARTWORK_I18N_BY_TITLE_ZH
from app.data.supply_chain_i18n_seed import SUPPLY_CHAIN_I18N_BY_PRODUCT


def normalize_locale(locale: str | None) -> str:
    if not locale:
        return "zh"
    base = locale.strip().lower().split("-")[0]
    return "en" if base == "en" else "zh"


def localize_artwork_dict(d: dict[str, Any], locale: str) -> dict[str, Any]:
    out = dict(d)
    if normalize_locale(locale) != "en":
        return out
    title_zh = str(out.get("title") or "").strip()
    m = ARTWORK_I18N_BY_TITLE_ZH.get(title_zh, {})
    if m.get("title_en"):
        out["title"] = m["title_en"]
    if m.get("artist_name_en"):
        out["artist_name"] = m["artist_name_en"]
    if m.get("description_en"):
        out["description"] = m["description_en"]
    return out


def localize_supply_chain_row(row: dict[str, Any], product_name: str, locale: str) -> dict[str, Any]:
    out = dict(row)
    if normalize_locale(locale) != "en":
        return out
    stage = str(out.get("stage") or "").strip()
    m = SUPPLY_CHAIN_I18N_BY_PRODUCT.get(product_name.strip(), {}).get(stage, {})
    if m.get("description_en"):
        out["description"] = m["description_en"]
    if m.get("location_en"):
        out["location"] = m["location_en"]
    if m.get("carbon_note_en"):
        out["carbon_note"] = m["carbon_note_en"]
    gallery = out.get("gallery")
    if isinstance(gallery, list):
        localized_gallery = []
        for item in gallery:
            if not isinstance(item, dict):
                localized_gallery.append(item)
                continue
            g = dict(item)
            cap = str(g.get("caption") or "")
            if "有机棉田" in cap or "棉田" in cap:
                g["caption"] = "Organic cotton field (sample)"
            elif "采收" in cap or "加工" in cap:
                g["caption"] = "Harvest and primary processing clip (sample)"
            localized_gallery.append(g)
        out["gallery"] = localized_gallery
    return out


def localize_product_name(name: str, name_en: str | None, locale: str) -> str:
    if normalize_locale(locale) == "en" and name_en and str(name_en).strip():
        return str(name_en).strip()
    return name
