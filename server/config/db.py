import logging
from pymongo import MongoClient
from config import MONGODB_URI

logger = logging.getLogger("db")

try:
    # Initialize the PyMongo Client
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Get the default database (falls back to 'nexagent' if none specified in connection string)
    db = client.get_database("nexagent")
    # Quick connectivity test (ping)
    client.admin.command('ping')
    logger.info("Successfully connected to MongoDB!")
except Exception as exc:
    logger.warning(
        f"[MongoDB] Could not establish connection to database: {str(exc)}. "
        f"Ensure MongoDB is running or the connection string in .env is correct."
    )
    # Create client without checking connection so app doesn't crash on start
    client = MongoClient(MONGODB_URI)
    db = client.get_database("nexagent")
