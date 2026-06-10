"""
Canonical demo campaign catalog (8 items) aligned with static files:

  /static/campaigns/campaign_{seq}.jpg

Order matches images in Downloads/图片/compaign (1)–(8).
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

CAMPAIGN_COUNT = 8
CAMPAIGN_STATIC_PREFIX = "/static/campaigns/campaign_"


def campaign_cover_url(seq: int) -> str:
    return f"{CAMPAIGN_STATIC_PREFIX}{seq}.jpg"


# Dates are staggered so list/detail pages show varied campaign states.
CAMPAIGN_CATALOG: list[dict[str, Any]] = [
    {
        "seq": 1,
        "title": "One Brushstroke for the Mountains",
        "subtitle": "Each garment funds one rural art class",
        "description": (
            "A share of every impact product sale supports art education for children in remote areas, "
            "turning creativity into a language of self-expression. "
            "Each order is mapped to transparent records of funded class hours and classroom supplies."
        ),
        "start_date": datetime(2025, 3, 1),
        "end_date": datetime(2025, 8, 31),
        "goal_amount": Decimal("80000.00"),
        "current_amount": Decimal("42800.00"),
        "status": "active",
        "participant_count": 186,
        "artwork_count": 12,
        "sustainability_eyebrow": "Child Welfare · Art Education",
        "sustainability_title": "Turn Purchases into Classrooms",
        "sustainability_subtitle": "Revenue sharing is transparently routed to rural art programs",
    },
    {
        "seq": 2,
        "title": "Weaving Back the Colors of Home",
        "subtitle": "From local natural fibers to traceable wardrobes",
        "description": (
            "In partnership with local cooperatives, this campaign uses plant dyes and native natural fibers, "
            "with full transparency from raw material harvesting to spinning, dyeing, and finished garments."
        ),
        "start_date": datetime(2025, 4, 15),
        "end_date": datetime(2025, 10, 15),
        "goal_amount": Decimal("120000.00"),
        "current_amount": Decimal("51200.00"),
        "status": "active",
        "participant_count": 142,
        "artwork_count": 9,
        "sustainability_eyebrow": "Local Materials · Traceability",
        "sustainability_title": "See the Land in Its Original Colors",
        "sustainability_subtitle": "Local fibers and craft traditions return to modern wardrobes",
    },
    {
        "seq": 3,
        "title": "The Growth Diary of a Garment",
        "subtitle": "See the material, the craft, and the impact",
        "description": (
            "An end-to-end timeline reveals each product journey while making every order's social contribution "
            "explicit, so customers can understand how one garment creates measurable value."
        ),
        "start_date": datetime(2025, 5, 1),
        "end_date": datetime(2025, 11, 30),
        "goal_amount": Decimal("60000.00"),
        "current_amount": Decimal("28900.00"),
        "status": "active",
        "participant_count": 98,
        "artwork_count": 6,
        "sustainability_eyebrow": "End-to-End Transparency",
        "sustainability_title": "A Fully Public Product Journey",
        "sustainability_subtitle": "Material, factory, and welfare milestones in one clear view",
    },
    {
        "seq": 4,
        "title": "Little Designers Co-Creation Lab",
        "subtitle": "Children's ideas become products people buy",
        "description": (
            "Children co-create original patterns, and a proportional share of revenue flows back to their schools "
            "or communities, turning creativity from exhibition pieces into sustainable impact products."
        ),
        "start_date": datetime(2025, 6, 1),
        "end_date": datetime(2025, 12, 31),
        "goal_amount": Decimal("95000.00"),
        "current_amount": Decimal("37600.00"),
        "status": "active",
        "participant_count": 210,
        "artwork_count": 18,
        "sustainability_eyebrow": "Child Co-Creation",
        "sustainability_title": "Creativity on the Shelf, Impact on the Ground",
        "sustainability_subtitle": "Co-created works and revenue-sharing reports are published in sync",
    },
    {
        "seq": 5,
        "title": "Hometown Fiber Revival",
        "subtitle": "Bring overlooked local materials back to modern life",
        "description": (
            "This program reimagines regional fibers and traditional craftsmanship through contemporary design, "
            "driving rural jobs and skill preservation while building a traceable, purchasable sustainable product line."
        ),
        "start_date": datetime(2025, 7, 1),
        "end_date": datetime(2026, 1, 31),
        "goal_amount": Decimal("150000.00"),
        "current_amount": Decimal("22100.00"),
        "status": "active",
        "participant_count": 76,
        "artwork_count": 5,
        "sustainability_eyebrow": "Rural Industry",
        "sustainability_title": "New Life for Fibers, New Future for Craft",
        "sustainability_subtitle": "Local materials integrated with modern supply chains",
    },
    {
        "seq": 6,
        "title": "100 Days of Transparent Workshop",
        "subtitle": "Daily updates on production and social impact",
        "description": (
            "By publishing production milestones, quality checks, and donation allocations every day, "
            "this campaign builds a high-frequency transparency model for how an impact product is made."
        ),
        "start_date": datetime(2025, 8, 1),
        "end_date": datetime(2026, 2, 28),
        "goal_amount": Decimal("70000.00"),
        "current_amount": Decimal("18400.00"),
        "status": "active",
        "participant_count": 54,
        "artwork_count": 4,
        "sustainability_eyebrow": "Transparent Production",
        "sustainability_title": "100 Days, Visible Every Day",
        "sustainability_subtitle": "Workshop progress and welfare disbursement updated together",
    },
    {
        "seq": 7,
        "title": "From One Acre of Cotton to One Act of Care",
        "subtitle": "Sustainable materials linking land to children's futures",
        "description": (
            "Focused on low-impact cultivation and recycled inputs, this initiative directs sales contributions "
            "to child nutrition and education programs, connecting farms, factories, and social projects in one verifiable chain."
        ),
        "start_date": datetime(2025, 9, 1),
        "end_date": datetime(2026, 3, 31),
        "goal_amount": Decimal("110000.00"),
        "current_amount": Decimal("15300.00"),
        "status": "active",
        "participant_count": 88,
        "artwork_count": 7,
        "sustainability_eyebrow": "Sustainable Agriculture",
        "sustainability_title": "One Acre, One Act of Care",
        "sustainability_subtitle": "A closed loop from land to fiber to child-focused programs",
    },
    {
        "seq": 8,
        "title": "Old Clothes Renewed, New Dreams Enabled",
        "subtitle": "Every return creates a new layer of protection",
        "description": (
            "By binding garment take-back and upcycling to child welfare outcomes, this campaign creates a "
            "\"collect-rebuild-give\" loop that makes circular fashion trackable and participatory in daily life."
        ),
        "start_date": datetime(2025, 10, 1),
        "end_date": datetime(2026, 4, 30),
        "goal_amount": Decimal("85000.00"),
        "current_amount": Decimal("9200.00"),
        "status": "active",
        "participant_count": 63,
        "artwork_count": 3,
        "sustainability_eyebrow": "Circular Fashion",
        "sustainability_title": "A New Destination for Old Garments",
        "sustainability_subtitle": "Upcycling revenue directly supports child-focused initiatives",
    },
]
