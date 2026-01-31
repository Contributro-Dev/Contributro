from flask import Flask, jsonify
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from flask_cors import CORS
from dotenv import load_dotenv
import certifi
import os

# 1. Load Env
load_dotenv()

app = Flask(__name__)
CORS(app)

# 2. Get URI & Validate
mongo_uri = os.getenv("MONGO_URL")

if not mongo_uri:
    print("❌ Error: MONGO_URL not found in .env file.")
    exit(1)

# 3. Connect with SSL FIX (Use certifi here!)
try:
    client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
    # Assign the database immediately
    db = client.get_database("flask_db") # Or use client['flask_db']
except Exception as e:
    print(f"Error connecting: {e}")

# 4. Define Routes BEFORE app.run()

@app.route("/")
def home():
    # Check connection on request (optional but safer)
    try:
        client.admin.command('ping')
        return jsonify({"message": "Database is connected!"})
    except Exception as e:
        return jsonify({"message": "Database connection failed.", "error": str(e)}), 500

@app.route('/api/users', methods=['GET'])
def users():
    collection = db.users 

    usersInfo = {
        "name": "Krrish",
        "email": "krrish@example.com"
    }

    try:
        # Insert data
        result = collection.insert_one(usersInfo)
        new_id = str(result.inserted_id)
        
        print(f"Inserted user with ID: {new_id}")
        
        # 5. MUST RETURN A RESPONSE
        return jsonify({
            "message": "User added successfully", 
            "id": new_id,
            "user": usersInfo['name']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 6. Run the App (Only once, at the very end)
if __name__ == '__main__':
    # You had two app.run blocks; I kept the one with port 8080
    app.run(debug=True, port=8080)