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
        logger.warning(f"Failed to load AI synonym config: {exc}")
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

SYSTEM_PROMPT = """你是「Uniqlo × VICOO 公益」平台助手，也是「Uniqlo × VICOO 公益」的专属公益智能体。语气温暖、克制、专业。
⚠️ 严禁在回复中使用任何 emoji 表情符号（如 💝 🌟 🎨 ✨ 👕 😊 等）。保持文字干净克制。
你需要根据页面语境推荐对应商品，并优先使用站内数据库与检索结果回答：
1) 如果当前是 Uniqlo/常规商城语境，默认优先推荐常规商品（/shop/{id}）。
2) 如果当前是 Impact/公益语境，默认优先推荐公益商品（/impact/shop/{id}）。
3) 但当用户明确强调"可持续/公益/捐赠/环保/sustainable/impact/charity"时，即使在 Uniqlo 页面也要优先推荐 Impact 商品。
4) 如果用户表达"推荐/找商品/包/衣物"等需求但没有明确 Uniqlo 或 Impact，先追问其偏好（Uniqlo 还是 Impact），再给推荐。
5) 进行商品推荐时，尽量返回可点击链接，并给出推荐理由（材质、价格、公益比例、溯源等）。
6) 需要同时理解中英文同义词（如 T-shirt/T恤、bag/包、clothes/衣物）并做匹配推荐。
7) 优先基于站内数据库内容回答，不要编造站外商品或链接。
8) 如果用户问到订单、支付、隐私，请只给基础状态说明，不泄露敏感信息。
9) 涉及儿童信息、支付与法律问题，提醒以站内条款与客服为准。
10) 引导用户了解和参与捐赠（解释捐赠档位、流程、证书）。
11) 查询并报告公益活动的筹款进度和影响力数据。
12) 帮助用户查询个人捐赠记录和历史。
13) 介绍旧衣回收流程和意义。
14) 查询公益商品的供应链溯源信息。
15) 解释影响力基金的分配机制（60% 艺术家 / 30% 学校 / 10% 慈善池）。
当用户表达公益相关意图时，主动调用对应工具获取实时数据，给出温暖、专业的回复。
回复中如果包含捐赠记录、活动进度、影响力基金等结构化数据，请严格使用以下格式标记，以便前端渲染为可视化卡片。【注意：必须把整块 JSON 完整包裹在 :::action-card 内，不要把 JSON 裸露在外面】

活动进度示例：
:::action-card[campaign-progress]{"items":[{"name":"春日花语","raised":25000,"goal":50000,"participants":128},{"name":"海洋守护者","raised":18000,"goal":40000,"participants":95}]}

捐赠记录示例：
:::action-card[donation-list]{"items":[{"name":"张三","amount":200,"date":"2025-03-15"},{"name":"李四","amount":100,"date":"2025-03-14"}]}

影响力基金示例：
:::action-card[impact-fund]{"artistShare":6000,"schoolShare":3000,"charityShare":1000,"total":10000}

重要规则：
1. 一个 :::action-card 块内只放一个 JSON 对象
2. JSON 必须合法（双引号、无尾逗号）
3. 不要在 :::action-card 外面再重复输出同样的 JSON 数据
4. 活动进度数据中 items 数组包含所有活动，每个活动有 name/raised/goal/participants 字段"""

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
                "reply": (
                    "当然可以，我先确认一下：你想要 **Uniqlo** 还是 **Impact（公益线）** 的推荐？\n\n"
                    "Sure — would you like recommendations from **Uniqlo** or **Impact**?"
                ),
                "model": "rule-based-clarifier",
                "source": "tooling"
            }
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
            rag_output = await self._retrieve_rag(last_user, context, catalog_scope, metadata)
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
            reply = (
                "当然可以，我先确认一下：你想要 **Uniqlo** 还是 **Impact（公益线）** 的推荐？\n\n"
                "Sure — would you like recommendations from **Uniqlo** or **Impact**?"
            )
            yield f"data: {json.dumps({'type': 'content_block_delta', 'text': reply})}\n\n"
            yield f"data: {json.dumps({'type': 'message_stop', 'model': 'rule-based-clarifier', 'source': 'tooling'})}\n\n"
            return

        catalog_scope = self._determine_catalog_scope(last_user, context, metadata)
        business_context = await self._get_business_context(user_id)
        context_hint = f"\n[Platform Context: {context}]\n{business_context}"
        full_system_prompt = (
            SYSTEM_PROMPT + context_hint
            + f"\n[Catalog Routing]\nSelected catalog scope: {catalog_scope}\n"
        )

        tool_output = await self._maybe_call_tools(messages, context, metadata, catalog_scope)
        if tool_output:
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
                full_system_prompt += f"\n\n[Retrieval Results]\n{rag_output}\n[End Retrieval]\n\nPlease use the above retrieval snippets to ground your answer and cite sources."

        if not settings.OPENAI_API_KEY:
            grounded = tool_output or ""
            reply = grounded or f"您好，我是您的公益助手。目前我正处于演示模式（Context: {context}）。配置 API Key 后我可以为您提供更智能的回复。"
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
                        logger.error(f"Anthropic stream error {response.status_code}: {body.decode()[:300]}")
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
            logger.error(f"Anthropic stream failed: {e}")
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
            logger.error(f"Artwork analysis failed: {e}")
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
            logger.error(f"Failed to fetch business context for AI: {e}")
            return "[Business context unavailable]"

    async def _get_donation_context(self, user_id: Optional[int] = None) -> str:
        """Fetch donation stats and user donation history for AI context."""
        from app.services.donation.service import DonationService
        from app.models.donation import Donation
        from sqlalchemy import select, and_
        try:
            svc = DonationService(self.db)
            stats = await svc.get_stats()
            ctx = f"平台捐赠统计: 总金额 {stats.get('total_amount', 0)} {stats.get('currency', 'CNY')}, 总捐赠人次 {stats.get('total_donors', 0)}\n"
            tiers = [
                {"name": "铜牌 Bronze", "amount": 50},
                {"name": "银牌 Silver", "amount": 200},
                {"name": "金牌 Gold", "amount": 500},
                {"name": "铂金 Platinum", "amount": 2000},
            ]
            ctx += "捐赠档位: " + ", ".join(f"{t['name']}({t['amount']}元)" for t in tiers) + "\n"
            ctx += "捐赠流程: 选择档位 → 支付 → 自动生成电子证书\n"
            if user_id:
                stmt = select(Donation).where(
                    and_(Donation.donor_user_id == user_id, Donation.status == "completed")
                ).order_by(Donation.created_at.desc()).limit(5)
                donations = (await self.db.execute(stmt)).scalars().all()
                if donations:
                    ctx += f"用户最近捐赠记录:\n"
                    for d in donations:
                        ts = d.created_at.strftime("%Y-%m-%d") if d.created_at else "N/A"
                        ctx += f"  - {ts} | {d.amount} {d.currency} | {d.payment_method or 'N/A'} | {d.status}\n"
                else:
                    ctx += "该用户暂无捐赠记录。\n"
            return ctx
        except Exception as e:
            logger.error(f"Failed to get donation context: {e}")
            return ""

    async def _get_campaign_context(self) -> str:
        """Fetch active campaign progress for AI context."""
        from app.services.campaign.service import CampaignService
        try:
            svc = CampaignService(self.db)
            campaign = await svc.get_active_campaign()
            if campaign:
                progress = (campaign.current_amount / campaign.goal_amount * 100) if campaign.goal_amount else 0
                ctx = f"当前活动: {campaign.title}\n"
                ctx += f"筹款目标: {campaign.goal_amount} CNY, 当前已筹: {campaign.current_amount} CNY ({progress:.1f}%)\n"
                if campaign.description:
                    ctx += f"活动简介: {campaign.description[:200]}\n"
                return ctx
            return "当前暂无进行中的筹款活动。\n"
        except Exception as e:
            logger.error(f"Failed to get campaign context: {e}")
            return ""

    async def _get_impact_fund_context(self) -> str:
        """Fetch impact fund summary for AI context."""
        from app.services.impact_fund.service import ImpactFundService
        try:
            svc = ImpactFundService(self.db)
            summary = await svc.get_fund_summary()
            ctx = f"影响力基金总分配: {summary.get('total_amount', 0)} CNY, 共 {summary.get('total_entries', 0)} 笔\n"
            by_type = summary.get("by_type", {})
            for t in by_type:
                ctx += f"  - {t.get('type', 'N/A')}: {t.get('amount', 0)} CNY ({t.get('count', 0)} 笔)\n"
            ctx += "分配机制: 每笔公益商品销售额的捐赠比例 → 60% 艺术家 / 30% 学校 / 10% 慈善池\n"
            return ctx
        except Exception as e:
            logger.error(f"Failed to get impact fund context: {e}")
            return ""

    def _get_clothing_recycle_context(self) -> str:
        """Return clothing recycle flow info for AI context."""
        base_url = self._resolve_frontend_base_url()
        return (
            "旧衣回收流程:\n"
            "1. 用户在「旧衣回收」页面提交回收申请\n"
            "2. 平台安排上门取件或用户自行寄送\n"
            "3. 旧衣经过分拣、清洗、消毒处理\n"
            "4. 可穿用衣物捐赠给需要的儿童，不可穿用的进行环保再生\n"
            f"入口: {urljoin(base_url, 'clothing-recycle')}\n"
            f"旧衣捐赠入口: {urljoin(base_url, 'donate-clothing')}\n"
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
                base = origin
        if not base:
            base = settings.FRONTEND_URL
        lowered = base.lower()
        if "localhost" in lowered or "127.0.0.1" in lowered:
            base = "http://csi420-02-vm8.ucd.ie"
        return base.rstrip("/") + "/"

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

                    out += "\n(Source: supply_chain records, product table)"
                    return out
                except Exception as e:
                    logger.error(f"Tool invocation by metadata failed: {e}")

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
                welfare_parts.append(f"商品溯源功能: 每件公益商品均可查看完整供应链时间线（原材料→加工→制造→质检→物流）。入口: {urljoin(base_url, 'supply-chain')}")

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
                except Exception:
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
                        logger.error(f"{scope} product search failed: {e}")
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
                            Product.name.ilike("%包%")
                            | Product.name.ilike("%袋%")
                            | Product.name.ilike("%bag%")
                            | Product.name_en.ilike("%bag%")
                            | Product.name_en.ilike("%tote%")
                            | Product.description.ilike("%包%")
                            | Product.description.ilike("%bag%")
                            | Product.description_en.ilike("%bag%")
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
                                    "url": urljoin(base_url, f"campaigns/{c.id}"),
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
                                    "url": urljoin(base_url, f"supply-chain/records/{r.id}"),
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
            return {"escalated": False, "error": "Failed to record feedback"}

    # End of class
