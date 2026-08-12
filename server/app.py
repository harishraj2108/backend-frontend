from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import logging

from auth.routes import router as auth_router
from auth.service import verify_token
from config import PORT, SESSION_SECRET_KEY
from routes.chat_routes import router
from routes.rag_routes import router as rag_router

# Configure logger for request audits
logger = logging.getLogger("auth_audit")
logging.basicConfig(level=logging.INFO)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Multi-Agent Model API",
        description="FastAPI Backend for Langflow Multi-Agent Model & Multimodal GitHub RAG",
        version="1.0.0",
    )

    app.add_middleware(
        SessionMiddleware,
        secret_key=SESSION_SECRET_KEY,
        session_cookie="session",
        same_site="lax",
        https_only=False,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:8443",
            "http://127.0.0.1:8443",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def audit_and_verify_requests(request: Request, call_next):
        token = None

        # 1. Try to extract from Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        # 2. Try to extract from HttpOnly cookie
        if not token:
            token = request.cookies.get("access_token")

        request.state.user = None

        if token:
            try:
                # Validate the token
                user_payload = verify_token(token)
                request.state.user = user_payload
                
                # Analyze / log details of the request
                user_email = user_payload.get("email", "unknown")
                user_sub = user_payload.get("sub", "unknown")
                logger.info(
                    f"[Audit Log] Authenticated Request: User={user_email} (ID={user_sub}) "
                    f"Method={request.method} Path={request.url.path} "
                    f"Client={request.client.host if request.client else 'unknown'}"
                )
            except Exception as exc:
                logger.warning(
                    f"[Audit Log] Invalid JWT token attempt: Path={request.url.path} "
                    f"Error={str(exc)}"
                )
        else:
            # Fallback to session user if available
            session_user = None
            try:
                session_user = request.session.get("user")
            except (AssertionError, AttributeError):
                pass

            if session_user:
                request.state.user = session_user
                logger.info(
                    f"[Audit Log] Session Authenticated Request: User={session_user.get('email')} "
                    f"Method={request.method} Path={request.url.path}"
                )
            else:
                # Log unauthenticated requests to public endpoints
                logger.info(
                    f"[Audit Log] Unauthenticated Request: Method={request.method} "
                    f"Path={request.url.path}"
                )

        response = await call_next(request)
        return response

    app.include_router(router, tags=["chat"])
    app.include_router(auth_router, tags=["auth"])
    app.include_router(rag_router, tags=["rag"])
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=True)
