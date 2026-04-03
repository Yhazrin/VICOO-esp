from fastapi import APIRouter

from app.schemas import ApiResponse

router = APIRouter(prefix="/editorial", tags=["Editorial"])

_mock_feed = [
    {
        "id": "ed-1",
        "title": "From Classroom Sketch to Circular Fashion",
        "excerpt": "How a village art class became a traceable apparel capsule that funds art supplies.",
        "pull_quote": "Every stitch carries a child's imagination forward.",
        "cover_image": "https://picsum.photos/seed/editorial-1/1200/800",
        "author": "Tonghua Editorial",
        "published_at": "2026-03-12",
        "read_time_minutes": 7,
        "category": "impact",
    },
    {
        "id": "ed-2",
        "title": "Why Recycled Cotton Matters for Rural Communities",
        "excerpt": "A field report on material sourcing, artisan income, and lower footprint fulfillment.",
        "pull_quote": "Sustainability is strongest when it is measurable and shared.",
        "cover_image": "https://picsum.photos/seed/editorial-2/1200/800",
        "author": "Sustainability Desk",
        "published_at": "2026-02-24",
        "read_time_minutes": 9,
        "category": "fashion",
    },
    {
        "id": "ed-3",
        "title": "Meet the Families Behind the Artwork",
        "excerpt": "Guardians and teachers discuss confidence growth after children see their work in public.",
        "pull_quote": "Our child started believing their voice mattered.",
        "cover_image": "https://picsum.photos/seed/editorial-3/1200/800",
        "author": "Community Team",
        "published_at": "2026-02-08",
        "read_time_minutes": 6,
        "category": "community",
    },
]


@router.get("/feed", response_model=ApiResponse)
async def get_editorial_feed(limit: int = 10):
    """Lightweight editorial feed for Stories page integration."""
    safe_limit = max(1, min(limit, 20))
    return ApiResponse(data={"items": _mock_feed[:safe_limit], "total": len(_mock_feed)})
