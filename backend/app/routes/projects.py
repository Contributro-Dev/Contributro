from datetime import datetime , timezone
from flask import Blueprint, jsonify ,request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from bson import ObjectId
import requests
import re   
from bson import ObjectId

from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request


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
    verify_jwt_in_request(optional=True)
    current_user = get_jwt_identity()

    projects = list(db.projects.find())
    project_ids = [p["_id"] for p in projects]

    star_counts = {}
    for doc in db.stars.aggregate([
        {"$match": {"project_id": {"$in": project_ids}}},
        {"$group": {"_id": "$project_id", "count": {"$sum": 1}}}
    ]):
        star_counts[str(doc["_id"])] = doc["count"]

    my_starred_ids = set()
    if current_user:
        my_starred_ids = {
            str(s["project_id"]) for s in db.stars.find(
                {"github_id": current_user, "project_id": {"$in": project_ids}}
            )
        }

    for project in projects:
        pid = str(project['_id'])
        project['_id'] = pid
        project['stars'] = star_counts.get(pid, 0)
        project['is_starred'] = pid in my_starred_ids

    return jsonify(projects)


@projects_bp.route('/<project_id>', methods=['GET'])
def get_project(project_id):
    project = db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify({"error": "Project not found"}), 404

    project['_id'] = str(project['_id'])

    # Enrich members with username + avatar (same $in pattern as join_requests)
    member_ids = [int(m) for m in project.get('members', [])]
    users = {u["github_id"]: u for u in db.users.find({"github_id": {"$in": member_ids}})}

    project['members_info'] = [
        {
            "github_id": m,
            "username": users.get(int(m), {}).get("username", "Unknown"),
            "avatar_url": users.get(int(m), {}).get("avatar_url")
        }
        for m in project.get('members', [])
    ]

    return jsonify(project)


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

    # Collect all requester github_ids, look up their user docs in one query
    requester_ids = [int(req["github_id"]) for req in pending_requests]
    users = {u["github_id"]: u for u in db.users.find({"github_id": {"$in": requester_ids}})}

    for req in pending_requests:
        req['_id'] = str(req['_id'])
        req['project_id'] = str(req['project_id'])
        user = users.get(int(req["github_id"]))
        req['username'] = user.get("username") if user else "Unknown"
        req['avatar_url'] = user.get("avatar_url") if user else None

    return jsonify(pending_requests)

@projects_bp.route('/users/me/join_requests', methods=['GET'])
@jwt_required()
def view_my_join_requests():
    current_user = get_jwt_identity()

    # Find all projects owned by this user
    owned_projects = list(db.projects.find({"owner_github_id": current_user}))
    project_ids = [p["_id"] for p in owned_projects]
    project_lookup = {str(p["_id"]): p for p in owned_projects}

    # Get ALL requests (any status) across those projects in one query
    all_requests = list(db.join_requests.find({
        "project_id": {"$in": project_ids}
    }))

    # Enrich with requester username (single $in query)
    requester_ids = [int(req["github_id"]) for req in all_requests]
    users = {u["github_id"]: u for u in db.users.find({"github_id": {"$in": requester_ids}})}

    for req in all_requests:
        req['_id'] = str(req['_id'])
        project = project_lookup.get(str(req['project_id']))
        req['project_id'] = str(req['project_id'])
        req['project_title'] = project.get('title') if project else "Unknown"
        req['required_skills'] = project.get('required_skills', []) if project else []

        user = users.get(int(req["github_id"]))
        req['username'] = user.get("username") if user else "Unknown"
        req['avatar_url'] = user.get("avatar_url") if user else None

    return jsonify(all_requests)


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
        db.join_requests.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "approved","status_updated_at": datetime.now(timezone.utc)}})
        return jsonify({"message": "Join request approved"})

    elif action == 'reject':
        db.join_requests.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "rejected", "status_updated_at": datetime.now(timezone.utc)}})
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


# ─────────────────────────────────────────────
# Platform-wide recent activity (derived, not stored)
# ─────────────────────────────────────────────

