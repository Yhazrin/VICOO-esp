import pytest
from httpx import AsyncClient
from unittest.mock import patch
from app.utils.i18n import t

@pytest.mark.asyncio
class TestAIAndAdvancedFeatures:
    """Tests for Iteration 7 features: AI, i18n, and Anomaly Detection."""

    async def test_ai_chat_completion(self, client: AsyncClient, auth_headers):
        """Test AI chat endpoint with simulated response."""
        payload = {
            "messages": [{"role": "user", "content": "Tell me about your brand."}],
            "context": "general"
        }
        # Force simulation mode by patching settings
        with patch("app.services.ai_assistant.service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = None
            response = await client.post("/api/ai/chat", json=payload, headers=auth_headers)
            assert response.status_code == 200
            data = response.json()["data"]
            assert "公益助手" in data["reply"]
            assert data["source"] == "local-stub"

    async def test_artwork_analysis(self, client: AsyncClient, auth_headers):
        """Test artwork analysis endpoint."""
        payload = {
            "image_url": "http://example.com/artwork.jpg",
            "description": "A painting of a tree."
        }
        with patch("app.services.ai_assistant.service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = None
            response = await client.post("/api/ai/analyze-artwork", json=payload, headers=auth_headers)
            assert response.status_code == 200
            data = response.json()["data"]
            assert "suggested_title" in data
            assert data["safety_rating"] == "safe"

    async def test_content_moderation(self, client: AsyncClient, auth_headers):
        """Test content moderation endpoint."""
        payload = {"text": "This is a safe comment."}
        with patch("app.services.ai_assistant.service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = None
            response = await client.post("/api/ai/moderate-content", json=payload, headers=auth_headers)
            assert response.status_code == 200
            data = response.json()["data"]
            assert data["is_safe"] is True

    async def test_anomaly_detection_frequent_donations(self, client: AsyncClient, auth_headers):
        """Test anomaly detection blocks frequent small donations."""
        # Mock the AnomalyDetectionService.is_transaction_risky to return True
        with patch("app.services.anomaly_detection.service.AnomalyDetectionService.is_transaction_risky", return_value=True):
            payload = {
                "amount": 1.0,
                "currency": "CNY",
                "donor_name": "Test Donor",
                "payment_method": "wechat"
            }
            response = await client.post("/api/donations", json=payload, headers=auth_headers)
            # Should be blocked by AnomalyDetectionService
            assert response.status_code == 403
            assert "flagged by security system" in response.json()["detail"]

    async def test_i18n_utility(self):
        """Test i18n utility directly."""
        # English
        assert "Resource not found." in t("errors.not_found", locale="en")
        # Chinese
        assert "未找到资源。" in t("errors.not_found", locale="zh")
        # Placeholder
        assert "Dear User," in t("emails.welcome.greeting", locale="en", nickname="User")
        assert "亲爱的 User：" in t("emails.welcome.greeting", locale="zh", nickname="User")
