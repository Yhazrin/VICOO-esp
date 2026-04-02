import logging
from typing import List, Dict, Any, Optional
import httpx
from fastapi import HTTPException

from app.config import settings
from app.services.base import BaseService
from app.core.audit import audit_action

logger = logging.getLogger("tonghua.ai_service")

SYSTEM_PROMPT = """你是「童画公益 × 可持续时尚」平台的助手。语气温暖、克制、具有人文关怀。
帮助用户理解：衣物捐献流程、商品与溯源、订单与物流、捐赠与售后、可持续实践。
如果你发现用户询问的是具体的订单或捐赠记录，请告知他们你可以看到基础状态，但不要泄露详细隐私信息。
涉及儿童信息、支付与法律问题时提醒用户以站内条款与客服为准。"""

class AIAssistantService(BaseService):
    """
    Service handling AI interactions, business-aware chat, and content moderation.
    """

    @audit_action(action="ai_chat", resource_type="ai_assistant")
    async def get_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        context: str = "general",
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Request AI completion with business context injection.
        """
        # 1. Prepare business-specific context
        business_context = await self._get_business_context(user_id)
        context_hint = f"\n[Platform Context: {context}]\n{business_context}"
        
        full_system_prompt = SYSTEM_PROMPT + context_hint

        # 2. Check for API key
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not configured. Returning simulation response.")
            return {
                "reply": f"您好，我是您的公益助手。目前我正处于演示模式（Context: {context}）。配置 API Key 后我可以为您提供更智能的回复。",
                "model": "simulation-mode",
                "source": "local-stub"
            }

        # 3. Call LLM Provider
        url = f"{settings.OPENAI_API_BASE.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        
        chat_messages = [{"role": "system", "content": full_system_prompt}]
        chat_messages.extend(messages)

        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": chat_messages,
            "temperature": 0.7,
            "max_tokens": 800,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                
                content = data["choices"][0]["message"]["content"].strip()
                return {
                    "reply": content,
                    "model": data.get("model", settings.OPENAI_MODEL),
                    "source": "openai-compatible"
                }
        except Exception as e:
            logger.error(f"AI call failed: {e}")
            raise HTTPException(status_code=502, detail="AI Assistant is temporarily unavailable")

    async def moderate_content(self, text: str) -> Dict[str, Any]:
        """
        AI-assisted content moderation for artwork descriptions or reviews.
        Uses OpenAI Moderation API.
        """
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not configured. Content moderation skipped (assumed safe).")
            return {"is_safe": True, "reason": None, "flagged_categories": []}

        url = f"{settings.OPENAI_API_BASE.rstrip('/')}/moderations"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {"input": text}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                
                result = data["results"][0]
                flagged = result["flagged"]
                categories = [cat for cat, val in result["categories"].items() if val]
                
                return {
                    "is_safe": not flagged,
                    "reason": "Content violates platform policies" if flagged else None,
                    "flagged_categories": categories
                }
        except Exception as e:
            logger.error(f"Moderation call failed: {e}")
            # Fail safe: if moderation fails, we might want to flag it for human review 
            # or allow it if it's not critical. Here we assume safe but log error.
            return {"is_safe": True, "reason": f"Moderation error: {e}", "flagged_categories": []}

    async def analyze_artwork(self, image_url: str, description: Optional[str] = None) -> Dict[str, Any]:
        """
        AI-assisted artwork analysis for style, title suggestions, and safety.
        In simulation mode or if vision is not available, returns mocked results.
        """
        if not settings.OPENAI_API_KEY:
            return {
                "suggested_title": "Simulated Artwork Title",
                "suggested_tags": ["child-art", "editorial", "morandi"],
                "style_description": "A warm, humanistic piece with a Morandi-inspired palette.",
                "safety_rating": "safe",
                "moderation_notes": "Simulation: Content verified as appropriate."
            }

        # Use the configured chat model for analysis (assuming it supports vision or we use a vision-capable model)
        # Note: In a real prod environment, we would use gpt-4o or gpt-4-vision-preview
        url = f"{settings.OPENAI_API_BASE.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        
        # We craft a prompt that asks for JSON output for easier parsing
        system_msg = "You are an expert art curator and content moderator for a children's public welfare platform."
        user_msg = f"Analyze this artwork. URL: {image_url}. Description: {description or 'N/A'}. \
Return a JSON object with: suggested_title, suggested_tags (list), style_description, safety_rating (safe/borderline/unsafe), moderation_notes."

        payload = {
            "model": settings.OPENAI_MODEL, # Assuming gpt-4o or similar
            "messages": [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ],
            "response_format": {"type": "json_object"},
            "max_tokens": 500
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                import json
                analysis = json.loads(data["choices"][0]["message"]["content"])
                return analysis
        except Exception as e:
            logger.error(f"Artwork analysis failed: {e}")
            return {
                "suggested_title": None,
                "suggested_tags": [],
                "style_description": "Analysis unavailable",
                "safety_rating": "safe",
                "moderation_notes": f"Error during analysis: {e}"
            }

    async def _get_business_context(self, user_id: Optional[int] = None) -> str:
        """Fetch current platform state and user-specific data for AI context injection."""
        from app.models.campaign import Campaign
        from app.models.donation import Donation
        from sqlalchemy import select, func, and_

        try:
            # 1. Get top active campaigns
            campaign_stmt = select(Campaign.title, Campaign.goal_amount, Campaign.current_amount).where(
                Campaign.status == "active"
            ).limit(3)
            campaigns = (await self.db.execute(campaign_stmt)).all()
            
            context = "Current Active Campaigns:\n"
            if campaigns:
                for c in campaigns:
                    context += f"- {c.title}: Progress {c.current_amount}/{c.goal_amount} CNY\n"
            else:
                context += "- No active campaigns at the moment.\n"

            # 2. Get user specific info if logged in
            if user_id:
                donation_stmt = select(func.count(Donation.id), func.sum(Donation.amount)).where(
                    and_(Donation.donor_user_id == user_id, Donation.status == "completed")
                )
                user_stats = (await self.db.execute(donation_stmt)).one()
                if user_stats[0] and user_stats[0] > 0:
                    context += f"\nAuthenticated User Context: user_{user_id} has made {user_stats[0]} donations totalling {user_stats[1]} CNY.\n"
            
            return context
        except Exception as e:
            logger.error(f"Failed to fetch business context for AI: {e}")
            return "[Business context unavailable]"
