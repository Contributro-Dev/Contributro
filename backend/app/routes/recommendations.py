from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from ..extensions import db
from ..ml.recommender import recommender

recommendations_bp = Blueprint('recommendations', __name__)


def _ensure_index_built():
    """
    Train the recommender if it has not been trained yet.
    """

    if recommender.project_vectors is None:

        projects = list(db.projects.find({}))

        if projects:
            recommender.fit(projects)
        else:
            print("[ML] No projects found for training")


@recommendations_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_project_recommendations():

    github_id = get_jwt_identity()

    # IMPORTANT:
    # Use int() if github_id is stored as a number in MongoDB.
    # Use str() if github_id is stored as a string.
    user = db.users.find_one({
        "github_id": int(github_id)
    })

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    _ensure_index_built()

    top_n = request.args.get("limit", 10, type=int)

    results = recommender.recommend_projects(
        user=user,
        top_n=top_n
    )

    return jsonify({
        "recommendations": results,
        "count": len(results)
    }), 200


@recommendations_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_index():

    projects = list(db.projects.find({}))

    recommender.fit(projects)

    return jsonify({
        "message": f"Index rebuilt successfully with {len(projects)} projects"
    }), 200




