import resend
import logging
import asyncio
from app.config import settings

logger = logging.getLogger("vicoo.mailer")

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

async def send_welcome_email(to_email: str, nickname: str):
    """Send a rich, editorial-style welcome email to a new user via Resend."""
    if not settings.RESEND_API_KEY:
        logger.warning(f"RESEND_API_KEY not configured. Skipping welcome email to {to_email}")
        return

    # Don't send to internal placeholder emails
    if to_email.endswith("@oauth.vicoo.org"):
        logger.info(f"Skipping welcome email for placeholder address: {to_email}")
        return

    try:
        loop = asyncio.get_running_loop()
        
        def _send():
            return resend.Emails.send({
                "from": settings.MAIL_FROM,
                "to": [to_email],
                "subject": "The First Edition: Welcome to VICOO",
                "html": f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=IBM+Plex+Mono&display=swap');
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #F5F0E8; color: #1A1A16; font-family: 'IBM Plex Mono', monospace;">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; border: 1px solid #D4CFC4; background-color: #F5F0E8; box-shadow: 10px 10px 0px rgba(92, 64, 51, 0.05);">
                        <!-- Header / Issue Info -->
                        <tr>
                            <td style="padding: 20px 40px; border-bottom: 2px solid #1A1A16;">
                                <table width="100%">
                                    <tr>
                                        <td style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #7A6A58;">
                                            Vol. 1 — Issue 01 — {nickname.upper()}
                                        </td>
                                        <td align="right" style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #7A6A58;">
                                            Est. 2026
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Logo / Masthead -->
                        <tr>
                            <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                <h1 style="font-family: 'Playfair Display', serif; font-size: 64px; margin: 0; font-weight: 700; letter-spacing: -0.02em; line-height: 1;">
                                    VICOO
                                </h1>
                                <p style="font-size: 12px; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.4em; color: #5C4033;">
                                    Public Welfare · Sustainable Fashion
                                </p>
                            </td>
                        </tr>

                        <!-- Main Content / Hero -->
                        <tr>
                            <td style="padding: 20px 40px;">
                                <div style="background-color: #EDE6D6; padding: 30px; border: 1px solid #D4CFC4;">
                                    <h2 style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 28px; margin: 0 0 20px 0; color: #8B3A2A; line-height: 1.2;">
                                        "Art is the most intense mode of individualism that the world has known."
                                    </h2>
                                    <p style="font-size: 15px; line-height: 1.8; margin: 0;">
                                        Dear {nickname},<br><br>
                                        You have just joined a movement where children's raw creativity meets the principles of sustainable craftsmanship. At VICOO, we don't just showcase art; we transform it into a tangible legacy of hope.
                                    </p>
                                </div>
                            </td>
                        </tr>

                        <!-- Editorial Body -->
                        <tr>
                            <td style="padding: 20px 40px 40px 40px;">
                                <table width="100%">
                                    <tr>
                                        <td width="100%" style="font-size: 14px; line-height: 1.8; vertical-align: top;">
                                            <p style="margin-top: 0;">
                                                <span style="float: left; font-family: 'Playfair Display', serif; font-size: 54px; line-height: 0.8; margin: 4px 8px 0 0; color: #5C4033;">W</span>e believe every stroke of a child's brush tells a story worth preserving. By joining us, you are now a part of this narrative. Whether you are here to explore our <strong>Stories</strong>, participate in current <strong>Campaigns</strong>, or support the cause through our <strong>Sustainable Collection</strong>, your presence matters.
                                            </p>
                                            <p>
                                                Our mission is simple yet profound: to build a transparent ecosystem where every contribution is traceable, every artwork is celebrated, and every fashion piece carries a heartbeat.
                                            </p>
                                            <div style="margin-top: 30px;">
                                                <a href="{settings.FRONTEND_URL}" style="display: inline-block; padding: 15px 30px; background-color: #1A1A16; color: #F5F0E8; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em;">
                                                    Explore the Archive
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer / Colophon -->
                        <tr>
                            <td style="padding: 30px 40px; background-color: #1A1A16; color: #D4CFC4; font-size: 11px; text-align: center;">
                                <p style="margin: 0 0 10px 0; letter-spacing: 0.1em;">
                                    © 2026 VICOO PUBLIC WELFARE PROJECT
                                </p>
                                <p style="margin: 0; color: #7A6A58;">
                                    This edition was sent to {to_email}. <br>
                                    Sustainable Fashion for a Better World.
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """
            })

        response = await loop.run_in_executor(None, _send)
        logger.info(f"Editorial welcome email sent to {to_email}. ID: {response.get('id')}")
        return response
    except Exception as e:
        logger.error(f"Failed to send welcome email to {to_email}: {e}", exc_info=True)
        return None
