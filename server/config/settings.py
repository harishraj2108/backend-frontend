import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env", override=True)

LANGFLOW_URL = os.getenv("LANGFLOW_URL", "")
API_KEY = os.getenv("SCRAPEGRAPH_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", API_KEY)
PORT = int(os.getenv("PORT", 8000))

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "super-secret-session-key-change-in-production-1234567890")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key-change-in-production-1234567890")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

HEADERS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
}

# --- RAG Settings ---
PERSIST_DIR = os.getenv("QA_PERSIST_DIR", "./chroma_db")
REPOS_DIR = os.getenv("QA_REPOS_DIR", "./repos")
DEFAULT_EMBED_MODEL = "all-MiniLM-L6-v2"
DEFAULT_CHAT_MODEL = "llama-3.3-70b-versatile"
DEFAULT_CHUNK_SIZE = 100
DEFAULT_CHUNK_OVERLAP = 15
DEFAULT_N_RESULTS = 6
MAX_FILE_SIZE_BYTES = 500_000

CODE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rb", ".rs",
    ".c", ".h", ".cpp", ".hpp", ".cc", ".cs", ".php", ".swift", ".kt",
    ".kts", ".scala", ".m", ".mm", ".sql", ".sh", ".bash", ".ps1",
    ".md", ".mdx", ".yaml", ".yml", ".json", ".toml", ".ini", ".cfg",
    ".html", ".css", ".scss", ".vue", ".svelte", ".graphql", ".proto",
    "Dockerfile", "Makefile",
}

IGNORE_DIRS = {
    ".git", "node_modules", "venv", ".venv", "env", "__pycache__",
    "dist", "build", ".idea", ".vscode", "target", "vendor",
    ".next", ".cache", "coverage", ".pytest_cache", "site-packages",
    ".mypy_cache", ".tox", "egg-info",
}
