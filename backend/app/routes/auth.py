from flask import Blueprint, jsonify
from ..extension import mongo

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/")
def home():
    try:
        mongo.cx.admin.command('ping')
        return jsonify({"message": "Database is connected!"})
    except Exception as e:
        return jsonify({"message": "Database connection failed.", "error": str(e)}), 500