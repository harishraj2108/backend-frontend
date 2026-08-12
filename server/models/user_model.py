from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
from config.db import db

class UserModel(BaseModel):
    google_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    email_verified: Optional[bool] = None
    created_at: datetime
    updated_at: datetime
    last_login: datetime

def serialize_user(user_doc: dict) -> dict:
    """Helper to convert MongoDB document to a JSON-serializable dict, converting ObjectId to string."""
    if not user_doc:
        return None
    doc = dict(user_doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    # Convert datetime objects to ISO strings for frontend compatibility
    for key in ["created_at", "updated_at", "last_login"]:
        if key in doc and isinstance(doc[key], datetime):
            # Ensure we format as ISO string
            doc[key] = doc[key].isoformat()
    return doc

def upsert_google_user(user_info: dict) -> dict:
    """Upsert Google OAuth user details into MongoDB and return the updated user document."""
    google_id = user_info.get("sub")
    if not google_id:
        raise ValueError("User payload must contain a unique 'sub' identifier")

    email = user_info.get("email", "")
    name = user_info.get("name", "Engineer")
    picture = user_info.get("picture")
    given_name = user_info.get("given_name")
    family_name = user_info.get("family_name")
    email_verified = user_info.get("email_verified")

    # If database is not connected or initialized, fall back to returning values directly
    if db is None:
        fallback_now = datetime.now(timezone.utc).isoformat()
        return {
            "google_id": google_id,
            "email": email,
            "name": name,
            "picture": picture,
            "given_name": given_name,
            "family_name": family_name,
            "email_verified": email_verified,
            "created_at": fallback_now,
            "updated_at": fallback_now,
            "last_login": fallback_now
        }

    now = datetime.now(timezone.utc)
    update_data = {
        "email": email,
        "name": name,
        "picture": picture,
        "given_name": given_name,
        "family_name": family_name,
        "email_verified": email_verified,
        "updated_at": now,
        "last_login": now,
    }

    # Perform upsert
    user_doc = db.users.find_one_and_update(
        {"google_id": google_id},
        {
            "$set": update_data,
            "$setOnInsert": {"created_at": now}
        },
        upsert=True,
        return_document=True
    )

    return serialize_user(user_doc)
