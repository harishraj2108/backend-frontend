import uuid
import logging
from datetime import datetime, timezone
from config.db import db

logger = logging.getLogger("chat_db")

def create_chat_session(user_id: str, chat_type: str, repo_name: str = None, title: str = "New Chat") -> str:
    """Create a new chat session in MongoDB and return the session_id."""
    session_id = str(uuid.uuid4())
    
    if db is None:
        logger.warning("Database not connected. Session created in-memory fallback.")
        return session_id

    now = datetime.now(timezone.utc)
    session_doc = {
        "session_id": session_id,
        "user_id": user_id,
        "chat_type": chat_type,  # 'incident' or 'repo'
        "repo_name": repo_name,
        "title": title,
        "messages": [],
        "created_at": now,
        "updated_at": now
    }
    
    try:
        db.chats.insert_one(session_doc)
        logger.info(f"Chat session {session_id} created for user {user_id}.")
    except Exception as exc:
        logger.error(f"Error creating chat session: {str(exc)}")
        
    return session_id

def add_chat_message(session_id: str, role: str, text: str, user_id: str = None, chat_type: str = "incident") -> str:
    """Append a user or bot message to the session's message list.
    
    If the session does not exist, it will be automatically created.
    """
    now = datetime.now(timezone.utc)
    message_doc = {
        "role": role,  # 'user' or 'bot'
        "text": text,
        "time": now.isoformat()
    }
    
    if db is None:
        return session_id

    try:
        # Check if the session exists
        session = db.chats.find_one({"session_id": session_id})
        
        if not session:
            # Auto-create session if it doesn't exist
            # Generate a default title from the message if it's from the user
            title = text[:30] + "..." if len(text) > 30 else text
            user_id_val = user_id or "anonymous"
            
            session_doc = {
                "session_id": session_id,
                "user_id": user_id_val,
                "chat_type": chat_type,
                "title": title,
                "messages": [message_doc],
                "created_at": now,
                "updated_at": now
            }
            db.chats.insert_one(session_doc)
            return session_id
            
        # Update existing session
        update_query = {
            "$push": {"messages": message_doc},
            "$set": {"updated_at": now}
        }
        
        # If the current title is "New Chat" and this is the first user message, update the title
        if session.get("title") == "New Chat" and role == "user":
            title = text[:30] + "..." if len(text) > 30 else text
            update_query["$set"]["title"] = title
            
        db.chats.update_one({"session_id": session_id}, update_query)
    except Exception as exc:
        logger.error(f"Error appending message to session {session_id}: {str(exc)}")
        
    return session_id

def get_user_chat_history(user_id: str, chat_type: str) -> list:
    """Return a list of chat sessions associated with the user, sorted by updated_at descending."""
    if db is None:
        return []
        
    try:
        cursor = db.chats.find(
            {"user_id": user_id, "chat_type": chat_type},
            {"_id": 0, "session_id": 1, "chat_type": 1, "repo_name": 1, "title": 1, "created_at": 1, "updated_at": 1}
        ).sort("updated_at", -1)
        
        history = []
        for doc in cursor:
            # Format datetime fields to ISO strings
            for field in ["created_at", "updated_at"]:
                if field in doc and isinstance(doc[field], datetime):
                    doc[field] = doc[field].isoformat()
            history.append(doc)
        return history
    except Exception as exc:
        logger.error(f"Error loading chat history for user {user_id}: {str(exc)}")
        return []

def get_chat_session(session_id: str) -> dict:
    """Return the full session details including messages."""
    if db is None:
        return None
        
    try:
        doc = db.chats.find_one({"session_id": session_id}, {"_id": 0})
        if doc:
            for field in ["created_at", "updated_at"]:
                if field in doc and isinstance(doc[field], datetime):
                    doc[field] = doc[field].isoformat()
            return doc
    except Exception as exc:
        logger.error(f"Error loading chat session {session_id}: {str(exc)}")
        
    return None


def delete_chat_session(session_id: str, user_id: str) -> bool:
    """Delete a chat session from MongoDB if it belongs to the user."""
    if db is None:
        return False
        
    try:
        result = db.chats.delete_one({"session_id": session_id, "user_id": user_id})
        return result.deleted_count > 0
    except Exception as exc:
        logger.error(f"Error deleting chat session {session_id}: {str(exc)}")
        return False
