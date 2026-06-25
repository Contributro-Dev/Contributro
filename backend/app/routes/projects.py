from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from ..extensions import db
from bson import ObjectId
import requests
import re
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

projects_bp = Blueprint('projects', __name__)


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


def log_activity(github_id, action, project_title="", project_id=None):
    db.activities.insert_one({
        "github_id": str(github_id),
        "action": action,
        "project_title": project_title,
        "project_id": str(project_id) if project_id else None,
        "created_at": datetime.now(timezone.utc)
    })


@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    current_user = get_jwt_identity()
    data = request.get_json()
    project = {
        "title": data.get('title'),
        "description": data.get('description'),
        "required_skills": data.get('required_skills', []),
        "team_size": data.get('team_size'),
        "timeline": data.get('timeline'),
        "difficulty": data.get('difficulty'),
        "project_type": data.get('project_type'),
        "remote_friendly": data.get('remote_friendly', False),
        "owner_github_id": current_user,
        "status": "open",
        "members": [current_user],
        "github_repo_url": data.get('github_repo'),
        "stars": 0,
        "starred_by": [],
        "created_at": datetime.now(timezone.utc)
    }
    insert_result = db.projects.insert_one(project)
    log_activity(current_user, "created a project", data.get('title'), insert_result.inserted_id)
    return jsonify({"message": "Project created successfully", "project_id": str(insert_result.inserted_id)}), 201


@projects_bp.route('/', methods=['GET'])
def get_all_projects():
    verify_jwt_in_request(optional=True)
    current_user = get_jwt_identity()

    sort_by = request.args.get('sort', 'newest')
    skills = request.args.getlist('skills')
    difficulty = request.args.getlist('difficulty')
    project_type = request.args.getlist('project_type')
    availability = request.args.getlist('availability')
    team_size = request.args.getlist('team_size')
    timeline = request.args.getlist('timeline')
    search = request.args.get('search', '').strip()

    query = {}

    if skills:
        query['required_skills'] = {'$in': skills}

    if difficulty:
        query['difficulty'] = {'$in': difficulty}

    if project_type:
        query['project_type'] = {'$in': project_type}

    if 'Open Positions' in availability:
        query['status'] = 'open'
    if 'Remote Friendly' in availability:
        query['remote_friendly'] = True
    if 'Actively Maintained' in availability:
        query['github_repo_url'] = {'$exists': True, '$ne': ''}

    if team_size:
        size_conditions = []
        for ts in team_size:
            if ts == 'Solo (1)':
                size_conditions.append({'team_size': {'$lte': 1}})
            elif ts == 'Small (2-5)':
                size_conditions.append({'team_size': {'$gte': 2, '$lte': 5}})
            elif ts == 'Medium (6-10)':
                size_conditions.append({'team_size': {'$gte': 6, '$lte': 10}})
            elif ts == 'Large (10+)':
                size_conditions.append({'team_size': {'$gt': 10}})
        if size_conditions:
            query['$or'] = size_conditions

    if timeline:
        tl_map = {
            'Short (< 1 month)': 'short',
            'Medium (1-3 months)': 'medium',
            'Long (3+ months)': 'long'
        }
        mapped = [tl_map[t] for t in timeline if t in tl_map]
        if mapped:
            query['timeline'] = {'$in': mapped}

    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}},
            {'required_skills': {'$regex': search, '$options': 'i'}},
        ]

    # Default sort at the DB level for non-star sorts; star-based sorts are
    # resolved after we attach real counts from db.stars below.
    sort_map = {
        'newest': [('created_at', -1)],
        'oldest': [('created_at', 1)],
        'members': [('members_count', -1)],
    }
    db_sort = sort_map.get(sort_by)

    if db_sort:
        projects = list(db.projects.find(query).sort(db_sort))
    else:
        projects = list(db.projects.find(query))

    project_ids = [p["_id"] for p in projects]

    # ── Real star counts from db.stars (not the stale project.stars field) ──
    star_counts = {}
    for doc in db.stars.aggregate([
        {"$match": {"project_id": {"$in": project_ids}}},
        {"$group": {"_id": "$project_id", "count": {"$sum": 1}}}
    ]):
        star_counts[str(doc["_id"])] = doc["count"]

    my_starred_ids = set()
    my_pending_ids = set()
    if current_user:
        my_starred_ids = {
            str(s["project_id"]) for s in db.stars.find(
                {"github_id": current_user, "project_id": {"$in": project_ids}}
            )
        }
        my_pending_ids = {
            str(r["project_id"]) for r in db.join_requests.find(
                {"github_id": current_user, "status": "pending", "project_id": {"$in": project_ids}}
            )
        }

    for project in projects:
        pid = str(project['_id'])
        project['_id'] = pid
        project['members_count'] = len(project.get('members', []))
        project['stars'] = star_counts.get(pid, 0)
        project['is_starred'] = pid in my_starred_ids
        project['has_pending_request'] = pid in my_pending_ids

    # ── Sort by real star count for popular/starred (can't be done in the DB query) ──
    if sort_by in ('popular', 'starred'):
        projects.sort(key=lambda p: p['stars'], reverse=True)

    return jsonify(projects)


