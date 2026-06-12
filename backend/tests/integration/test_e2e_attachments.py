"""End-to-end tests for the attachment upload + hydration flow.

Covers the full chain that was previously broken:

  1. POST /api/v1/uploads/image accepts an authenticated user, persists
     the file under static/uploads/intake/<date>/, and returns a
     server-relative URL.
  2. POST /api/v1/clothing-intakes persists the URL on Attachment rows
     and echoes image_urls on the create response.
  3. GET /api/v1/clothing-intakes/mine and GET /api/v1/clothing-intakes
     (admin) bulk-load the attachments and surface image_urls on each
     row.
  4. POST /api/v1/after-sales does the same for support tickets.
  5. GET /api/v1/after-sales/mine and the admin list include image_urls.
  6. The path-prefix guard rejects URL strings that don't start with
     /static/uploads/ (e.g. /etc/passwd or an absolute filesystem path).
"""

import io
from datetime import datetime

import pytest
from httpx import AsyncClient
from PIL import Image


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Tiny valid PNG (1x1 white pixel). Written to disk so UploadFile's
# `read()` sees a real file and content-length is correct.
def _make_png_bytes(color: str = "white") -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), color).save(buf, format="PNG")
    return buf.getvalue()


def _png_upload(filename: str = "garment.png", color: str = "white") -> tuple[str, bytes, str]:
    """Build a (filename, body, mime) triple suitable for httpx `files=`."""
    return filename, _make_png_bytes(color), "image/png"


def _auth_only(headers: dict) -> dict:
    """Drop the JSON Content-Type so httpx auto-derives multipart/form-data
    when `files=` is used. All upload tests need this."""
    return {k: v for k, v in headers.items() if k.lower() != "content-type"}


# ---------------------------------------------------------------------------
# Upload endpoint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_upload_image_unauthenticated_returns_401(client: AsyncClient):
    """No bearer token — endpoint refuses (mirror admin uploadTraceMedia's
    auth requirement, minus the role gate)."""
    files = {"file": _png_upload()}
    response = await client.post("/api/v1/uploads/image", files=files)
    assert response.status_code == 401, response.text


