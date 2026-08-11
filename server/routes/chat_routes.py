from fastapi import APIRouter, Depends

from auth.routes import get_current_user
from controllers.chat_controller import handle_chat
from models.chat_models import ChatRequest, ChatResponse

router = APIRouter()


@router.get("/")
def root_endpoint():
    return {
        "status": "online",
        "message": "Multi-Agent Model FastAPI Backend is running!",
        "endpoints": {
            "chat": "POST /api/chat",
            "health": "GET /health",
            "docs": "GET /docs",
        },
    }


@router.get("/health")
def health_check():
    return {"status": "ok", "server": "FastAPI Backend"}


@router.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, user: dict = Depends(get_current_user)):
    return handle_chat(request)
