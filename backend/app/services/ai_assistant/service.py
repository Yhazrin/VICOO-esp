import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
import re
import json
from pathlib import Path
from functools import lru_cache
import httpx
from urllib.parse import urljoin
from fastapi import HTTPException

from app.config import settings
from app.services.base import BaseService
from app.core.audit import audit_action
from app.models.audit import AuditLog
from app.services.supply_chain.service import SupplyChainService
from app.models.product import Product
from app.services.ai_assistant.prompts import (
    get_catalog_clarification,
    get_grounded_stub,
    get_simulation_reply,
    get_system_prompt,
    get_tool_output_language_hint,
    get_traceability_tool_blurb,
)

logger = logging.getLogger("vicoo.ai_service")


def _escape_like(term: str) -> str:
    """Escape SQL LIKE wildcards to prevent pattern injection."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


_SYNONYM_CONFIG_PATH = Path(__file__).resolve().parents[2] / "data" / "ai_search_synonyms.json"
_DEFAULT_SYNONYM_CONFIG = {
    "aliases": {},
    "fragments": [],
}


@lru_cache(maxsize=1)
def _read_synonym_config() -> Dict[str, Any]:
    try:
        with _SYNONYM_CONFIG_PATH.open("r", encoding="utf-8") as fh:
            loaded = json.load(fh)
            if isinstance(loaded, dict):
                return loaded
    except Exception as exc:
        logger.warning("Failed to load AI synonym config: %s", exc)
    return _DEFAULT_SYNONYM_CONFIG


@lru_cache(maxsize=1)
def _read_alias_map() -> Dict[str, List[str]]:
    aliases = _read_synonym_config().get("aliases", {})
    alias_map: Dict[str, List[str]] = {}
    for canonical, raw_variants in aliases.items():
        variants = []
        for entry in [canonical, *(raw_variants or [])]:
            if isinstance(entry, str) and entry not in variants:
                variants.append(entry)
        for entry in variants:
            alias_map[entry.lower()] = variants
    return alias_map

class AIAssistantService(BaseService):
    """
    Service handling AI interactions, business-aware chat, and content moderation.
    """

    @audit_action(action="ai_chat", resource_type="ai_assistant")
    async def get_chat_completion(
        self,
        messages: List[Dict[str, str]],
        context: str = "general",
        user_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Request AI completion with business context injection.
        """
        last_user = self._get_last_user_message(messages)
        if self._should_ask_catalog_clarification(last_user):
            return {
                "reply": get_catalog_clarification(metadata, last_user),
                "model": "rule-based-clarifier",
                "source": "tooling"
            }
        catalog_scope = self._determine_catalog_scope(last_user, context, metadata)

        # 1. Prepare business-specific context
        business_context = await self._get_business_context(user_id)
        context_hint = f"\n[Platform Context: {context}]\n{business_context}"

        full_system_prompt = (
            get_system_prompt(metadata, last_user)
            + context_hint
            + f"\n[Catalog Routing]\nSelected catalog scope: {catalog_scope}\n"
        )

        # 2. Lightweight tool invocation: detect explicit product/search/trace intents and fetch factual data
        tool_output = await self._maybe_call_tools(messages, context, metadata, catalog_scope)
        if tool_output:
            full_system_prompt += get_tool_output_language_hint(metadata, last_user)
            full_system_prompt += f"\n\n[Tool Output]\n{tool_output}\n[End Tool Output]\n\nPlease use the above factual tool output to ground your answer and cite sources."

        # 2b. Retrieval-Augmented Generation (RAG) — fetch relevant snippets to ground answers for Impact/sustainability/shop contexts
        use_rag = False
        if metadata and isinstance(metadata, dict):
            if metadata.get("use_rag") is True:
                use_rag = True
        if not use_rag:
            if context in ("impact", "sustainability", "shop") or (metadata and metadata.get("impactMode")):
                use_rag = True

        rag_output = ""
        if use_rag and last_user:
            rag_output = await self._retrieve_rag(last_user, context, catalog_scope, metadata)
            if rag_output:
                full_system_prompt += get_tool_output_language_hint(metadata, last_user)
                full_system_prompt += f"\n\n[Retrieval Results]\n{rag_output}\n[End Retrieval]\n\nPlease use the above retrieval snippets to ground your answer and cite sources."

        # 3. Check for API key
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not configured. Returning simulation response.")
            grounded = tool_output or rag_output
            if grounded:
                return {
                    "reply": get_grounded_stub(grounded, metadata, last_user),
                    "model": "simulation-mode",
                    "source": "local-stub"
                }
            return {
                "reply": get_simulation_reply(context, metadata, last_user),
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
                
                content = self._sanitize_assistant_reply(
                    data["choices"][0]["message"]["content"].strip()
                )
                return {
                    "reply": content,
                    "model": data.get("model", settings.OPENAI_MODEL),
                    "source": "openai-compatible"
                }
        except Exception as e:
            logger.error("AI call failed: %s", e)
            raise HTTPException(status_code=502, detail="AI Assistant is temporarily unavailable")

    async def get_chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        context: str = "general",
        user_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream AI completion using MiniMax Anthropic-compatible API (SSE)."""
        last_user = self._get_last_user_message(messages)

        if self._should_ask_catalog_clarification(last_user):
            reply = get_catalog_clarification(metadata, last_user)
            yield f"data: {json.dumps({'type': 'content_block_delta', 'text': reply})}\n\n"
            yield f"data: {json.dumps({'type': 'message_stop', 'model': 'rule-based-clarifier', 'source': 'tooling'})}\n\n"
            return

        catalog_scope = self._determine_catalog_scope(last_user, context, metadata)
        business_context = await self._get_business_context(user_id)
        context_hint = f"\n[Platform Context: {context}]\n{business_context}"
        full_system_prompt = (
            get_system_prompt(metadata, last_user)
            + context_hint
            + f"\n[Catalog Routing]\nSelected catalog scope: {catalog_scope}\n"
        )

        tool_output = await self._maybe_call_tools(messages, context, metadata, catalog_scope)
        if tool_output:
            full_system_prompt += get_tool_output_language_hint(metadata, last_user)
            full_system_prompt += f"\n\n[Tool Output]\n{tool_output}\n[End Tool Output]\n\nPlease use the above factual tool output to ground your answer and cite sources."

        use_rag = False
        if metadata and isinstance(metadata, dict):
            if metadata.get("use_rag") is True:
                use_rag = True
        if not use_rag:
            if context in ("impact", "sustainability", "shop") or (metadata and metadata.get("impactMode")):
                use_rag = True
        if use_rag and last_user:
            rag_output = await self._retrieve_rag(last_user, context, catalog_scope, metadata)
            if rag_output:
                full_system_prompt += get_tool_output_language_hint(metadata, last_user)
                full_system_prompt += f"\n\n[Retrieval Results]\n{rag_output}\n[End Retrieval]\n\nPlease use the above retrieval snippets to ground your answer and cite sources."

        if not settings.OPENAI_API_KEY:
            grounded = tool_output or ""
            reply = (
                get_grounded_stub(grounded, metadata, last_user)
                if grounded
                else get_simulation_reply(context, metadata, last_user)
            )
            yield f"data: {json.dumps({'type': 'content_block_delta', 'text': reply})}\n\n"
            yield f"data: {json.dumps({'type': 'message_stop', 'model': 'simulation-mode', 'source': 'local-stub'})}\n\n"
            return

        # Use Anthropic-compatible endpoint: https://api.minimax.chat/anthropic/v1/messages
        # OPENAI_API_BASE is https://api.minimax.chat/v1 — strip the trailing /v1
        base = settings.OPENAI_API_BASE.rstrip('/')
        if base.endswith('/v1'):
            base = base[:-3]
        url = f"{base}/anthropic/v1/messages"
        headers = {
            "X-Api-Key": settings.OPENAI_API_KEY,
            "Content-Type": "application/json",
        }

        anthropic_messages = []
        for m in messages:
            anthropic_messages.append({"role": m["role"], "content": m["content"]})

        payload = {
            "model": settings.OPENAI_MODEL,
            "system": full_system_prompt,
            "messages": anthropic_messages,
            "max_tokens": 800,
            "temperature": 0.7,
            "stream": True,
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        body = await response.aread()
                        logger.error("Anthropic stream error %s: %s", response.status_code, body.decode()[:300])
                        yield f"data: {json.dumps({'type': 'error', 'error': f'Upstream returned {response.status_code}'})}\n\n"
                        return

                    buffer = ""
                    async for chunk in response.aiter_text():
                        buffer += chunk
                        while "\n" in buffer:
                            line, buffer = buffer.split("\n", 1)
                            line = line.strip()
                            if not line or line.startswith(":"):
                                continue
                            if line.startswith("event:"):
                                continue
                            if line.startswith("data:"):
                                data_str = line[5:].strip()
                                if data_str == "[DONE]":
                                    yield f"data: {json.dumps({'type': 'message_stop', 'model': settings.OPENAI_MODEL, 'source': 'anthropic-stream'})}\n\n"
                                    return
                                try:
                                    evt = json.loads(data_str)
                                    evt_type = evt.get("type", "")

                                    if evt_type == "content_block_delta":
                                        delta = evt.get("delta", {})
                                        text = delta.get("text", "")
                                        if text:
                                            yield f"data: {json.dumps({'type': 'content_block_delta', 'text': text})}\n\n"
                                    elif evt_type == "message_stop":
                                        yield f"data: {json.dumps({'type': 'message_stop', 'model': settings.OPENAI_MODEL, 'source': 'anthropic-stream'})}\n\n"
                                        return
                                except json.JSONDecodeError:
                                    continue

                    # If we exit the loop without explicit stop
                    yield f"data: {json.dumps({'type': 'message_stop', 'model': settings.OPENAI_MODEL, 'source': 'anthropic-stream'})}\n\n"

        except Exception as e:
            logger.error("Anthropic stream failed: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'error': 'Stream processing failed'})}\n\n"

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
            logger.exception("Moderation call failed")
            # Fail closed: for a children's platform, flag unmoderated content for manual review
            return {"is_safe": False, "reason": "Moderation service temporarily unavailable — flagged for manual review", "flagged_categories": []}

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
            logger.error("Artwork analysis failed: %s", e)
            return {
                "suggested_title": None,
                "suggested_tags": [],
                "style_description": "Analysis unavailable",
                "safety_rating": "safe",
                "moderation_notes": "Analysis temporarily unavailable"
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
            logger.error("Failed to fetch business context for AI: %s", e)
            return "[Business context unavailable]"

    async def _get_donation_context(self, user_id: Optional[int] = None) -> str:
        """Fetch donation stats and user donation history for AI context."""
        from app.services.donation.service import DonationService
        from app.models.donation import Donation
        from sqlalchemy import select, and_
        try:
            svc = DonationService(self.db)
            stats = await svc.get_stats()
            ctx = f"Platform donation stats: total {stats.get('total_amount', 0)} {stats.get('currency', 'CNY')}, {stats.get('total_donors', 0)} donors\n"
            tiers = [
                {"name": "Bronze", "amount": 50},
                {"name": "Silver", "amount": 200},
                {"name": "Gold", "amount": 500},
                {"name": "Platinum", "amount": 2000},
            ]
            ctx += "Donation tiers: " + ", ".join(f"{t['name']}({t['amount']} CNY)" for t in tiers) + "\n"
            ctx += "Donation flow: select tier → pay → auto-generate e-certificate\n"
            if user_id:
                stmt = select(Donation).where(
                    and_(Donation.donor_user_id == user_id, Donation.status == "completed")
                ).order_by(Donation.created_at.desc()).limit(5)
                donations = (await self.db.execute(stmt)).scalars().all()
                if donations:
                    ctx += f"User recent donation history:\n"
                    for d in donations:
                        ts = d.created_at.strftime("%Y-%m-%d") if d.created_at else "N/A"
                        ctx += f"  - {ts} | {d.amount} {d.currency} | {d.payment_method or 'N/A'} | {d.status}\n"
                else:
                    ctx += "No donation history for this user.\n"
            return ctx
        except Exception as e:
            logger.error("Failed to get donation context: %s", e)
            return ""

    async def _get_campaign_context(self) -> str:
        """Fetch active campaign progress for AI context."""
        from app.services.campaign.service import CampaignService
        try:
            svc = CampaignService(self.db)
            campaign = await svc.get_active_campaign()
            if campaign:
                progress = (campaign.current_amount / campaign.goal_amount * 100) if campaign.goal_amount else 0
                ctx = f"Active campaign: {campaign.title}\n"
                ctx += f"Goal: {campaign.goal_amount} CNY, Raised: {campaign.current_amount} CNY ({progress:.1f}%)\n"
                if campaign.description:
                    ctx += f"Description: {campaign.description[:200]}\n"
                return ctx
            return "No active fundraising campaigns at the moment.\n"
        except Exception as e:
            logger.error("Failed to get campaign context: %s", e)
            return ""

    async def _get_impact_fund_context(self) -> str:
        """Fetch impact fund summary for AI context."""
        from app.services.impact_fund.service import ImpactFundService
        try:
            svc = ImpactFundService(self.db)
            summary = await svc.get_fund_summary()
            ctx = f"Impact fund total allocated: {summary.get('total_amount', 0)} CNY, {summary.get('total_entries', 0)} entries\n"
            by_type = summary.get("by_type", {})
            for t in by_type:
                ctx += f"  - {t.get('type', 'N/A')}: {t.get('amount', 0)} CNY ({t.get('count', 0)} entries)\n"
            ctx += "Allocation: each impact product sale → 60% artist / 30% school / 10% charity pool\n"
            return ctx
        except Exception as e:
            logger.error("Failed to get impact fund context: %s", e)
            return ""

    def _get_clothing_recycle_context(self) -> str:
        """Return clothing recycle flow info for AI context."""
        base_url = self._resolve_frontend_base_url()
        return (
            "Clothing recycling flow:\n"
            "1. User submits recycling request on the Clothing Recycle page\n"
            "2. Platform arranges pickup or user ships items\n"
            "3. Items go through sorting, cleaning, and sanitization\n"
            "4. Wearable items donated to children; non-wearable recycled sustainably\n"
            f"Recycle entry: {urljoin(base_url, 'clothing-recycle')}\n"
            f"Donate clothing entry: {urljoin(base_url, 'donate-clothing')}\n"
        )

    def _get_last_user_message(self, messages: List[Dict[str, str]]) -> str:
        if not messages:
            return ""
        for m in reversed(messages):
            if m.get("role") == "user":
                return (m.get("content") or "").strip()
        return ""

    def _sanitize_assistant_reply(self, content: str) -> str:
        """Remove chain-of-thought style tags/content before returning to UI."""
        if not content:
            return ""
        cleaned = content
        # Standard/variant think tags
        cleaned = re.sub(r"<think\b[^>]*>[\s\S]*?<\/think>", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"<thinking\b[^>]*>[\s\S]*?<\/thinking>", "", cleaned, flags=re.IGNORECASE)
        # Defensive: if model leaks closing tag only, keep visible answer after the tag
        if re.search(r"</think>", cleaned, flags=re.IGNORECASE):
            cleaned = re.split(r"</think>", cleaned, flags=re.IGNORECASE)[-1]
        if re.search(r"</thinking>", cleaned, flags=re.IGNORECASE):
            cleaned = re.split(r"</thinking>", cleaned, flags=re.IGNORECASE)[-1]
        # Defensive fenced reasoning block
        cleaned = re.sub(r"```(?:think|reasoning)[\s\S]*?```", "", cleaned, flags=re.IGNORECASE)
        cleaned = cleaned.strip()
        return cleaned or content.strip()

    def _contains_sustainability_intent(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        if not text:
            return False
        lowered = text.lower()
        if any(k in text for k in ["可持续", "环保", "公益", "捐赠", "慈善", "溯源"]):
            return True
        if any(k in lowered for k in ["sustainable", "sustainability", "impact", "charity", "donation"]):
            return True
        if metadata and isinstance(metadata, dict):
            extra_keywords = metadata.get("sustainabilityPriorityKeywords")
            if isinstance(extra_keywords, list):
                for kw in extra_keywords:
                    if isinstance(kw, str) and (kw in text or kw.lower() in lowered):
                        return True
        return False

    def _mentions_catalog_preference(self, text: str) -> bool:
        if not text:
            return False
        lowered = text.lower()
        keywords = [
            "uniqlo",
            "impact",
            "公益",
            "优衣库",
            "公益线",
            "常规店",
            "普通店",
        ]
        return any(k in lowered or k in text for k in keywords)

    def _has_product_recommendation_intent(self, text: str) -> bool:
        if not text:
            return False
        lowered = text.lower()
        return (
            any(k in lowered for k in ["recommend", "search", "find", "bag", "tote", "clothing", "clothes", "tshirt", "t-shirt"])
            or any(k in text for k in ["推荐", "搜索", "查找", "找", "商品", "包", "衣物", "衣服", "t恤", "T恤"])
        )

    def _should_ask_catalog_clarification(self, text: str) -> bool:
        if not text:
            return False
        if self._mentions_catalog_preference(text):
            return False
        if self._contains_sustainability_intent(text):
            return False
        return self._has_product_recommendation_intent(text)

    def _determine_catalog_scope(self, last_user: str, context: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Determine preferred product catalog scope: impact | uniqlo | mixed."""
        if self._contains_sustainability_intent(last_user, metadata):
            return "impact"

        if metadata and isinstance(metadata, dict):
            route = str(metadata.get("route") or "").lower()
            surface = str(metadata.get("surface") or "").lower()
            preferred = str(metadata.get("preferredCatalog") or "").lower()
            impact_mode = bool(metadata.get("impactMode"))
            if preferred in ("impact", "uniqlo", "mixed"):
                return preferred
            if impact_mode or "impact" in route or surface == "impact":
                return "impact"
            if "/shop" in route or surface == "uniqlo":
                return "uniqlo"

        if context in ("impact", "sustainability"):
            return "impact"
        if context in ("shop", "logistics", "general"):
            return "uniqlo"
        return "mixed"

    def _extract_search_terms(self, query: str, limit: int = 6) -> List[str]:
        """Extract Chinese and Latin keywords for DB matching."""
        if not query:
            return []
        synonym_config = self._load_synonym_config()
        alias_map = self._load_alias_map()
        normalized_query = query.lower()
        normalized_query = re.sub(r"\b(t[\s-]?shirt|tee[\s-]?shirt)\b", " tshirt ", normalized_query)
        normalized_query = re.sub(r"\b(back[\s-]?pack)\b", " backpack ", normalized_query)
        normalized_query = re.sub(r"\b(tote[\s-]?bag)\b", " tote ", normalized_query)
        tokens = re.findall(r"[\u4e00-\u9fff]+|[A-Za-z0-9]+", normalized_query)
        normalized: List[str] = []
        for tok in tokens:
            if re.fullmatch(r"[A-Za-z0-9]+", tok):
                if len(tok) < 2:
                    continue
                normalized.extend(alias_map.get(tok.lower(), [tok.lower()]))
            else:
                normalized.append(tok)
                if len(tok) >= 4:
                    for kw in synonym_config.get("fragments", []):
                        if kw in tok:
                            normalized.append(kw)
            if len(normalized) >= limit:
                break
        deduped: List[str] = []
        for term in normalized:
            if term not in deduped:
                deduped.append(term)
        return deduped[:limit]

    def _load_synonym_config(self) -> Dict[str, Any]:
        return _read_synonym_config()

    def _load_alias_map(self) -> Dict[str, List[str]]:
        return _read_alias_map()

    def _resolve_frontend_base_url(self, metadata: Optional[Dict[str, Any]] = None) -> str:
        base = ""
        if metadata and isinstance(metadata, dict):
            origin = metadata.get("frontendOrigin") or metadata.get("origin")
            if isinstance(origin, str) and origin.startswith(("http://", "https://")):
                base = origin.rstrip("/")
        if not base:
            base = (settings.FRONTEND_URL or "http://localhost:9111").rstrip("/")
        # Dev: FRONTEND_URL may be http://localhost without Vite port
        lowered = base.lower()
        if lowered in ("http://localhost", "https://localhost", "http://127.0.0.1", "https://127.0.0.1"):
            base = "http://localhost:9111"
        return base + "/"

    def _build_product_url(
        self, product_id: int, is_impact_product: bool, metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        base = self._resolve_frontend_base_url(metadata)
        path = f"impact/shop/{product_id}" if is_impact_product else f"shop/{product_id}"
        return urljoin(base, path)

    async def _maybe_call_tools(
        self,
        messages: List[Dict[str, str]],
        context: str,
        metadata: Optional[Dict[str, Any]] = None,
        catalog_scope: str = "mixed",
    ) -> str:
        """Detects if a tool call is needed based on the latest user message and returns formatted tool output.

        Simple, deterministic triggers are used to avoid unsafe actions. This is a lightweight "tooling" layer
        that returns factual data (product details, supply-chain timeline, impact product search) to the LLM
        so it can ground its responses.
        """
        # Prefer deterministic calls from metadata when available (e.g., product_id passed from frontend)
        if metadata and isinstance(metadata, dict):
            pid = metadata.get("product_id") or metadata.get("productId") or metadata.get("id")
            if pid:
                try:
                    pid = int(pid)
                    prod = await self.db.get(Product, pid)
                    sc_service = SupplyChainService(self.db)
                    timeline = await sc_service.get_sustainability_timeline(pid)

                    out = f"Product ID: {pid}\n"
                    if prod:
                        out += f"Name: {prod.name}\nPrice: {prod.price} {prod.currency}\nIsImpact: {bool(prod.is_impact_product)}\n"
                        out += f"Product URL: {self._build_product_url(prod.id, bool(prod.is_impact_product), metadata)}\n"
                        if prod.donation_percentage:
                            out += f"Donation Percentage: {prod.donation_percentage}%\n"
                        if prod.description:
                            snippet = (prod.description[:500] + '...') if len(prod.description) > 500 else prod.description
                            out += f"Description Snippet: {snippet}\n"

                    out += "\nSupply Chain Timeline:\n"
                    for step in timeline:
                        ts = step.get("timestamp") or "N/A"
                        out += f"- [{ts}] {step.get('stage')} @ {step.get('location')}: {step.get('description')}"
                        if step.get("certified"):
                            out += " (certified)"
                        if step.get("carbon_kg") is not None:
                            out += f"; carbon_kg={step.get('carbon_kg')}"
                        out += "\n"

                    # Generate structured traceability card if timeline exists
                    if timeline and prod:
                        import json
                        stages_data = []
                        for step in timeline:
                            stages_data.append({
                                "stage": step.get("stage", ""),
                                "location": step.get("location", ""),
                                "description": step.get("description", ""),
                                "date": step.get("timestamp", "")[:10] if step.get("timestamp") else "",
                                "verified": bool(step.get("certified")),
                                "carbon": step.get("carbon_kg"),
                            })
                        card_json = json.dumps({
                            "productName": prod.name,
                            "productId": prod.id,
                            "stages": stages_data,
                        }, ensure_ascii=False)
                        out += f"\n:::action-card[traceability]{card_json}:::\n"

                    out += "\n(Source: supply_chain records, product table)"
                    return out
                except Exception as e:
                    logger.error("Tool invocation by metadata failed: %s", e)

        last_user = self._get_last_user_message(messages)

        if not last_user:
            return ""

        # 0) Welfare / public good intent detection — query real-time data from welfare services
        welfare_keywords_cn = ["捐赠", "捐款", "捐了", "筹款", "活动进度", "影响力", "公益基金", "旧衣回收", "回收", "捐衣服", "溯源", "供应链", "怎么捐", "想捐"]
        welfare_keywords_en = ["donate", "donation", "fundraising", "campaign progress", "impact fund", "recycle", "clothing recycle", "traceability", "supply chain"]
        lower_user = last_user.lower()
        is_welfare_intent = any(k in last_user for k in welfare_keywords_cn) or any(k in lower_user for k in welfare_keywords_en)

        if is_welfare_intent:
            welfare_parts: List[str] = []
            # Donation query
            if any(k in last_user for k in ["我的捐赠", "捐款记录", "我捐了多少", "my donation", "donation history"]):
                uid = metadata.get("user_id") if metadata else None
                ctx = await self._get_donation_context(uid)
                if ctx:
                    welfare_parts.append(ctx)
            # Donation guide
            elif any(k in last_user for k in ["想捐", "怎么捐", "捐赠流程", "捐赠入口", "want to donate", "how to donate"]):
                ctx = await self._get_donation_context()
                if ctx:
                    welfare_parts.append(ctx)
            # Campaign progress
            if any(k in last_user for k in ["活动", "筹款", "进度", "目标", "campaign", "fundraising", "progress"]):
                ctx = await self._get_campaign_context()
                if ctx:
                    welfare_parts.append(ctx)
            # Impact fund
            if any(k in last_user for k in ["影响力", "公益基金", "帮助", "impact fund", "impact data"]):
                ctx = await self._get_impact_fund_context()
                if ctx:
                    welfare_parts.append(ctx)
            # Clothing recycle
            if any(k in last_user for k in ["旧衣", "回收", "捐衣服", "recycle", "clothing recycle"]):
                ctx = self._get_clothing_recycle_context()
                if ctx:
                    welfare_parts.append(ctx)
            # Supply chain trace
            if any(k in last_user for k in ["溯源", "供应链", "从哪来", "traceability", "supply chain"]):
                base_url = self._resolve_frontend_base_url(metadata)
                welfare_parts.append(get_traceability_tool_blurb(base_url, metadata, last_user))

            if welfare_parts:
                welfare_output = "[Welfare Tool Output]\n" + "\n".join(welfare_parts) + "\n(Source: welfare services)\n"
                return welfare_output

        # 1) Check for explicit product id patterns (e.g., "product id: 123", "商品id:123", "商品 123")
        pid_patterns = [r"product\s*id[:#\s]*(\d+)", r"商品(?:id)?[:：#\s]*(\d+)", r"商品\s+(\d{2,})"]
        for pat in pid_patterns:
            m = re.search(pat, last_user, flags=re.IGNORECASE)
            if m:
                try:
                    pid = int(m.group(1))
                except (ValueError, TypeError):
                    continue

                # fetch product and supply chain timeline
                prod = await self.db.get(Product, pid)
                sc_service = SupplyChainService(self.db)
                timeline = await sc_service.get_sustainability_timeline(pid)

                out = f"Product ID: {pid}\n"
                if prod:
                    out += f"Name: {prod.name}\nPrice: {prod.price} {prod.currency}\nIsImpact: {bool(prod.is_impact_product)}\n"
                    out += f"Product URL: {self._build_product_url(prod.id, bool(prod.is_impact_product), metadata)}\n"
                    if prod.donation_percentage:
                        out += f"Donation Percentage: {prod.donation_percentage}%\n"
                    if prod.description:
                        snippet = (prod.description[:500] + '...') if len(prod.description) > 500 else prod.description
                        out += f"Description Snippet: {snippet}\n"

                out += "\nSupply Chain Timeline:\n"
                for step in timeline:
                    ts = step.get("timestamp") or "N/A"
                    out += f"- [{ts}] {step.get('stage')} @ {step.get('location')}: {step.get('description')}"
                    if step.get("certified"):
                        out += " (certified)"
                    if step.get("carbon_kg") is not None:
                        out += f"; carbon_kg={step.get('carbon_kg')}"
                    out += "\n"

                # Generate structured traceability card if timeline exists
                if timeline and prod:
                    import json
                    stages_data = []
                    for step in timeline:
                        stages_data.append({
                            "stage": step.get("stage", ""),
                            "location": step.get("location", ""),
                            "description": step.get("description", ""),
                            "date": step.get("timestamp", "")[:10] if step.get("timestamp") else "",
                            "verified": bool(step.get("certified")),
                            "carbon": step.get("carbon_kg"),
                        })
                    card_json = json.dumps({
                        "productName": prod.name,
                        "productId": prod.id,
                        "stages": stages_data,
                    }, ensure_ascii=False)
                    out += f"\n:::action-card[traceability]{card_json}:::\n"

                out += "\n(Source: supply_chain records, product table)"
                return out

        # 2) Product recommendation/search routing by surface + sustainability intent.
        intent_scope = self._determine_catalog_scope(last_user, context, metadata)
        if intent_scope != "mixed":
            catalog_scope = intent_scope

        search_trigger = (
            context in ("shop", "impact", "sustainability")
            or any(k in last_user.lower() for k in ["impact", "trace", "recommend", "bag", "tote", "sustainable", "charity"])
            or any(k in last_user for k in ["公益", "溯源", "推荐", "找", "商品", "包", "衣服", "衣物", "t恤", "环保", "可持续"])
        )
        if search_trigger:
            terms = self._extract_search_terms(last_user, limit=6)
            if terms:
                from sqlalchemy import select, or_
                scopes = [catalog_scope] if catalog_scope in ("impact", "uniqlo") else ["uniqlo", "impact"]
                for scope in scopes:
                    stmt = select(Product).where(Product.status == "active")
                    stmt = stmt.where(
                        Product.is_impact_product.is_(True)
                        if scope == "impact"
                        else Product.is_impact_product.is_(False)
                    )
                    token_filters = []
                    for t in terms[:4]:
                        et = _escape_like(t)
                        token_filters.extend([
                            Product.name.ilike(f"%{et}%", escape="\\"),
                            Product.name_en.ilike(f"%{et}%", escape="\\"),
                            Product.description.ilike(f"%{et}%", escape="\\"),
                            Product.description_en.ilike(f"%{et}%", escape="\\"),
                            Product.category.ilike(f"%{et}%", escape="\\"),
                        ])
                    if token_filters:
                        stmt = stmt.where(or_(*token_filters))
                    stmt = stmt.limit(5)
                    try:
                        res = (await self.db.execute(stmt)).scalars().all()
                    except Exception as e:
                        logger.error("%s product search failed: %s", scope, e)
                        res = []
                    if not res:
                        continue

                    out = f"{scope.capitalize()} product search results for query: '{last_user}'\n"
                    for p in res:
                        out += (
                            f"- Name:{p.name} | Price:{p.price} {p.currency} | "
                            f"Donation:{p.donation_percentage or 0}% | "
                            f"URL:{self._build_product_url(p.id, bool(p.is_impact_product), metadata)}\n"
                        )
                    out += "\n(Source: products table)"
                    return out

                # Fallback: for bag-related asks, return top active bag-like products from preferred scope
                lower_q = last_user.lower()
                bag_intent = ("包" in last_user) or any(k in lower_q for k in ["bag", "tote", "backpack"])
                if bag_intent:
                    for scope in scopes:
                        fallback_stmt = select(Product).where(Product.status == "active")
                        fallback_stmt = fallback_stmt.where(
                            Product.is_impact_product.is_(True)
                            if scope == "impact"
                            else Product.is_impact_product.is_(False)
                        )
                        fallback_stmt = fallback_stmt.where(
                            Product.name.ilike("%包%", escape="\\")
                            | Product.name.ilike("%袋%", escape="\\")
                            | Product.name.ilike("%bag%", escape="\\")
                            | Product.name_en.ilike("%bag%", escape="\\")
                            | Product.name_en.ilike("%tote%", escape="\\")
                            | Product.description.ilike("%包%", escape="\\")
                            | Product.description.ilike("%bag%", escape="\\")
                            | Product.description_en.ilike("%bag%", escape="\\")
                            | Product.category.ilike("%accessories%", escape="\\")
                        ).limit(5)
                        try:
                            fallback_res = (await self.db.execute(fallback_stmt)).scalars().all()
                        except Exception as e:
                            logger.error("%s bag fallback search failed: %s", scope, e)
                            fallback_res = []
                        if not fallback_res:
                            continue

                        out = f"{scope.capitalize()} bag recommendations (fallback)\n"
                        for p in fallback_res:
                            out += (
                                f"- Name:{p.name} | Price:{p.price} {p.currency} | "
                                f"Donation:{p.donation_percentage or 0}% | "
                                f"URL:{self._build_product_url(p.id, bool(p.is_impact_product), metadata)}\n"
                            )
                        out += "\n(Source: products table)"
                        return out

        return ""

    async def _retrieve_rag(
        self,
        query: str,
        context: str,
        catalog_scope: str = "mixed",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Lightweight retrieval over impact product descriptions, campaigns, and supply-chain records.
        Returns a textual list of short snippets with source tags to be injected into the LLM prompt.
        """
        if not query or not query.strip():
            return ""
        try:
            from sqlalchemy import select, or_
            results = []
            terms = self._extract_search_terms(query, limit=6)
            if not terms:
                return ""

            resolved_scope = catalog_scope
            if resolved_scope not in ("impact", "uniqlo", "mixed"):
                resolved_scope = self._determine_catalog_scope(query, context, None)

            product_scopes = (
                [resolved_scope]
                if resolved_scope in ("impact", "uniqlo")
                else ["uniqlo", "impact"]
            )

            base_url = self._resolve_frontend_base_url(metadata)

            # 1) Product search by selected catalog scope
            for scope in product_scopes:
                try:
                    stmt = select(Product).where(Product.status == "active")
                    stmt = stmt.where(
                        Product.is_impact_product.is_(True)
                        if scope == "impact"
                        else Product.is_impact_product.is_(False)
                    )
                    token_filters = []
                    for t in terms[:4]:
                        et = _escape_like(t)
                        token_filters.extend([
                            Product.name.ilike(f"%{et}%", escape="\\"),
                            Product.name_en.ilike(f"%{et}%", escape="\\"),
                            Product.description.ilike(f"%{et}%", escape="\\"),
                            Product.description_en.ilike(f"%{et}%", escape="\\"),
                            Product.category.ilike(f"%{et}%", escape="\\"),
                        ])
                    if token_filters:
                        stmt = stmt.where(or_(*token_filters))
                    stmt = stmt.limit(5)
                    prods = (await self.db.execute(stmt)).scalars().all()
                    for p in prods:
                        snippet = (p.description or "").replace("\n", " ")[:260]
                        results.append(
                            {
                                "source": f"product/{p.id}",
                                "title": p.name,
                                "text": snippet,
                                    "url": self._build_product_url(p.id, bool(p.is_impact_product), metadata),
                                }
                            )
                    if prods:
                        break
                except Exception as e:
                    logger.debug("RAG %s product search error: %s", scope, e)

            # 2) Campaign + supply-chain retrieval is mainly relevant to impact/sustainability
            is_impact_scope = (
                resolved_scope == "impact"
                or context in ("impact", "sustainability")
                or self._contains_sustainability_intent(query)
            )
            if is_impact_scope:
                try:
                    from app.models.campaign import Campaign
                    stmt = select(Campaign)
                    filters = []
                    for t in terms[:3]:
                        et = _escape_like(t)
                        filters.append(Campaign.title.ilike(f"%{et}%", escape="\\"))
                        filters.append(Campaign.description.ilike(f"%{et}%", escape="\\"))
                    if filters:
                        stmt = stmt.where(or_(*filters)).limit(3)
                        camps = (await self.db.execute(stmt)).scalars().all()
                        for c in camps:
                            snippet = (c.description or "").replace("\n", " ")[:260]
                            results.append(
                                {
                                    "source": f"campaign/{c.id}",
                                    "title": c.title,
                                    "text": snippet,
                                    "url": urljoin(base_url, f"campaigns/{c.id}"),
                                }
                            )
                except Exception as e:
                    logger.debug("RAG campaign retrieval error: %s", e)

                try:
                    from app.models.supply_chain import SupplyChainRecord
                    stmt = select(SupplyChainRecord)
                    filters = [SupplyChainRecord.description.ilike(f"%{_escape_like(t)}%", escape="\\") for t in terms[:3]]
                    if filters:
                        stmt = stmt.where(or_(*filters)).limit(5)
                        recs = (await self.db.execute(stmt)).scalars().all()
                        for r in recs:
                            snippet = (r.description or "").replace("\n", " ")[:260]
                            results.append(
                                {
                                    "source": f"supply_chain/{r.id}",
                                    "title": r.stage or "stage",
                                    "text": snippet,
                                    "url": urljoin(base_url, f"impact/shop/{r.product_id}"),
                                }
                            )
                except Exception as e:
                    logger.debug("RAG supply chain retrieval error: %s", e)

            if not results:
                return ""

            out = f"RAG search results for query: '{query}' (catalog_scope={resolved_scope})\n"
            for it in results[:8]:
                out += f"- [source:{it['source']}] {it['title']} — {it['text']} (url:{it['url']})\n"
            out += "\n(End of retrieval results)\n"
            return out
        except Exception as e:
            logger.error("RAG retrieval failed: %s", e)
            return ""

    @audit_action(action="ai_feedback", resource_type="ai_assistant")
    async def record_feedback(self, is_helpful: bool, messages: List[Dict[str, Any]], metadata: Optional[Dict[str, Any]] = None, user_id: Optional[int] = None, reason: Optional[str] = None) -> Dict[str, Any]:
        """Record user feedback. If not helpful, escalate by creating a ContactMessage for follow-up.
        Returns a dict describing whether an escalation/contact was created.
        """
        try:
            if is_helpful:
                logger.info("AI feedback helpful. user_id=%s", user_id)
                feedback_details = {
                    "is_helpful": True,
                    "reason": reason,
                    "context": metadata.get("context") if isinstance(metadata, dict) else None,
                }
                self.db.add(
                    AuditLog(
                        user_id=user_id,
                        user_name=(metadata or {}).get("user_name") if isinstance(metadata, dict) else None,
                        action="ai_feedback",
                        resource="ai_assistant",
                        resource_id=None,
                        details=json.dumps(feedback_details, ensure_ascii=False),
                    )
                )
                await self.db.flush()
                return {"escalated": False}

            # Escalate: create contact message so ops/support can follow up
            from app.models.contact import ContactMessage
            name = None
            email = None
            if metadata and isinstance(metadata, dict):
                name = metadata.get("user_name") or metadata.get("name")
                email = metadata.get("user_email") or metadata.get("email")
            if not name and user_id:
                name = f"user_{user_id}"
            if not name:
                name = "Anonymous"
            if not email:
                email = "anonymous@no-reply.local"

            subject = "AI assistant feedback: reply not helpful"
            if metadata and isinstance(metadata, dict) and metadata.get("context"):
                subject += f" ({metadata.get('context')})"

            # Compose conversation snippet (last ~8 messages)
            conv = "\n".join([f"{m.get('role')}: {m.get('content', '')}" for m in (messages or [])[-8:]])
            contact_message = f"User marked AI response as not helpful. Reason: {reason or 'N/A'}\n\nConversation:\n{conv}\n\nMetadata:\n{json.dumps(metadata, ensure_ascii=False)}"

            contact = ContactMessage(name=name, email=email, subject=subject, message=contact_message)
            self.db.add(contact)
            await self.db.flush()

            feedback_details = {
                "is_helpful": False,
                "reason": reason,
                "context": metadata.get("context") if isinstance(metadata, dict) else None,
                "contact_id": contact.id,
            }
            self.db.add(
                AuditLog(
                    user_id=user_id,
                    user_name=name,
                    action="ai_feedback",
                    resource="ai_assistant",
                    resource_id=str(contact.id),
                    details=json.dumps(feedback_details, ensure_ascii=False),
                )
            )
            await self.db.flush()
            logger.info("Created contact message from AI feedback id=%s", contact.id)
            return {"escalated": True, "contact_id": contact.id}
        except Exception as e:
            logger.error("Failed to record AI feedback: %s", e)
            return {"escalated": False, "error": "Failed to record feedback"}

    # End of class
