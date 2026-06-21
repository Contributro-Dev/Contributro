from datetime import datetime , timezone
from flask import Blueprint, jsonify ,request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from bson import ObjectId
import requests
import re


projects_bp = Blueprint('projects', __name__)


# ─────────────────────────────────────────────
# GitHub helpers
# ─────────────────────────────────────────────

def parse_owner_repo(github_repo_url):
    if not github_repo_url:
        return None, None
    match = re.search(r"github\.com/([^/]+)/([^/]+?)(\.git)?/?$", github_repo_url.strip())
    if not match:
        return None, None
    return match.group(1), match.group(2)


def get_requesting_user_token():
    current_user = get_jwt_identity()
    user = db.users.find_one({"github_id": int(current_user)})
    if not user or not user.get("github_access_token"):
        return None
    return user["github_access_token"]


def github_get(token, url, params=None):
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.get(url, headers=headers, params=params)


def get_project_or_404(project_id):
    return db.projects.find_one({"_id": ObjectId(project_id)})


# ─────────────────────────────────────────────
# Existing routes (unchanged)
# ─────────────────────────────────────────────

@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    current_user = get_jwt_identity()
    data = request.get_json()

    project = {
        "title": data.get('title'),
        "description": data.get('description'),
        "required_skills": data.get('required_skills'),
        "team_size": data.get('team_size'),
        "timeline": data.get('timeline'),
        "owner_github_id": current_user,
        "status": "open",
        "members": [current_user],
        "github_repo_url": data.get('github_repo'),  # matches CreateProject.jsx's formData.github_repo
        "created_at": datetime.now(timezone.utc)
    }

    insert_result = db.projects.insert_one(project)
    return jsonify({"message": "Project created successfully", "project_id": str(insert_result.inserted_id)}), 201


@projects_bp.route('/', methods=['GET'])
def get_all_projects():
    projects = list(db.projects.find())
    for project in projects:
        project['_id'] = str(project['_id'])
    return jsonify(projects)


@projects_bp.route('/<project_id>', methods=['GET'])
def get_project(project_id):
    project = db.projects.find_one({"_id": ObjectId(project_id)})
    if project:
        project['_id'] = str(project['_id'])
        return jsonify(project)
    return jsonify({"error": "Project not found"}), 404


@projects_bp.route('/<project_id>/join', methods=['PUT'])
@jwt_required()
def join_project(project_id):
    current_user = get_jwt_identity()

    project = db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if current_user in project['members']:
        return jsonify({"message": "Already a member of the project"}), 400

    existing_request = db.join_requests.find_one({"project_id": ObjectId(project_id), "github_id": current_user})
    if existing_request:
        return jsonify({"message": "Join request already sent"}), 400

    join_project = db.join_requests.insert_one({
        "project_id": ObjectId(project_id),
        "github_id": current_user,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc)
    })
    return jsonify({"message": "Join request sent successfully", "request_id": str(join_project.inserted_id)}), 200


@projects_bp.route('/<project_id>/join_requests', methods=['GET'])
@jwt_required()
def view_join_requests(project_id):
    current_user = get_jwt_identity()
    project = db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify({"error": "Project not found"}), 404
    if project['owner_github_id'] != current_user:
        return jsonify({"error": "Unauthorized"}), 403

    pending_requests = list(db.join_requests.find({"project_id": ObjectId(project_id), "status": "pending"}))
    for req in pending_requests:
        req['_id'] = str(req['_id'])
        req['project_id'] = str(req['project_id'])
    return jsonify(pending_requests)


@projects_bp.route('/<project_id>/join_requests/<request_id>', methods=['PUT'])
@jwt_required()
def handle_join_request(project_id, request_id):
    current_user = get_jwt_identity()
    project = db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify({"error": "Project not found"}), 404
    if project['owner_github_id'] != current_user:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    action = data.get('action')

    join_request = db.join_requests.find_one({"_id": ObjectId(request_id), "project_id": ObjectId(project_id)})

    if not join_request:
        return jsonify({"error": "Join request not found"}), 404

    if action == 'approve':
        db.projects.update_one({"_id": ObjectId(project_id)}, {"$push": {"members": join_request['github_id']}})
        db.join_requests.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "approved"}})
        return jsonify({"message": "Join request approved"})

    elif action == 'reject':
        db.join_requests.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "rejected"}})
        return jsonify({"message": "Join request rejected"})

    else:
        return jsonify({"error": "Invalid action"}), 400


