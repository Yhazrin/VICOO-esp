"""AI 助手：多业务上下文问答（OpenAI 兼容接口，可配置基座）。"""

import logging

import httpx
from fastapi import APIRouter, Depends

from app.config import settings
from app.deps import get_optional_current_user
from app.schemas import AIChatRequest, AIChatResponse, ApiResponse

router = APIRouter(prefix="/ai", tags=["AI Assistant"])
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是「童画公益 × 可持续时尚」平台的助手。语气温暖、克制、偏编辑出版物风格。
帮助用户理解：衣物捐献流程、商品与溯源、订单与物流、捐赠与售后、可持续实践。
不要编造不存在的政策或承诺；涉及儿童信息、支付与法律问题时提醒用户以站内条款与客服为准。"""


@router.post("/chat", response_model=ApiResponse)
async def ai_chat(
    body: AIChatRequest,
    current_user: dict | None = Depends(get_optional_current_user),
):
    """对话补全。未配置 OPENAI_API_KEY 时返回 stub，便于联调前端。"""
    ctx = body.context or "general"
    user_hint = f"\n[用户已登录 id={current_user['id']}]" if current_user else "\n[访客]"

    if not settings.OPENAI_API_KEY:
        reply = (
            f"（演示模式）我收到了你的问题（上下文：{ctx}）。"
            f"请在服务器环境配置 OPENAI_API_KEY 后启用大模型回复。"
            f"{user_hint}"
        )
        return ApiResponse(data=AIChatResponse(reply=reply, model="stub", source="stub").model_dump())

    messages = [{"role": "system", "content": SYSTEM_PROMPT + user_hint + f"\n[业务上下文={ctx}]"}]
    for m in body.messages:
        messages.append({"role": m.role, "content": m.content})

    url = f"{settings.OPENAI_API_BASE.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.OPENAI_MODEL,
        "messages": messages,
        "temperature": 0.6,
        "max_tokens": 1024,
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
            choice = (data.get("choices") or [{}])[0]
            msg = choice.get("message") or {}
            content = msg.get("content") or ""
            model = data.get("model") or settings.OPENAI_MODEL
            return ApiResponse(data=AIChatResponse(reply=content.strip(), model=model, source="openai").model_dump())
    except Exception as e:
        logger.error("AI chat failed: %s", e, exc_info=True)
        return ApiResponse(
            data=AIChatResponse(
                reply="智能助手暂时不可用，请稍后再试或通过联系页提交问题。",
                model=settings.OPENAI_MODEL,
                source="openai",
            ).model_dump()
        )
