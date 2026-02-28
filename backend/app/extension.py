from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
import certifi

mongo = PyMongo()
jwt = JWTManager()

def init_mongo(app):
    # Your SSL fix moved here
    app.config["MONGO_CONNECT_OPTIONS"] = {"tlsCAFile": certifi.where()}
    mongo.init_app(app)

    # Test connection on startup
    try:
        mongo.cx.admin.command("ping")
        print("✅ MongoDB connected successfully!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")