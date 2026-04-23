import logging
from typing import List, Dict, Any, Optional
import re
import json
import httpx
from urllib.parse import urljoin
from fastapi import HTTPException

from app.config import settings
from app.services.base import BaseService
from app.core.audit import audit_action
from app.models.audit import AuditLog
from app.services.supply_chain.service import SupplyChainService
from app.models.product import Product

logger = logging.getLogger("tonghua.ai_service")

SYSTEM_PROMPT = """你是「童画公益 × 可持续时尚」平台助手。语气温暖、克制、专业。
你需要根据页面语境推荐对应商品，并优先使用站内数据库与检索结果回答：
1) 如果当前是 Uniqlo/常规商城语境，默认优先推荐常规商品（/shop/{id}）。
2) 如果当前是 Impact/公益语境，默认优先推荐公益商品（/impact/shop/{id}）。
3) 但当用户明确强调“可持续/公益/捐赠/环保/sustainable/impact/charity”时，即使在 Uniqlo 页面也要优先推荐 Impact 商品。
4) 进行商品推荐时，尽量返回可点击链接，并给出推荐理由（材质、价格、公益比例、溯源等）。
5) 如果用户问到订单、支付、隐私，请只给基础状态说明，不泄露敏感信息。
6) 涉及儿童信息、支付与法律问题，提醒以站内条款与客服为准。"""

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
        catalog_scope = self._determine_catalog_scope(last_user, context, metadata)

        # 1. Prepare business-specific context
        business_context = await self._get_business_context(user_id)
        context_hint = f"\n[Platform Context: {context}]\n{business_context}"

        full_system_prompt = (
            SYSTEM_PROMPT
            + context_hint
            + f"\n[Catalog Routing]\nSelected catalog scope: {catalog_scope}\n"
        )

        # 2. Lightweight tool invocation: detect explicit product/search/trace intents and fetch factual data
        tool_output = await self._maybe_call_tools(messages, context, metadata, catalog_scope)
        if tool_output:
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
            rag_output = await self._retrieve_rag(last_user, context, catalog_scope)
            if rag_output:
                full_system_prompt += f"\n\n[Retrieval Results]\n{rag_output}\n[End Retrieval]\n\nPlease use the above retrieval snippets to ground your answer and cite sources."

        # 3. Check for API key
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not configured. Returning simulation response.")
            grounded = tool_output or rag_output
            if grounded:
                return {
                    "reply": f"我已根据站内数据库与检索结果整理如下：\n\n{grounded}",
                    "model": "simulation-mode",
                    "source": "local-stub"
                }
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
                
                content = self._sanitize_assistant_reply(
                    data["choices"][0]["message"]["content"].strip()
                )
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
        tokens = re.findall(r"[\u4e00-\u9fff]+|[A-Za-z0-9]+", query)
        normalized: List[str] = []
        for tok in tokens:
            if re.fullmatch(r"[A-Za-z0-9]+", tok):
                if len(tok) < 2:
                    continue
                normalized.append(tok.lower())
            else:
                normalized.append(tok)
                if len(tok) >= 4:
                    for kw in ["包", "帆布袋", "托特", "背包", "公益", "可持续", "环保", "捐赠"]:
                        if kw in tok:
                            normalized.append(kw)
            if len(normalized) >= limit:
                break
        return normalized[:limit]

    def _build_product_url(self, product_id: int, is_impact_product: bool) -> str:
        base = settings.FRONTEND_URL.rstrip("/") + "/"
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
                        out += f"Product URL: {self._build_product_url(prod.id, bool(prod.is_impact_product))}\n"
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

                    out += "\n(Source: supply_chain records, product table)"
                    return out
                except Exception as e:
                    logger.error(f"Tool invocation by metadata failed: {e}")

        last_user = self._get_last_user_message(messages)

        if not last_user:
            return ""

        # 1) Check for explicit product id patterns (e.g., "product id: 123", "商品id:123", "商品 123")
        pid_patterns = [r"product\s*id[:#\s]*(\d+)", r"商品(?:id)?[:：#\s]*(\d+)", r"商品\s+(\d{2,})"]
        for pat in pid_patterns:
            m = re.search(pat, last_user, flags=re.IGNORECASE)
            if m:
                try:
                    pid = int(m.group(1))
                except Exception:
                    continue

                # fetch product and supply chain timeline
                prod = await self.db.get(Product, pid)
                sc_service = SupplyChainService(self.db)
                timeline = await sc_service.get_sustainability_timeline(pid)

                out = f"Product ID: {pid}\n"
                if prod:
                    out += f"Name: {prod.name}\nPrice: {prod.price} {prod.currency}\nIsImpact: {bool(prod.is_impact_product)}\n"
                    out += f"Product URL: {self._build_product_url(prod.id, bool(prod.is_impact_product))}\n"
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

                out += "\n(Source: supply_chain records, product table)"
                return out

        # 2) Product recommendation/search routing by surface + sustainability intent.
        intent_scope = self._determine_catalog_scope(last_user, context, metadata)
        if intent_scope != "mixed":
            catalog_scope = intent_scope

        search_trigger = (
            context in ("shop", "impact", "sustainability")
            or any(k in last_user.lower() for k in ["impact", "trace", "recommend", "bag", "tote", "sustainable", "charity"])
            or any(k in last_user for k in ["公益", "溯源", "推荐", "找", "商品", "包", "环保", "可持续"])
        )
        if search_trigger:
            terms = self._extract_search_terms(last_user, limit=6)
            if terms:
                from sqlalchemy import select
                scopes = [catalog_scope] if catalog_scope in ("impact", "uniqlo") else ["uniqlo", "impact"]
                for scope in scopes:
                    stmt = select(Product).where(Product.status == "active")
                    stmt = stmt.where(
                        Product.is_impact_product.is_(True)
                        if scope == "impact"
                        else Product.is_impact_product.is_(False)
                    )
                    for t in terms[:4]:
                        stmt = stmt.where(
                            (Product.name.ilike(f"%{t}%"))
                            | (Product.description.ilike(f"%{t}%"))
                            | (Product.category.ilike(f"%{t}%"))
                        )
                    stmt = stmt.limit(5)
                    try:
                        res = (await self.db.execute(stmt)).scalars().all()
                    except Exception as e:
                        logger.error(f"{scope} product search failed: {e}")
                        res = []
                    if not res:
                        continue

                    out = f"{scope.capitalize()} product search results for query: '{last_user}'\n"
                    for p in res:
                        out += (
                            f"- Name:{p.name} | Price:{p.price} {p.currency} | "
                            f"Donation:{p.donation_percentage or 0}% | "
                            f"URL:{self._build_product_url(p.id, bool(p.is_impact_product))}\n"
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
                            Product.name.ilike("%包%")
                            | Product.name.ilike("%袋%")
                            | Product.name.ilike("%bag%")
                            | Product.description.ilike("%包%")
                            | Product.description.ilike("%bag%")
                            | Product.category.ilike("%accessories%")
                        ).limit(5)
                        try:
                            fallback_res = (await self.db.execute(fallback_stmt)).scalars().all()
                        except Exception as e:
                            logger.error(f"{scope} bag fallback search failed: {e}")
                            fallback_res = []
                        if not fallback_res:
                            continue

                        out = f"{scope.capitalize()} bag recommendations (fallback)\n"
                        for p in fallback_res:
                            out += (
                                f"- Name:{p.name} | Price:{p.price} {p.currency} | "
                                f"Donation:{p.donation_percentage or 0}% | "
                                f"URL:{self._build_product_url(p.id, bool(p.is_impact_product))}\n"
                            )
                        out += "\n(Source: products table)"
                        return out

        return ""

    async def _retrieve_rag(self, query: str, context: str, catalog_scope: str = "mixed") -> str:
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

            # 1) Product search by selected catalog scope
            for scope in product_scopes:
                try:
                    stmt = select(Product).where(Product.status == "active")
                    stmt = stmt.where(
                        Product.is_impact_product.is_(True)
                        if scope == "impact"
                        else Product.is_impact_product.is_(False)
                    )
                    for t in terms[:4]:
                        stmt = stmt.where(
                            (Product.name.ilike(f"%{t}%"))
                            | (Product.description.ilike(f"%{t}%"))
                            | (Product.category.ilike(f"%{t}%"))
                        )
                    stmt = stmt.limit(5)
                    prods = (await self.db.execute(stmt)).scalars().all()
                    for p in prods:
                        snippet = (p.description or "").replace("\n", " ")[:260]
                        results.append(
                            {
                                "source": f"product/{p.id}",
                                "title": p.name,
                                "text": snippet,
                                "url": self._build_product_url(p.id, bool(p.is_impact_product)),
                            }
                        )
                    if prods:
                        break
                except Exception as e:
                    logger.debug(f"RAG {scope} product search error: {e}")

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
                        filters.append(Campaign.title.ilike(f"%{t}%"))
                        filters.append(Campaign.description.ilike(f"%{t}%"))
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
                                    "url": urljoin(settings.FRONTEND_URL.rstrip("/") + "/", f"campaigns/{c.id}"),
                                }
                            )
                except Exception:
                    pass

                try:
                    from app.models.supply_chain import SupplyChainRecord
                    stmt = select(SupplyChainRecord)
                    filters = [SupplyChainRecord.description.ilike(f"%{t}%") for t in terms[:3]]
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
                                    "url": urljoin(settings.FRONTEND_URL.rstrip("/") + "/", f"supply-chain/records/{r.id}"),
                                }
                            )
                except Exception:
                    pass

            if not results:
                return ""

            out = f"RAG search results for query: '{query}' (catalog_scope={resolved_scope})\n"
            for it in results[:8]:
                out += f"- [source:{it['source']}] {it['title']} — {it['text']} (url:{it['url']})\n"
            out += "\n(End of retrieval results)\n"
            return out
        except Exception as e:
            logger.error(f"RAG retrieval failed: {e}")
            return ""

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
            logger.error(f"Failed to record AI feedback: {e}")
            return {"escalated": False, "error": str(e)}

    # End of class
