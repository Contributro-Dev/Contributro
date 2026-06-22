from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from ..extensions import db
from ..ml.recommender import recommender

recommendations_bp = Blueprint('recommendations', __name__)

#Suppose server just started.
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

    # Enrich with live star data — the recommender index is built once at
    # startup/refresh and won't reflect stars added/removed since then.
    project_ids = []
    for r in results:
        pid = r.get("_id")
        if pid:
            try:
                project_ids.append(ObjectId(pid))
            except Exception:
                pass

    star_counts = {}
    for doc in db.stars.aggregate([
        {"$match": {"project_id": {"$in": project_ids}}},
        {"$group": {"_id": "$project_id", "count": {"$sum": 1}}}
    ]):
        star_counts[str(doc["_id"])] = doc["count"]

    my_starred_ids = {
        str(s["project_id"]) for s in db.stars.find(
            {"github_id": github_id, "project_id": {"$in": project_ids}}
        )
    }

    for r in results:
        pid = r.get("_id")
        r["stars"] = star_counts.get(pid, 0)
        r["is_starred"] = pid in my_starred_ids

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


# routes/recommendations.py — add this route
@recommendations_bp.route('/developers', methods=['GET'])
@jwt_required()
def get_developer_recommendations():
    github_id = get_jwt_identity()
    user = db.users.find_one({"github_id": int(github_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    top_n = request.args.get("limit", 10, type=int)
    my_skills = set(user.get("skills", []))

    candidates = list(db.users.find({"github_id": {"$ne": int(github_id)}}))

    results = []
    for c in candidates:
        c_skills = set(c.get("skills", []))
        overlap = my_skills & c_skills
        match_score = round((len(overlap) / max(len(my_skills), 1)) * 100) if my_skills else 0
        results.append({
            "github_id": c["github_id"],
            "username": c["username"],
            "intent": c.get("intent", "Developer"),
            "skills": list(c_skills)[:6],
            "match_score": match_score,
            "public_repos": c.get("public_repos", 0),
        })

    results.sort(key=lambda r: r["match_score"], reverse=True)
    return jsonify({"recommendations": results[:top_n]}), 200


'''
"How does your recommendation system work?"
->
User data is fetched from MongoDB through a Flask API. 
Project data is converted into TF-IDF vectors during training. 
When a recommendation request arrives, 
the user profile is converted into a vector using the same TF-IDF vocabulary. 
Cosine similarity is computed between the user vector and all project vectors.
An additional skill-overlap bonus is added, and projects are ranked according to the final score.
The top-ranked projects are returned through the recommendation API.'''