@projects_bp.route('/<project_id>', methods=['GET'])
def get_project(project_id):
    verify_jwt_in_request(optional=True)
    current_user = get_jwt_identity()
    project = db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify({"error": "Project not found"}), 404
    project['_id'] = str(project['_id'])
    project.setdefault('about', '')
    project.setdefault('goal', '')
    project.setdefault('current_status_label', '')
    project.setdefault('current_status_text', '')
    project.setdefault('key_features', [])
    project.setdefault('contributors_needed', [])
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
    star_count = db.stars.count_documents({"project_id": ObjectId(project_id)})
    project['stars'] = star_count
    project['is_starred'] = bool(current_user and db.stars.find_one(
        {"project_id": ObjectId(project_id), "github_id": current_user}
    ))
    project['has_pending_request'] = bool(current_user and db.join_requests.find_one({
        "project_id": ObjectId(project_id), "github_id": current_user, "status": "pending"
    }))
    
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
    join_request = db.join_requests.insert_one({
        "project_id": ObjectId(project_id),
        "github_id": current_user,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc)
    })
    log_activity(current_user, "requested to join", project.get('title', ''), project_id)
    return jsonify({"message": "Join request sent successfully", "request_id": str(join_request.inserted_id)}), 200


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
    owned_projects = list(db.projects.find({"owner_github_id": current_user}))
    project_ids = [p["_id"] for p in owned_projects]
    project_lookup = {str(p["_id"]): p for p in owned_projects}
    all_requests = list(db.join_requests.find({"project_id": {"$in": project_ids}}))
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
        db.join_requests.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "approved", "status_updated_at": datetime.now(timezone.utc)}})
        return jsonify({"message": "Join request approved"})
    elif action == 'reject':
        db.join_requests.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "rejected", "status_updated_at": datetime.now(timezone.utc)}})
        return jsonify({"message": "Join request rejected"})
    else:
        return jsonify({"error": "Invalid action"}), 400


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


