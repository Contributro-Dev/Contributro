from flask import Blueprint, jsonify ,redirect ,request
from ..extensions import db, jwt
from flask_jwt_extended import create_access_token
import os
import requests

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/")
def home():
    try:
        db.command('ping')
        return jsonify({"message": "Database is connected!"})
    except Exception as e:
        return jsonify({"message": "Database connection failed.", "error": str(e)}), 500
# git routing


@auth_bp.route("/github/login")
def github_login(): 
    client_id = os.getenv("GITHUB_CLIENT_ID")
    url = f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=read:user,user:email"
    return redirect(url)
   

@auth_bp.route("/github/callback")
def github_callback():
    code = request.args.get("code")
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    token_response = requests.post("https://github.com/login/oauth/access_token", data={
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code
    },
    headers={"Accept": "application/json"})
    token_data = token_response.json()
    
    # print("Received token data:", token_data)
    # return jsonify(token_data)

    access_token = token_data.get("access_token")
    if not access_token:
        return jsonify({"error": "Failed to obtain access token."}), 400

    user_response = requests.get("https://api.github.com/user", headers={
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    })
    user_data = user_response.json()
    
    # return jsonify(user_data)
    
    user = {
        "github_id": user_data.get("id"),
        "username": user_data.get("login"),
        "avatar_url": user_data.get("avatar_url"),
        "name": user_data.get("name"),
        "email": user_data.get("email"),
        "bio": user_data.get("bio"),
        "github_url": user_data.get("html_url"),
        "public_repos": user_data.get("public_repos")
    }

    existing_user = db.users.find_one({"github_id": user["github_id"]})
    if not existing_user:
        db.users.insert_one(user)
    
    user.pop("_id", None)    
        
    jwt_token = create_access_token(identity=str(user["github_id"]))
    return jsonify({
        "token": jwt_token,
        "user": user
    })