@pytest.mark.asyncio
async def test_upload_image_happy_path_returns_relative_url(
    client: AsyncClient, user_auth_headers
):
    """An authenticated user can upload. Response includes url/mime/size."""
    files = {"file": _png_upload("happy.png")}
    response = await client.post(
        "/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers)
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["mime"] == "image/png"
    assert data["url"].startswith("/static/uploads/intake/")
    today = datetime.utcnow()
    assert f"/{today.year:04d}/{today.month:02d}/{today.day:02d}/" in data["url"]
    assert data["size_bytes"] == len(_make_png_bytes())


@pytest.mark.asyncio
async def test_upload_image_rejects_non_image(client: AsyncClient, user_auth_headers):
    """PDF/etc. should be rejected with 400 — only jpeg/png/webp/gif."""
    files = {"file": ("doc.pdf", b"%PDF-1.4 fake body", "application/pdf")}
    response = await client.post(
        "/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers)
    )
    assert response.status_code == 400, response.text
    assert "image" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_upload_image_rejects_oversize(client: AsyncClient, user_auth_headers):
    """> 10MB → 413 (mirror of supply_chain.upload_trace_media)."""
    big = b"\x89PNG\r\n\x1a\n" + b"\x00" * (10 * 1024 * 1024 + 1)
    files = {"file": ("big.png", big, "image/png")}
    response = await client.post(
        "/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers)
    )
    assert response.status_code == 413, response.text


@pytest.mark.asyncio
async def test_upload_image_writes_to_date_directory(
    client: AsyncClient, user_auth_headers
):
    """Smoke: response URL contains the year/month/day directory the
    router should have mkdir'd. The exact on-disk path is a
    filesystem concern covered by manual QA; here we just verify the
    URL contract."""
    files = {"file": _png_upload("on-disk.png")}
    response = await client.post(
        "/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers)
    )
    assert response.status_code == 200
    url = response.json()["data"]["url"]
    today = datetime.utcnow()
    expected = f"/static/uploads/intake/{today.year:04d}/{today.month:02d}/{today.day:02d}/"
    assert url.startswith(expected)


# ---------------------------------------------------------------------------
# Clothing intake — create with image_urls
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_intake_persists_image_urls(
    client: AsyncClient, user_auth_headers
):
    """A user uploads an image, then submits an intake with the returned
    URL. The create response echoes image_urls; the row is durable."""
    # 1) Upload
    files = {"file": _png_upload("garment-front.png")}
    up = await client.post(
        "/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers)
    )
    assert up.status_code == 200
    image_url = up.json()["data"]["url"]

    # 2) Create intake carrying that URL
    payload = {
        "summary": "Mixed shirts",
        "garment_types": "tshirt",
        "quantity_estimate": 3,
        "condition_notes": "Worn but clean",
        "pickup_address": "1 Test St",
        "contact_phone": "13800000000",
        "image_urls": [image_url],
    }
    response = await client.post(
        "/api/v1/clothing-intakes", json=payload, headers=user_auth_headers
    )
    assert response.status_code == 201, response.text
    data = response.json()["data"]
    assert data["image_urls"] == [image_url]


@pytest.mark.asyncio
async def test_create_intake_drops_non_static_urls(
    client: AsyncClient, user_auth_headers
):
    """URLs that don't start with /static/uploads/ are silently dropped —
    callers can't smuggle in arbitrary filesystem paths."""
    payload = {
        "summary": "Mixed shirts",
        "quantity_estimate": 1,
        "image_urls": [
            "/etc/passwd",  # absolute path, not under /static
            "https://attacker.example/x.png",  # external URL
            "javascript:alert(1)",  # scheme attack
        ],
    }
    response = await client.post(
        "/api/v1/clothing-intakes", json=payload, headers=user_auth_headers
    )
    assert response.status_code == 201, response.text
    data = response.json()["data"]
    # None of the bad URLs survived the path-prefix check
    assert data["image_urls"] == []


@pytest.mark.asyncio
async def test_intake_mine_hydrates_image_urls(
    client: AsyncClient, user_auth_headers
):
    """GET /clothing-intakes/mine echoes the URLs we attached on create."""
    files = {"file": _png_upload("a.png")}
    up = await client.post(
        "/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers)
    )
    url = up.json()["data"]["url"]

    create = await client.post(
        "/api/v1/clothing-intakes",
        json={"summary": "Shirts", "quantity_estimate": 1, "image_urls": [url]},
        headers=user_auth_headers,
    )
    assert create.status_code == 201

    mine = await client.get(
        "/api/v1/clothing-intakes/mine", headers=user_auth_headers
    )
    assert mine.status_code == 200
    rows = mine.json()["data"]
    target = next(r for r in rows if r["id"] == create.json()["data"]["id"])
    assert target["image_urls"] == [url]


@pytest.mark.asyncio
async def test_intake_admin_list_hydrates_image_urls(
    client: AsyncClient, user_auth_headers, admin_auth_headers
):
    """Admin's /clothing-intakes list shows the user's attached URLs —
    this is the original bug report: 'admin cannot see the photo'."""
    files = {"file": _png_upload("admin-sees.png")}
    up = await client.post(
        "/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers)
    )
    url = up.json()["data"]["url"]

    create = await client.post(
        "/api/v1/clothing-intakes",
        json={"summary": "Visible to admin", "quantity_estimate": 1, "image_urls": [url]},
        headers=user_auth_headers,
    )
    intake_id = create.json()["data"]["id"]

    admin_list = await client.get(
        "/api/v1/clothing-intakes?page=1&page_size=20", headers=admin_auth_headers
    )
    assert admin_list.status_code == 200
    items = admin_list.json()["data"]
    target = next((r for r in items if r["id"] == intake_id), None)
    assert target is not None, "admin list missing the new intake"
    assert target["image_urls"] == [url]


# ---------------------------------------------------------------------------
# After-sale tickets — same shape
# ---------------------------------------------------------------------------

async def _create_paid_order_for(user_id: int = 1):
    """Insert a paid order so we can attach a support ticket to it."""
    from decimal import Decimal
    from app.database import AsyncSessionLocal
    from app.models.product import Product
    from app.models.order import Order, OrderItem

    async with AsyncSessionLocal() as db:
        product = Product(
            name="Attachment Test Product",
            price=Decimal("50.00"),
            stock=10,
            status="active",
        )
        db.add(product)
        await db.flush()
        order = Order(
            user_id=user_id,
            order_no=f"TH-ATTACH-{product.id}",
            total_amount=Decimal("50.00"),
            status="paid",
            shipping_address="Test address",
        )
        db.add(order)
        await db.flush()
        db.add(OrderItem(order_id=order.id, product_id=product.id, quantity=1, price=Decimal("50.00")))
        await db.commit()
        return order.id


@pytest.mark.asyncio
async def test_after_sale_create_with_image_urls(
    client: AsyncClient, user_auth_headers
):
    order_id = await _create_paid_order_for(user_id=1)

    # Upload one image first
    files = {"file": _png_upload("evidence.png")}
    up = await client.post(
        "/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers)
    )
    url = up.json()["data"]["url"]

    payload = {
        "order_id": order_id,
        "category": "quality",
        "subject": "Defect",
        "description": "Reason: Stitching came loose",
        "image_urls": [url],
    }
    response = await client.post(
        "/api/v1/after-sales", json=payload, headers=user_auth_headers
    )
    assert response.status_code == 201, response.text
    data = response.json()["data"]
    assert data["image_urls"] == [url]


@pytest.mark.asyncio
async def test_after_sale_create_drops_non_static_urls(
    client: AsyncClient, user_auth_headers
):
    order_id = await _create_paid_order_for(user_id=1)
    payload = {
        "order_id": order_id,
        "category": "logistics",
        "subject": "Late",
        "image_urls": ["/etc/passwd", "https://x/y.png"],
    }
    response = await client.post(
        "/api/v1/after-sales", json=payload, headers=user_auth_headers
    )
    assert response.status_code == 201, response.text
    assert response.json()["data"]["image_urls"] == []


@pytest.mark.asyncio
async def test_after_sale_mine_hydrates_image_urls(
    client: AsyncClient, user_auth_headers
):
    order_id = await _create_paid_order_for(user_id=1)
    files = {"file": _png_upload("mine.png")}
    up = await client.post(
        "/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers)
    )
    url = up.json()["data"]["url"]

    created = await client.post(
        "/api/v1/after-sales",
        json={"order_id": order_id, "category": "other", "subject": "x", "image_urls": [url]},
        headers=user_auth_headers,
    )
    assert created.status_code == 201

    mine = await client.get("/api/v1/after-sales/mine", headers=user_auth_headers)
    assert mine.status_code == 200
    items = mine.json()["data"]
    target = next((t for t in items if t["id"] == created.json()["data"]["id"]), None)
    assert target is not None
    assert target["image_urls"] == [url]


@pytest.mark.asyncio
async def test_after_sale_admin_list_hydrates_image_urls(
    client: AsyncClient, user_auth_headers, admin_auth_headers
):
    order_id = await _create_paid_order_for(user_id=1)
    files = {"file": _png_upload("admin-evidence.png")}
    up = await client.post(
        "/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers)
    )
    url = up.json()["data"]["url"]

    created = await client.post(
        "/api/v1/after-sales",
        json={"order_id": order_id, "category": "quality", "subject": "y", "image_urls": [url]},
        headers=user_auth_headers,
    )
    ticket_id = created.json()["data"]["id"]

    admin_list = await client.get(
        "/api/v1/after-sales?page=1&page_size=50", headers=admin_auth_headers
    )
    assert admin_list.status_code == 200
    items = admin_list.json()["data"]
    target = next((t for t in items if t["id"] == ticket_id), None)
    assert target is not None, "admin list missing the new ticket"
    assert target["image_urls"] == [url]


# ---------------------------------------------------------------------------
# Attachment table isolation between owners
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_image_urls_isolated_between_intake_and_ticket(
    client: AsyncClient, user_auth_headers
):
    """Two uploads; one used on an intake, the other on a ticket. The
    intake's /mine must not surface the ticket's URL, and vice versa."""
    f1 = {"file": _png_upload("only-on-intake.png")}
    f2 = {"file": _png_upload("only-on-ticket.png")}
    url_intake = (await client.post("/api/v1/uploads/image", files=f1, headers=_auth_only(user_auth_headers))).json()["data"]["url"]
    url_ticket = (await client.post("/api/v1/uploads/image", files=f2, headers=_auth_only(user_auth_headers))).json()["data"]["url"]

    intake = await client.post(
        "/api/v1/clothing-intakes",
        json={"summary": "s", "quantity_estimate": 1, "image_urls": [url_intake]},
        headers=user_auth_headers,
    )
    assert intake.status_code == 201

    order_id = await _create_paid_order_for(user_id=1)
    ticket = await client.post(
        "/api/v1/after-sales",
        json={"order_id": order_id, "category": "other", "subject": "s", "image_urls": [url_ticket]},
        headers=user_auth_headers,
    )
    assert ticket.status_code == 201

    mine_intake = await client.get("/api/v1/clothing-intakes/mine", headers=user_auth_headers)
    mine_ticket = await client.get("/api/v1/after-sales/mine", headers=user_auth_headers)

    intake_row = next(r for r in mine_intake.json()["data"] if r["id"] == intake.json()["data"]["id"])
    ticket_row = next(r for r in mine_ticket.json()["data"] if r["id"] == ticket.json()["data"]["id"])

    assert intake_row["image_urls"] == [url_intake]
    assert ticket_row["image_urls"] == [url_ticket]
    assert url_ticket not in intake_row["image_urls"]
    assert url_intake not in ticket_row["image_urls"]


# ---------------------------------------------------------------------------
# After-sale review and PATCH should also surface image_urls
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_after_sale_review_keeps_image_urls(
    client: AsyncClient, user_auth_headers, admin_auth_headers
):
    """After admin reviews (approve) a ticket, the response still carries
    the image_urls it had on create — image_urls isn't dropped on status
    transitions."""
    order_id = await _create_paid_order_for(user_id=1)
    files = {"file": _png_upload("review.png")}
    url = (await client.post("/api/v1/uploads/image", files=files, headers=_auth_only(user_auth_headers))).json()["data"]["url"]

    created = await client.post(
        "/api/v1/after-sales",
        json={"order_id": order_id, "category": "quality", "subject": "issue", "image_urls": [url]},
        headers=user_auth_headers,
    )
    ticket_id = created.json()["data"]["id"]

    reviewed = await client.post(
        f"/api/v1/after-sales/{ticket_id}/review",
        json={"action": "reject", "admin_note": "Test reject"},
        headers=admin_auth_headers,
    )
    assert reviewed.status_code == 200, reviewed.text
    assert reviewed.json()["data"]["image_urls"] == [url]
