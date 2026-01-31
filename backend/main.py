from flask import Flask, jsonify
from flask_pymongo import PyMongo
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from flask_cors import CORS
from bson.json_util import dumps # Handles MongoDB's BSON format
from dotenv import load_dotenv
import os



load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

mongo_uri = os.getenv("MONGO_URL")
client = MongoClient(mongo_uri)    


if not mongo_uri:
    print("❌ Error: MONGO_URI not found in .env file.")
    exit(1)

def check_connection():
    try:
        # The 'ping' command forces a call to the server
        client.admin.command('ping')
        print("✅ MongoDB Connection: SUCCESS")
        return True
    except ConnectionFailure as e:
        print(f"❌ MongoDB Connection: FAILED. Error: {e}")
        return False

is_db_connected = check_connection()
db = client.get_database()  # Get the default database from MongoDB URI


@app.route("/")
def home():
    if is_db_connected:
        return jsonify({"message": "Database is connected!"})
    else:   
        return jsonify({"message": "Database connection failed."}), 500

if __name__ == '__main__':
    app.run(debug=True)





@app.route('/api/users', methods=['GET'])
def users():
    # return jsonify({"users": ["Krrish", "Ishika", "Sanket"]})

    collection = db.users  # Replace 'users' with your actual collection name

    usersInfo = {
        "name": "Krrish",
        "email": "krrish@example.com"
    }
    user_info = collection.insert_one(usersInfo).inserted_id
    print(f"Inserted user with ID: {user_info}")



if __name__ == '__main__':
    app.run(debug=True, port=8080)