from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from flask import request

users_bp = Blueprint('users', __name__)
    
@users_bp.route('/<int:github_id>', methods=['GET']) 
def get_user(github_id):
    user = db.users.find_one({"github_id": github_id})
    if user:
        user.pop('_id')  # Remove the MongoDB ObjectId from the response
        return jsonify(user)
    return jsonify({"error": "User not found"}), 404

@users_bp.route('/<int:github_id>', methods=['PUT'])
def update_user(github_id):
    data = request.get_json()
    result = db.users.update_one({"github_id":github_id}, {"$set": data})
    if result.matched_count:
        return jsonify({"message": "User updated successfully"})
    return jsonify({"error": "User not found"}), 404

@users_bp.route('/',methods=['GET'])
def all_users():
    users = list(db.users.find())
    for user in users:
        user.pop('_id',None)  # Remove the MongoDB ObjectId from each user in the response
    return jsonify(users)

@users_bp.route('/<int:github_id>/skills',methods =['PATCH'])
@jwt_required()
def update_user_skills(github_id):
    data = request.get_json()
    update_user = db.users.update_one({"github_id": github_id}, {"$set": {"skills": data.get('skills', []), "interests": data.get('interests', []),"intent": data.get('intent', "both")}})
    if update_user.matched_count:
        return jsonify({"message": "User skills updated successfully"})
    return jsonify({"error": "User not found"}), 404