# ─────────────────────────────────────────────
# New: real GitHub data routes
# ─────────────────────────────────────────────

@projects_bp.route('/<project_id>/readme', methods=['GET'])
@jwt_required()
def get_project_readme(project_id):
    project = get_project_or_404(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    owner, repo = parse_owner_repo(project.get("github_repo_url"))
    if not owner:
        return jsonify({"error": "No valid GitHub repo linked to this project"}), 400

    token = get_requesting_user_token()
    resp = github_get(token, f"https://api.github.com/repos/{owner}/{repo}/readme")

    if resp.status_code != 200:
        return jsonify({"error": "Could not fetch README", "status": resp.status_code}), resp.status_code

    data = resp.json()
    import base64
    content = base64.b64decode(data.get("content", "")).decode("utf-8", errors="replace")

    return jsonify({"markdown": content, "path": data.get("path")})


@projects_bp.route('/<project_id>/commits', methods=['GET'])
@jwt_required()
def get_project_commits(project_id):
    project = get_project_or_404(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    owner, repo = parse_owner_repo(project.get("github_repo_url"))
    if not owner:
        return jsonify({"error": "No valid GitHub repo linked to this project"}), 400

    token = get_requesting_user_token()
    resp = github_get(token, f"https://api.github.com/repos/{owner}/{repo}/commits", params={"per_page": 10})

    if resp.status_code != 200:
        return jsonify({"error": "Could not fetch commits", "status": resp.status_code}), resp.status_code

    commits = [
        {
            "sha": c["sha"][:7],
            "message": c["commit"]["message"].split("\n")[0],
            "author": c["commit"]["author"]["name"],
            "date": c["commit"]["author"]["date"],
            "url": c["html_url"]
        }
        for c in resp.json()
    ]
    return jsonify({"commits": commits})


@projects_bp.route('/<project_id>/issues', methods=['GET'])
@jwt_required()
def get_project_issues(project_id):
    project = get_project_or_404(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    owner, repo = parse_owner_repo(project.get("github_repo_url"))
    if not owner:
        return jsonify({"error": "No valid GitHub repo linked to this project"}), 400

    token = get_requesting_user_token()
    resp = github_get(token, f"https://api.github.com/repos/{owner}/{repo}/issues",
                       params={"state": "open", "per_page": 20})

    if resp.status_code != 200:
        return jsonify({"error": "Could not fetch issues", "status": resp.status_code}), resp.status_code

    # GitHub's issues endpoint includes PRs — filter them out
    issues = [
        {
            "number": i["number"],
            "title": i["title"],
            "state": i["state"],
            "author": i["user"]["login"],
            "created_at": i["created_at"],
            "comments": i["comments"],
            "url": i["html_url"]
        }
        for i in resp.json() if "pull_request" not in i
    ]
    return jsonify({"issues": issues})


@projects_bp.route('/<project_id>/pulls', methods=['GET'])
@jwt_required()
def get_project_pulls(project_id):
    project = get_project_or_404(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    owner, repo = parse_owner_repo(project.get("github_repo_url"))
    if not owner:
        return jsonify({"error": "No valid GitHub repo linked to this project"}), 400

    token = get_requesting_user_token()
    resp = github_get(token, f"https://api.github.com/repos/{owner}/{repo}/pulls",
                       params={"state": "open", "per_page": 20})

    if resp.status_code != 200:
        return jsonify({"error": "Could not fetch pull requests", "status": resp.status_code}), resp.status_code

    pulls = [
        {
            "number": p["number"],
            "title": p["title"],
            "state": p["state"],
            "author": p["user"]["login"],
            "created_at": p["created_at"],
            "url": p["html_url"]
        }
        for p in resp.json()
    ]
    return jsonify({"pulls": pulls})