import json

import requests

from config import HEADERS, LANGFLOW_URL
from models.chat_models import ChatResponse


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

            artifacts = inner_out.get("artifacts", {})
            if isinstance(artifacts, dict) and "message" in artifacts:
                msg_val = artifacts["message"]
                if isinstance(msg_val, str) and msg_val and not msg_val.startswith("# Role and Objective"):
                    return msg_val

    try:
        return data["outputs"][0]["outputs"][0]["results"]["message"]["text"]
    except Exception:
        return json.dumps(data, indent=2)


def chat_with_langflow(message: str, session_id: str) -> ChatResponse:
    payload = {
        "output_type": "chat",
        "input_type": "chat",
        "input_value": message,
        "session_id": session_id,
    }

    response = requests.post(LANGFLOW_URL, json=payload, headers=HEADERS, timeout=60)
    response.raise_for_status()

    try:
        data = response.json()
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Expected JSON from Langflow but received non-JSON (Status: {response.status_code}). "
            f"Body Snippet: {response.text[:200]}"
        ) from exc

    ai_message = extract_message(data)

    return ChatResponse(
        success=True,
        session_id=session_id,
        response=ai_message,
    )
