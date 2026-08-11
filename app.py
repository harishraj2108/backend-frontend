import json
import os
import uuid
import requests
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Multi-Agent Model API",
    description="FastAPI Backend for Langflow Multi-Agent Model",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from .env
LANGFLOW_URL = os.getenv("LANGFLOW_URL", "http://localhost:7860/api/v1/run/11c04395-c01c-45e0-8783-f316d1168598")
API_KEY = os.getenv("SCRAPEGRAPH_API_KEY", "")
PORT = int(os.getenv("PORT", 8000))

HEADERS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    session_id: str
    response: str

def extract_message(data: dict) -> str:
    """Extract clean response text from Langflow API JSON response."""
    outputs_list = data.get("outputs", [])
    for output in outputs_list:
        for inner_out in output.get("outputs", []):
            results = inner_out.get("results", {})
            message_obj = results.get("message", {})
            
            if isinstance(message_obj, dict):
                text = message_obj.get("text") or message_obj.get("data", {}).get("text", "")
                if text and not text.startswith("# Role and Objective"):
                    return text
                    
            # Check artifacts as fallback
            artifacts = inner_out.get("artifacts", {})
            if isinstance(artifacts, dict) and "message" in artifacts:
                msg_val = artifacts["message"]
                if isinstance(msg_val, str) and msg_val and not msg_val.startswith("# Role and Objective"):
                    return msg_val

    # Fallback to direct path
    try:
        return data["outputs"][0]["outputs"][0]["results"]["message"]["text"]
    except Exception:
        return json.dumps(data, indent=2)

@app.get("/")
def root_endpoint():
    return {
        "status": "online",
        "message": "Multi-Agent Model FastAPI Backend is running!",
        "endpoints": {
            "chat": "POST /api/chat",
            "health": "GET /health",
            "docs": "GET /docs"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "server": "FastAPI Backend"}

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Field 'message' cannot be empty")
        
    session_id = request.session_id or str(uuid.uuid4())
    
    payload = {
        "output_type": "chat",
        "input_type": "chat",
        "input_value": request.message,
        "session_id": session_id,
    }
    
    try:
        response = requests.post(LANGFLOW_URL, json=payload, headers=HEADERS, timeout=60)
        response.raise_for_status()
        
        data = response.json()
        ai_message = extract_message(data)
        
        return ChatResponse(
            success=True,
            session_id=session_id,
            response=ai_message
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Model API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
