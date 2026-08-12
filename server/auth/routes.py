from fastapi import APIRouter, HTTPException, Query, Request, Depends, status
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import secrets
from typing import Optional
from config import FRONTEND_URL

from auth.schemas import GoogleOAuthCallbackRequest, GoogleOAuthStartResponse, TokenResponse
from auth.service import (
    build_google_authorization_url,
    exchange_code_for_token,
    validate_google_id_token,
    create_access_token,
    verify_token,
)
from models.user_model import upsert_google_user

router = APIRouter(prefix="/auth", tags=["auth"])

security = HTTPBearer(bearerFormat="JWT", auto_error=False)


def get_current_user(request: Request) -> dict:
    """Reusable dependency to authenticate requests. Reads user from request state (populated by middleware)."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


@router.get("/google/login")
def start_google_login(request: Request, redirect: bool = Query(True)):
    """Start Google OAuth 2.0 flow by generating random state and building auth URL."""
    try:
        state = secrets.token_urlsafe(32)
        request.session["oauth_state"] = state
        authorization_url = build_google_authorization_url(state)
        if redirect:
            return RedirectResponse(authorization_url)
        return {"authorization_url": authorization_url}
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to initialize Google login: {str(exc)}") from exc


@router.get("/google/callback")
def google_callback(request: Request, code: str = Query(...), state: str = Query(...)):
    """Handle Google OAuth callback, validating the state and ID token, and setting a session cookie."""
    try:
        session_state = request.session.pop("oauth_state", None)
        if not session_state or session_state != state:
            raise HTTPException(status_code=400, detail="Invalid state parameter (CSRF detected)")

        token_payload = exchange_code_for_token(code)
        id_token = token_payload.get("id_token")
        if not id_token:
            raise HTTPException(status_code=400, detail="No ID token returned from Google")

        user_info = validate_google_id_token(id_token)
        db_user = upsert_google_user(user_info)
        app_token = create_access_token(db_user["google_id"], email=db_user.get("email"))

        db_user["sub"] = db_user["google_id"]
        request.session["user"] = db_user

        response = RedirectResponse(url=FRONTEND_URL)
        response.set_cookie(
            key="access_token",
            value=app_token,
            httponly=True,
            secure=False,  # Set to True in production (HTTPS only)
            samesite="lax",
            max_age=3600 * 24,  # 1 day
        )
        return response
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/token", response_model=TokenResponse)
def issue_token(request: Request, payload: GoogleOAuthCallbackRequest):
    """API endpoint to exchange authorization code for application JWT and set HttpOnly cookie."""
    try:
        token_payload = exchange_code_for_token(payload.code)
        id_token = token_payload.get("id_token")
        if not id_token:
            raise HTTPException(status_code=400, detail="No ID token returned from Google")

        user_info = validate_google_id_token(id_token)
        db_user = upsert_google_user(user_info)
        app_token = create_access_token(db_user["google_id"], email=db_user.get("email"))

        db_user["sub"] = db_user["google_id"]
        request.session["user"] = db_user

        response = JSONResponse({
            "access_token": app_token,
            "token_type": "bearer",
            "user": db_user,
        })
        response.set_cookie(
            key="access_token",
            value=app_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600 * 24,
        )
        return response
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve authenticated user's information from MongoDB."""
    from config.db import db
    from models.user_model import serialize_user
    
    google_id = current_user.get("sub") or current_user.get("google_id")
    if db is not None and google_id:
        try:
            user_doc = db.users.find_one({"google_id": google_id})
            if user_doc:
                db_user = serialize_user(user_doc)
                db_user["sub"] = db_user["google_id"]
                return {"user": db_user}
        except Exception:
            pass
            
    return {"user": current_user}


@router.get("/logout")
def get_logout(request: Request):
    """Log out user by clearing session and deleting access token cookie."""
    request.session.clear()
    response = JSONResponse({"message": "Successfully logged out"})
    response.delete_cookie(key="access_token")
    return response


@router.post("/logout")
def post_logout(request: Request):
    """Log out user by clearing session and deleting access token cookie."""
    request.session.clear()
    response = JSONResponse({"message": "Successfully logged out"})
    response.delete_cookie(key="access_token")
    return response
