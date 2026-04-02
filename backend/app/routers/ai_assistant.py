"""AI 助手：多业务上下文问答（OpenAI 兼容接口，可配置基座）。"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_optional_current_user
from app.schemas import (
    AIChatRequest, 
    AIChatResponse, 
    ApiResponse, 
    ArtworkAnalysisRequest, 
    ArtworkAnalysisResponse,
    ContentModerationRequest,
    ContentModerationResponse
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
            user_id=user_id
        )
        return ApiResponse(data=AIChatResponse(**result).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        return ApiResponse(
            data=AIChatResponse(
                reply="智能助手暂时不可用，请稍后再试或通过联系页提交问题。",
                model="error",
                source="system"
            ).model_dump()
        )


@router.post("/analyze-artwork", response_model=ApiResponse)
async def analyze_artwork(
    body: ArtworkAnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    """Analyze artwork style and safety."""
    ai_service = AIAssistantService(db)
    result = await ai_service.analyze_artwork(
        image_url=body.image_url,
        description=body.description
    )
    return ApiResponse(data=ArtworkAnalysisResponse(**result).model_dump())


@router.post("/moderate-content", response_model=ApiResponse)
async def moderate_content(
    body: ContentModerationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Moderate text content for safety."""
    ai_service = AIAssistantService(db)
    result = await ai_service.moderate_content(text=body.text)
    return ApiResponse(data=ContentModerationResponse(**result).model_dump())