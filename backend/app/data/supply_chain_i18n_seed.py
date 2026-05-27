"""English copy for supply-chain records keyed by product name (zh) and stage."""

from __future__ import annotations

SUPPLY_CHAIN_I18N_BY_PRODUCT: dict[str, dict[str, dict[str, str]]] = {
    "彩虹鱼棉质 T 恤": {
        "material_sourcing": {
            "description_en": "GOTS-certified organic cotton from Aksu, Xinjiang.",
            "location_en": "Aksu, Xinjiang",
            "carbon_note_en": "Field harvest and primary processing (sample data).",
        },
        "processing": {
            "description_en": "Spinning and plant-dye finishing with no harmful chemicals.",
            "location_en": "Shaoxing, Zhejiang",
        },
        "manufacturing": {
            "description_en": "Cut-and-sew at an ISO 9001 certified factory.",
            "location_en": "Shenzhen, Guangdong",
        },
        "quality_check": {
            "description_en": "12-point inspection including formaldehyde and colour fastness.",
            "location_en": "Shenzhen, Guangdong",
        },
        "shipping": {
            "description_en": "Biodegradable packaging and carbon-neutral logistics.",
            "location_en": "Nationwide delivery",
        },
    },
}
