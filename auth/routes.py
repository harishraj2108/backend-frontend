from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse

from auth.schemas import GoogleOAuthCallbackRequest, GoogleOAuthStartResponse, TokenResponse
from auth.service import build_google_authorization_url, exchange_code_for_token, fetch_google_user_info, create_access_token, verify_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/login", response_model=GoogleOAuthStartResponse)
def start_google_login():
    authorization_url = build_google_authorization_url()
    return {"authorization_url": authorization_url}


@router.get("/google/callback")
def google_callback(code: str = Query(...), state: str = "default"):
    try:
        token_payload = exchange_code_for_token(code)
        access_token = token_payload.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token returned from Google")

        user_info = fetch_google_user_info(access_token)
        app_token = create_access_token(user_info.get("email") or user_info.get("sub", "unknown"))

        return {
            "message": "Google OAuth login successful",
            "token": app_token,
            "user": user_info,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/token", response_model=TokenResponse)
def issue_token(payload: GoogleOAuthCallbackRequest):
    try:
        token_payload = exchange_code_for_token(payload.code)
        access_token = token_payload.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token returned from Google")

        user_info = fetch_google_user_info(access_token)
        app_token = create_access_token(user_info.get("email") or user_info.get("sub", "unknown"))
        return TokenResponse(access_token=app_token, user=user_info)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/me")
def get_current_user(token: str):
    try:
        payload = verify_token(token)
        return {"user": payload}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
