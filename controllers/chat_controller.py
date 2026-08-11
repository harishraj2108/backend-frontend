import uuid

import requests
from fastapi import HTTPException

from models.chat_models import ChatRequest, ChatResponse
from services.chat_service import chat_with_langflow


def handle_chat(request: ChatRequest) -> ChatResponse:
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Field 'message' cannot be empty")

    session_id = request.session_id or str(uuid.uuid4())

    try:
        return chat_with_langflow(request.message, session_id)
    except requests.exceptions.RequestException as exc:
        raise HTTPException(status_code=500, detail=f"Model API error: {str(exc)}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(exc)}") from exc