@projects_bp.route('/trending', methods=['GET'])
def get_trending_projects():
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    recent_activities = list(db.activities.find({"created_at": {"$gte": week_ago}}))
    activity_counts = {}
    for a in recent_activities:
        pid = str(a.get('project_id', ''))
        if pid:
            activity_counts[pid] = activity_counts.get(pid, 0) + 1

    recent_joins = list(db.join_requests.find({
        "status": "approved",
        "status_updated_at": {"$gte": week_ago}
    }))
    join_counts = {}
    for j in recent_joins:
        pid = str(j['project_id'])
        join_counts[pid] = join_counts.get(pid, 0) + 1

    all_projects = list(db.projects.find({}))
    project_ids = [p["_id"] for p in all_projects]

    # ── Real star counts from db.stars ──
    star_counts = {}
    for doc in db.stars.aggregate([
        {"$match": {"project_id": {"$in": project_ids}}},
        {"$group": {"_id": "$project_id", "count": {"$sum": 1}}}
    ]):
        star_counts[str(doc["_id"])] = doc["count"]

    scored = []
    for p in all_projects:
        pid = str(p['_id'])
        real_stars = star_counts.get(pid, 0)
        score = (real_stars * 2) + (join_counts.get(pid, 0) * 3) + activity_counts.get(pid, 0)
        scored.append((score, real_stars, p))

    scored.sort(key=lambda x: x[0], reverse=True)
    trending = []
    for score, real_stars, p in scored[:3]:
        trending.append({
            "_id": str(p["_id"]),
            "title": p.get("title"),
            "required_skills": p.get("required_skills", []),
            "stars": real_stars,
            "trend_score": score,
        })
    return jsonify(trending)



# DANGER ⚠️ (EDIT BELOW ROUTE AT YOUR OWN RISK)

# Recent Activity ---------------------------------------------------------------

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

    # Serialize datetimes to ISO strings, explicitly marking naive datetimes as UTC
    for e in events:
        ts = e.get("timestamp")
        if isinstance(ts, datetime):
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            e["timestamp"] = ts.isoformat()

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


@projects_bp.route('/<project_id>/leave', methods=['PUT'])
@jwt_required()
def leave_project(project_id):
    current_user = get_jwt_identity()
    project = db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify({"error": "Project not found"}), 404
    if current_user not in project.get('members', []):
        return jsonify({"error": "Not a member"}), 400
    db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$pull": {"members": current_user}}
    )
    log_activity(current_user, "left project", project.get('title', ''), project_id)
    return jsonify({"message": "Left project successfully"})



# ─────────────────────────────────────────────
# Owner-only: edit, delete, manage members
# ─────────────────────────────────────────────

@projects_bp.route('/<project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    current_user = get_jwt_identity()
    project = get_project_or_404(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    if str(project['owner_github_id']) != str(current_user):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    allowed_fields = ['title', 'description', 'required_skills', 'team_size', 'timeline', 'status', 'github_repo','about', 'goal', 'current_status_label', 'current_status_text','key_features', 'contributors_needed']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    

    if 'github_repo' in update_data:
        update_data['github_repo_url'] = update_data.pop('github_repo')

    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": update_data})
    return jsonify({"message": "Project updated successfully"}), 200


@projects_bp.route('/<project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    current_user = get_jwt_identity()
    project = get_project_or_404(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    if str(project['owner_github_id']) != str(current_user):
        return jsonify({"error": "Unauthorized"}), 403

    db.projects.delete_one({"_id": ObjectId(project_id)})
    db.join_requests.delete_many({"project_id": ObjectId(project_id)})
    db.stars.delete_many({"project_id": ObjectId(project_id)})

    return jsonify({"message": "Project deleted successfully"}), 200


@projects_bp.route('/<project_id>/members/<github_id>', methods=['DELETE'])
@jwt_required()
def remove_member(project_id, github_id):
    current_user = get_jwt_identity()
    project = get_project_or_404(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    if str(project['owner_github_id']) != str(current_user):
        return jsonify({"error": "Unauthorized"}), 403

    if str(github_id) == str(project['owner_github_id']):
        return jsonify({"error": "Owner cannot remove themselves"}), 400

    if github_id not in project.get('members', []):
        return jsonify({"error": "User is not a member of this project"}), 400

    db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$pull": {"members": github_id}}
    )
    db.join_requests.delete_many({"project_id": ObjectId(project_id), "github_id": github_id})

    return jsonify({"message": "Member removed successfully"}), 200