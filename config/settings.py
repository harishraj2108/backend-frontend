import os
from dotenv import load_dotenv

load_dotenv()

LANGFLOW_URL = os.getenv("LANGFLOW_URL", "")
API_KEY = os.getenv("SCRAPEGRAPH_API_KEY", "")
PORT = int(os.getenv("PORT", 8000))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")

HEADERS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
}
