from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    MONGO_URI = os.getenv("MONGO_URL")  # ← changed to MONGO_URI
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key")
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

    if not MONGO_URI:
        print("❌ Error: MONGO_URL not found in .env file.")
        exit(1)