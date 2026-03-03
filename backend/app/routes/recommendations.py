from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('/', methods=['GET'])
@jwt_required()
def get_recommendations():
    current_user = get_jwt_identity()
    #ml logic will be here
    return jsonify({"message":"Recommendation comming soon","user": current_user})
    
