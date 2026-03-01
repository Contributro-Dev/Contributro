from flask import Blueprint, jsonify
from ..extensions import db

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def users():
    usersInfo = {
        "name": "Krrish",
        "email": "krrish@example.com"
    }
    try:
        result = db.users.insert_one(usersInfo)
        new_id = str(result.inserted_id)
        return jsonify({
            "message": "User added successfully",
            "id": new_id,
            "user": usersInfo['name']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500