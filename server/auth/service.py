import os
import datetime
from typing import Any, Dict
from urllib.parse import urlencode
import requests

# pyrefly: ignore [missing-import]
import jwt

# pyrefly: ignore [missing-import]
from jwt import PyJWKClient
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv

from config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
)

load_dotenv()

oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"


def build_google_authorization_url(state: str) -> str:
    """Build the Google OAuth login authorization URL using a secure state."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_REDIRECT_URI:
        raise RuntimeError("Google OAuth configuration is missing in environment variables")
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


def validate_google_id_token(id_token: str) -> Dict[str, Any]:
    """Validate Google's OIDC ID token for signature, issuer, audience, and expiration."""
    try:
        jwks_client = PyJWKClient(GOOGLE_JWKS_URL)
        signing_key = jwks_client.get_signing_key_from_jwt(id_token)
        payload = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=GOOGLE_CLIENT_ID,
            issuer=["https://accounts.google.com", "accounts.google.com"],
            options={"require": ["sub", "iat", "exp", "iss", "aud"]},
        )
        return payload
    except Exception as exc:
        raise ValueError(f"Google OIDC ID token validation failed: {str(exc)}") from exc


def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """Manually exchange authorization code for tokens."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not GOOGLE_REDIRECT_URI:
        raise RuntimeError("Google OAuth credentials are not configured in environment variables")

    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    response = requests.post("https://oauth2.googleapis.com/token", data=data, timeout=30)
    response.raise_for_status()
    return response.json()


def create_access_token(subject: str, email: str = None) -> str:
    """Generate a real signed JWT for the application session."""
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": subject,
        "iat": now,
        "exp": now + datetime.timedelta(days=1),
        "iss": "nexagent",
        "aud": "nexagent",
    }
    if email:
        payload["email"] = email
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Dict[str, Any]:
    """Verify application JWT token claims and signature."""
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            audience="nexagent",
            issuer="nexagent",
            options={"require": ["sub", "iat", "exp", "iss", "aud"]},
        )
        return payload
    except jwt.ExpiredSignatureError as exc:
        raise ValueError("Token has expired") from exc
    except jwt.InvalidTokenError as exc:
        raise ValueError("Invalid token signature or claims") from exc
