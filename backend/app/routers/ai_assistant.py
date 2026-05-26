"""AI 助手：多业务上下文问答（OpenAI 兼容接口，可配置基座）。"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_optional_current_user, require_role
from app.schemas import (
    AIChatRequest,
    AIChatResponse,
    ApiResponse,
    ArtworkAnalysisRequest,
    ArtworkAnalysisResponse,
    ContentModerationRequest,
    ContentModerationResponse,
    AIFeedbackRequest,
)
from app.services.ai_assistant.service import AIAssistantService

router = APIRouter(prefix="/ai", tags=["AI Assistant"])
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ApiResponse)
async def ai_chat(
    body: AIChatRequest,
    current_user: dict | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Conversation completion via AIAssistantService."""
    ai_service = AIAssistantService(db)
    
    # Convert Pydantic messages to list of dicts
    messages = [m.model_dump() for m in body.messages]
    user_id = current_user.get("id") if current_user else None
    
    try:
        result = await ai_service.get_chat_completion(
            messages=messages,
            context=body.context or "general",
            user_id=user_id,
            metadata=getattr(body, 'metadata', None)
        )
        return ApiResponse(data=AIChatResponse(**result).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Chat failed: %s", e)
        return ApiResponse(
            data=AIChatResponse(
                reply="The AI assistant is temporarily unavailable. Please try again later or submit a question via the contact page.",
                model="error",
                source="system"
            ).model_dump()
        )


@router.post("/chat/stream")
async def ai_chat_stream(
    body: AIChatRequest,
    current_user: dict | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Stream AI completion as Server-Sent Events (Anthropic-compatible upstream)."""
    ai_service = AIAssistantService(db)
    messages = [m.model_dump() for m in body.messages]
    user_id = current_user.get("id") if current_user else None

    async def event_generator():
        async for chunk in ai_service.get_chat_completion_stream(
            messages=messages,
            context=body.context or "general",
            user_id=user_id,
            metadata=getattr(body, 'metadata', None),
        ):
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/analyze-artwork", response_model=ApiResponse)
async def analyze_artwork(
    body: ArtworkAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin", "editor")),
):
    """Analyze artwork style and safety."""
    try:
        ai_service = AIAssistantService(db)
        result = await ai_service.analyze_artwork(
            image_url=body.image_url,
            description=body.description
        )
        return ApiResponse(data=ArtworkAnalysisResponse(**result).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Artwork analysis failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable")


@router.post("/moderate-content", response_model=ApiResponse)
async def moderate_content(
    body: ContentModerationRequest,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin", "editor")),
):
    """Moderate text content for safety."""
    try:
        ai_service = AIAssistantService(db)
        result = await ai_service.moderate_content(text=body.text)
        return ApiResponse(data=ContentModerationResponse(**result).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Content moderation failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable")


@router.post("/feedback", response_model=ApiResponse)
async def ai_feedback(
    body: AIFeedbackRequest,
    current_user: dict | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record user feedback on AI assistant replies. If not helpful, escalate to contact message for follow-up."""
    ai_service = AIAssistantService(db)
    user_id = current_user.get("id") if current_user else None
    try:
        # Convert incoming messages (Pydantic models) to simple dicts for storage/processing
        msgs = [m.model_dump() if hasattr(m, "model_dump") else dict(m) for m in body.messages]
        res = await ai_service.record_feedback(
            is_helpful=body.is_helpful,
            messages=msgs,
            metadata=getattr(body, "metadata", None),
            user_id=user_id,
            reason=getattr(body, "reason", None),
        )
        return ApiResponse(data=res)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to record AI feedback: %s", e)
        return ApiResponse(data={"escalated": False, "error": "feedback_failed"})
