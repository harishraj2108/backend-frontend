from fastapi import APIRouter, HTTPException, Query, Request, Depends, status
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import secrets
from typing import Optional

from auth.schemas import GoogleOAuthCallbackRequest, GoogleOAuthStartResponse, TokenResponse
from auth.service import (
    build_google_authorization_url,
    exchange_code_for_token,
    validate_google_id_token,
    create_access_token,
    verify_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

security = HTTPBearer(bearerFormat="JWT", auto_error=False)


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """Reusable dependency to authenticate requests using header token, cookie token, or session."""
    # 1. Try to extract from Authorization header
    if credentials:
        try:
            payload = verify_token(credentials.credentials)
            return payload
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired token: {str(exc)}",
            ) from exc

    # 2. Try to extract from HttpOnly cookie
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        try:
            payload = verify_token(cookie_token)
            return payload
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired cookie token: {str(exc)}",
            ) from exc

    # 3. Try to check Starlette session
    session_user = request.session.get("user")
    if session_user:
        return session_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )


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
        app_token = create_access_token(user_info["sub"], email=user_info.get("email"))

        request.session["user"] = {
            "sub": user_info["sub"],
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
        }

        response = JSONResponse({
            "message": "Google OAuth login successful",
            "token": app_token,
            "user": request.session["user"],
        })
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
        app_token = create_access_token(user_info["sub"], email=user_info.get("email"))

        user_data = {
            "sub": user_info["sub"],
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
        }

        request.session["user"] = user_data

        response = JSONResponse({
            "access_token": app_token,
            "token_type": "bearer",
            "user": user_data,
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
    """Retrieve authenticated user's information."""
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