@projects_bp.route('/activity/recent', methods=['GET'])
@jwt_required()
def get_recent_activity():
    current_user = get_jwt_identity()
    token = get_requesting_user_token()

    # Only projects the current user is a member of (owners are members too)
    projects = list(db.projects.find({"members": current_user}))
    project_lookup = {str(p["_id"]): p for p in projects}
    project_ids = [p["_id"] for p in projects]

    owner_ids = [int(p["owner_github_id"]) for p in projects]
    join_requests = list(db.join_requests.find({
        "project_id": {"$in": project_ids},
        "status": {"$in": ["approved", "pending"]}
    }))
    requester_ids = [int(r["github_id"]) for r in join_requests]

    all_user_ids = list(set(owner_ids + requester_ids))
    users = {u["github_id"]: u for u in db.users.find({"github_id": {"$in": all_user_ids}})}

    events = []

    # ── Project created ──
    for p in projects:
        owner = users.get(int(p["owner_github_id"]))
        events.append({
            "type": "project_created",
            "username": owner.get("username") if owner else "Unknown",
            "avatar_url": owner.get("avatar_url") if owner else None,
            "project_title": p.get("title"),
            "timestamp": p.get("created_at"),
        })

    # ── Joined / requested to join ──
    for r in join_requests:
        requester = users.get(int(r["github_id"]))
        project = project_lookup.get(str(r["project_id"]))
        events.append({
            "type": "joined_project" if r["status"] == "approved" else "join_requested",
            "username": requester.get("username") if requester else "Unknown",
            "avatar_url": requester.get("avatar_url") if requester else None,
            "project_title": project.get("title") if project else "Unknown",
            "timestamp": r.get("status_updated_at") or r.get("requested_at"),
        })

    # ── GitHub events (commits / issues / pulls) ──
    # Capped per project + per type to avoid hammering the GitHub API / rate limits.
    for p in projects:
        owner, repo = parse_owner_repo(p.get("github_repo_url"))
        if not owner:
            continue
        title = p.get("title")

        commits_resp = github_get(token, f"https://api.github.com/repos/{owner}/{repo}/commits",
                                   params={"per_page": 3})
        if commits_resp.status_code == 200:
            for c in commits_resp.json():
                author_info = c.get("author") or {}
                events.append({
                    "type": "commit",
                    "username": author_info.get("login") or c["commit"]["author"]["name"],
                    "avatar_url": author_info.get("avatar_url"),
                    "project_title": title,
                    "message": c["commit"]["message"].split("\n")[0],
                    "timestamp": c["commit"]["author"]["date"],
                })

        issues_resp = github_get(token, f"https://api.github.com/repos/{owner}/{repo}/issues",
                                  params={"state": "all", "per_page": 3, "sort": "created", "direction": "desc"})
        if issues_resp.status_code == 200:
            for i in issues_resp.json():
                if "pull_request" in i:
                    continue
                events.append({
                    "type": "issue_opened",
                    "username": i["user"]["login"],
                    "avatar_url": i["user"]["avatar_url"],
                    "project_title": title,
                    "message": i["title"],
                    "timestamp": i["created_at"],
                })

        pulls_resp = github_get(token, f"https://api.github.com/repos/{owner}/{repo}/pulls",
                                 params={"state": "all", "per_page": 3, "sort": "created", "direction": "desc"})
        if pulls_resp.status_code == 200:
            for pr in pulls_resp.json():
                events.append({
                    "type": "pr_merged" if pr.get("merged_at") else "pr_opened",
                    "username": pr["user"]["login"],
                    "avatar_url": pr["user"]["avatar_url"],
                    "project_title": title,
                    "message": pr["title"],
                    "timestamp": pr.get("merged_at") or pr["created_at"],
                })

    # ── Normalize + sort by timestamp desc ──
    def sort_key(e):
        ts = e.get("timestamp")
        if isinstance(ts, datetime):
            return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
        if isinstance(ts, str):
            try:
                return datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except ValueError:
                pass
        return datetime.min.replace(tzinfo=timezone.utc)

    events.sort(key=sort_key, reverse=True)

    # Serialize datetimes to ISO strings
    for e in events:
        if isinstance(e.get("timestamp"), datetime):
            e["timestamp"] = e["timestamp"].isoformat()

    return jsonify(events[:20])


@projects_bp.route('/<project_id>/star', methods=['PUT'])
@jwt_required()
def toggle_star(project_id):
    current_user = get_jwt_identity()
    project = get_project_or_404(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    existing = db.stars.find_one({"project_id": ObjectId(project_id), "github_id": current_user})

    if existing:
        db.stars.delete_one({"_id": existing["_id"]})
        starred = False
    else:
        db.stars.insert_one({
            "project_id": ObjectId(project_id),
            "github_id": current_user,
            "starred_at": datetime.now(timezone.utc)
        })
        starred = True

    star_count = db.stars.count_documents({"project_id": ObjectId(project_id)})
    return jsonify({"starred": starred, "star_count": star_count})

@projects_bp.route('/trending', methods=['GET'])
def get_trending_projects():
    pipeline = [
        {"$group": {"_id": "$project_id", "star_count": {"$sum": 1}}},
        {"$sort": {"star_count": -1}},
        {"$limit": 3}
    ]
    star_agg = list(db.stars.aggregate(pipeline))
    project_ids = [s["_id"] for s in star_agg]
    projects = {p["_id"]: p for p in db.projects.find({"_id": {"$in": project_ids}})}

    trending = []
    for s in star_agg:
        project = projects.get(s["_id"])
        if not project:
            continue
        trending.append({
            "_id": str(project["_id"]),
            "title": project.get("title"),
            "required_skills": project.get("required_skills", []),
            "stars": s["star_count"],
        })
    return jsonify(trending)