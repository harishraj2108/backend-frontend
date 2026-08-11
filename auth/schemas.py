from typing import Optional

from pydantic import BaseModel


class GoogleOAuthStartResponse(BaseModel):
    authorization_url: str


class GoogleOAuthCallbackRequest(BaseModel):
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
