from flask import Blueprint, jsonify

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['GET'])
def get_projects():
    return jsonify({"message": "Projects route working!"})