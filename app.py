from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.routes import router as auth_router
from config import PORT
from routes.chat_routes import router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Multi-Agent Model API",
        description="FastAPI Backend for Langflow Multi-Agent Model",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router, tags=["chat"])
    app.include_router(auth_router, tags=["auth"])
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=True)
