from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from io import BytesIO
from typing import Any, Dict, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.models.donation import Donation

API_PREFIX = "/api/v1"

try:
    pdfmetrics.registerFont(TTFont("SimHei", "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"))
    pdfmetrics.registerFont(TTFont("SimSun", "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"))
    _CHINESE_FONT = "SimHei"
except Exception:
    try:
        pdfmetrics.registerFont(TTFont("Arial", "/System/Library/Fonts/Arial.ttf"))
        _CHINESE_FONT = "Arial"
    except Exception:
        _CHINESE_FONT = "Helvetica"

_styles = getSampleStyleSheet()
_style_title = ParagraphStyle(
    "CertTitle",
    parent=_styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=24,
    alignment=TA_CENTER,
    spaceAfter=6,
)
_style_subtitle = ParagraphStyle(
    "CertSubtitle",
    parent=_styles["Normal"],
    fontName="Helvetica",
    fontSize=14,
    alignment=TA_CENTER,
    spaceAfter=30,
)
_style_body = ParagraphStyle(
    "CertBody",
    parent=_styles["Normal"],
    fontName="Helvetica",
    fontSize=12,
    alignment=TA_LEFT,
    spaceAfter=12,
)
_style_center = ParagraphStyle(
    "CertCenter",
    parent=_styles["Normal"],
    fontName="Helvetica",
    fontSize=12,
    alignment=TA_CENTER,
    spaceAfter=8,
)
_style_small = ParagraphStyle(
    "CertSmall",
    parent=_styles["Normal"],
    fontName="Helvetica",
    fontSize=10,
    alignment=TA_CENTER,
    textColor=colors.grey,
)


def build_certificate_payload(
    donation: Donation,
    campaign_title: Optional[str] = None,
) -> Dict[str, Any]:
    certificate_no = donation.certificate_no or f"TH-DON-{donation.id:06d}"
    issued_at = donation.created_at or datetime.utcnow()
    donor_name = "Anonymous Donor" if donation.is_anonymous else donation.donor_name
    amount = Decimal(str(donation.amount)).quantize(Decimal("0.00"))
    amount_display = f"{amount:,.2f} {donation.currency}"
    date_display = issued_at.strftime("%Y-%m-%d")
    campaign_display = campaign_title or "Children's Art Education Program"
    certificate_url = f"{API_PREFIX}/donations/{donation.id}/certificate"
    certificate_pdf_url = f"{certificate_url}/pdf"

    return {
        "donation_id": donation.id,
        "donor_name": donor_name,
        "amount": str(amount),
        "amount_display": amount_display,
        "currency": donation.currency,
        "date": issued_at.isoformat(),
        "date_display": date_display,
        "campaign_id": donation.campaign_id,
        "campaign_title": campaign_display,
        "certificate_no": certificate_no,
        "certificate_url": certificate_url,
        "certificate_pdf_url": certificate_pdf_url,
        "summary": [
            f"With heartfelt gratitude to {donor_name}",
            f"Donation Amount: {amount_display}",
            f"Project: {campaign_display}",
        ],
        "share_message": f"{donor_name} has made a charitable donation of {amount_display} to {campaign_display}.",
    }


def generate_certificate_pdf(payload: Dict[str, Any]) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=25 * mm,
        rightMargin=25 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    story = []
    story.append(Spacer(1, 10 * mm))

    cert_no = payload.get("certificate_no", "")
    story.append(Paragraph(cert_no, _style_center))
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("CCFS - Child Welfare x Sustainable Fashion", _style_subtitle))
    story.append(Paragraph("Donation Certificate", _style_title))
    story.append(Spacer(1, 8 * mm))

    summary = payload.get("summary", [])
    donor_text = summary[0] if len(summary) > 0 else ""
    amount_text = summary[1] if len(summary) > 1 else ""
    project_text = summary[2] if len(summary) > 2 else ""

    story.append(Paragraph(donor_text, _style_center))
    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph(amount_text, _style_body))
    story.append(Paragraph(project_text, _style_body))
    story.append(Spacer(1, 15 * mm))

    date_display = payload.get("date_display", "")
    story.append(Paragraph(f"<b>Date:</b> {date_display}", _style_center))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(f"<b>Certificate No:</b> {cert_no}", _style_center))
    story.append(Spacer(1, 15 * mm))

    story.append(
        Paragraph(
            "Thank you for helping turn children's creativity into measurable impact.",
            _style_center,
        )
    )
    story.append(
        Paragraph("Your generosity makes a real difference in children's lives.", _style_center)
    )
    story.append(Spacer(1, 20 * mm))

    line_data = [["", ""]]
    line_table = Table(line_data, colWidths=[120 * mm, 50 * mm])
    line_table.setStyle(
        TableStyle(
            [
                ("LINEBELOW", (0, 0), (-1, -1), 1, colors.HexColor("#AD9B8F")),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
            ]
        )
    )
    story.append(line_table)
    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph("VICOO Public Welfare Platform", _style_small))

    doc.build(story)
    return buffer.getvalue()
