from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from auth.routes import get_current_user
from controllers.chat_controller import handle_chat
from models.chat_models import ChatRequest, ChatResponse
from services.chat_db_service import (
    create_chat_session,
    add_chat_message,
    get_user_chat_history,
    get_chat_session,
    delete_chat_session,
)

router = APIRouter()

class CreateSessionRequest(BaseModel):
    chat_type: str  # 'incident' or 'repo'
    repo_name: Optional[str] = None
    title: Optional[str] = "New Chat"


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


@router.post("/api/chat/session")
def create_session_endpoint(request: CreateSessionRequest, user: dict = Depends(get_current_user)):
    user_id = user.get("google_id") or user.get("sub")
    session_id = create_chat_session(user_id=user_id, chat_type=request.chat_type, repo_name=request.repo_name, title=request.title)
    return {"success": True, "session_id": session_id}


@router.get("/api/chat/history")
def get_history_endpoint(chat_type: str, user: dict = Depends(get_current_user)):
    user_id = user.get("google_id") or user.get("sub")
    history = get_user_chat_history(user_id=user_id, chat_type=chat_type)
    return {"success": True, "sessions": history}


@router.get("/api/chat/session/{session_id}")
def get_session_endpoint(session_id: str, user: dict = Depends(get_current_user)):
    session = get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    user_id = user.get("google_id") or user.get("sub")
    if session.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied to this chat session")
        
    return {"success": True, "session": session}


@router.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, user: dict = Depends(get_current_user)):
    user_id = user.get("google_id") or user.get("sub")
    
    if not request.session_id:
        request.session_id = create_chat_session(user_id=user_id, chat_type="incident")
        
    session_id = request.session_id
    
    # 1. Log the user message to database
    add_chat_message(session_id=session_id, role="user", text=request.message, user_id=user_id, chat_type="incident")
    
    # 2. Get the bot response from Langflow
    response = handle_chat(request)
    
    # 3. Log the bot response to database
    add_chat_message(session_id=session_id, role="bot", text=response.response, user_id=user_id, chat_type="incident")
    
    return response


@router.delete("/api/chat/session/{session_id}")
def delete_session_endpoint(session_id: str, user: dict = Depends(get_current_user)):
    user_id = user.get("google_id") or user.get("sub")
    success = delete_chat_session(session_id=session_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat session not found or access denied")
    return {"success": True, "message": "Chat session successfully deleted"}

