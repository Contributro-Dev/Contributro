from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from flask import request
import requests
from datetime import datetime, timedelta

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
    result = db.users.update_one({"github_id": github_id}, {"$set": data})
    if result.matched_count:
        return jsonify({"message": "User updated successfully"})
    return jsonify({"error": "User not found"}), 404


@users_bp.route('/', methods=['GET'])
def all_users():
    users = list(db.users.find())
    for user in users:
        user.pop('_id', None)  # Remove the MongoDB ObjectId from each user in the response
    return jsonify(users)


@users_bp.route('/<int:github_id>/skills', methods=['PATCH'])
@jwt_required()
def update_user_skills(github_id):
    data = request.get_json()
    update_user = db.users.update_one(
        {"github_id": github_id},
        {"$set": {
            "skills": data.get('skills', []),
            "interests": data.get('interests', []),
            "intent": data.get('intent', "both")
        }}
    )
    if update_user.matched_count:
        return jsonify({"message": "User skills updated successfully"})
    return jsonify({"error": "User not found"}), 404


# ─────────────────────────────────────────────
# Real GitHub data routes
# ─────────────────────────────────────────────

PROFILE_QUERY = """
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    followers { totalCount }
    following { totalCount }
    repositories(first: 10, orderBy: {field: UPDATED_AT, direction: DESC}, isFork: false) {
      totalCount
      nodes {
        languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
          edges {
            size
            node { name color }
          }
        }
      }
    }
    pullRequests { totalCount }
    issues { totalCount }
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
"""


def run_github_query(token, variables):
    response = requests.post(
        "https://api.github.com/graphql",
        json={"query": PROFILE_QUERY, "variables": variables},
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"}
    )
    return response.json()


def get_user_with_token(github_id):
    user = db.users.find_one({"github_id": int(github_id)})
    if not user or not user.get("github_access_token"):
        return None
    return user


@users_bp.route("/me/github-contributions")
@jwt_required()
def github_contributions():
    github_id = get_jwt_identity()
    user = get_user_with_token(github_id)
    if not user:
        return jsonify({"error": "No GitHub token on file."}), 400

    to_date = datetime.utcnow()
    from_date = to_date - timedelta(days=365)

    data = run_github_query(user["github_access_token"], {
        "login": user["username"],
        "from": from_date.isoformat() + "Z",
        "to": to_date.isoformat() + "Z"
    })

    if "errors" in data:
        return jsonify({"error": data["errors"]}), 400

    calendar = data["data"]["user"]["contributionsCollection"]["contributionCalendar"]
    weeks = [[d["contributionCount"] for d in week["contributionDays"]] for week in calendar["weeks"]]

    all_days = [d for week in calendar["weeks"] for d in week["contributionDays"]]
    all_days.reverse()
    streak = 0
    for d in all_days:
        if d["contributionCount"] > 0:
            streak += 1
        else:
            break

    return jsonify({
        "total_contributions": calendar["totalContributions"],
        "current_streak": streak,
        "weeks": weeks
    })


@users_bp.route("/me/github-stats")
@jwt_required()
def github_stats():
    github_id = get_jwt_identity()
    user = get_user_with_token(github_id)
    if not user:
        return jsonify({"error": "No GitHub token on file."}), 400

    to_date = datetime.utcnow()
    from_date = to_date - timedelta(days=365)

    data = run_github_query(user["github_access_token"], {
        "login": user["username"],
        "from": from_date.isoformat() + "Z",
        "to": to_date.isoformat() + "Z"
    })

    if "errors" in data:
        return jsonify({"error": data["errors"]}), 400

    u = data["data"]["user"]

    return jsonify({
        "repositories": u["repositories"]["totalCount"],
        "commits": u["contributionsCollection"]["totalCommitContributions"],
        "pull_requests": u["pullRequests"]["totalCount"],
        "issues": u["issues"]["totalCount"],
        "followers": u["followers"]["totalCount"],
        "following": u["following"]["totalCount"]
    })


@users_bp.route("/me/github-languages")
@jwt_required()
def github_languages():
    github_id = get_jwt_identity()
    user = get_user_with_token(github_id)
    if not user:
        return jsonify({"error": "No GitHub token on file."}), 400

    to_date = datetime.utcnow()
    from_date = to_date - timedelta(days=365)

    data = run_github_query(user["github_access_token"], {
        "login": user["username"],
        "from": from_date.isoformat() + "Z",
        "to": to_date.isoformat() + "Z"
    })

    if "errors" in data:
        return jsonify({"error": data["errors"]}), 400

    repos = data["data"]["user"]["repositories"]["nodes"]

    totals = {}
    colors = {}
    for repo in repos:
        for edge in repo["languages"]["edges"]:
            name = edge["node"]["name"]
            totals[name] = totals.get(name, 0) + edge["size"]
            colors[name] = edge["node"]["color"]

    grand_total = sum(totals.values())
    if grand_total == 0:
        return jsonify({"languages": []})

    languages = [
        {"name": name, "percent": round((size / grand_total) * 100, 1), "color": colors.get(name, "#cbd5e1")}
        for name, size in sorted(totals.items(), key=lambda x: x[1], reverse=True)
    ]

    return jsonify({"languages": languages[:6]})