from pymongo import MongoClient
from flask_jwt_extended import JWTManager
import certifi

client = None
db = None
jwt = JWTManager()

def init_mongo(app):
    global client, db
    try:
        client = MongoClient(app.config.get("MONGO_URI"), tlsCAFile=certifi.where())
        db = client.get_database("contributro")
        client.admin.command("ping")
        print("✅ MongoDB connected successfully!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")