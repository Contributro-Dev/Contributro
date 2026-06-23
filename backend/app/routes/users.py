from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..services.activity_service import log_activity, get_user_activity
import requests
from datetime import datetime, timedelta, timezone

users_bp = Blueprint('users', __name__)


@users_bp.route('/<int:github_id>', methods=['GET'])
def get_user(github_id):
    user = db.users.find_one({"github_id": github_id})
    if user:
        user.pop('_id')
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
    ids_param = request.args.get('ids')
    if ids_param:
        try:
            ids = [int(i) for i in ids_param.split(',') if i]
        except ValueError:
            return jsonify({"error": "Invalid ids"}), 400
        users = list(db.users.find({"github_id": {"$in": ids}}))
    else:
        users = list(db.users.find())

    result = []
    for u in users:
        result.append({
            "github_id": u.get("github_id"),
            "username": u.get("username"),
            "name": u.get("name"),
            "avatar": u.get("avatar_url") or u.get("avatar"),
        })
    return jsonify(result)


@users_bp.route('/<int:github_id>/skills', methods=['PATCH'])
@jwt_required()
def update_user_skills(github_id):
    data = request.get_json()
    result = db.users.update_one(
        {"github_id": github_id},
        {"$set": {
            "skills": data.get('skills', []),
            "interests": data.get('interests', []),
            "intent": data.get('intent', "both")
        }}
    )
    if result.matched_count:
        user = db.users.find_one({"github_id": github_id})
        log_activity(github_id, user.get("username", ""), "updated_skills", "Updated skills")
        return jsonify({"message": "User skills updated successfully"})
    return jsonify({"error": "User not found"}), 404


@users_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    github_id = get_jwt_identity()
    user = db.users.find_one({"github_id": int(github_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.pop('_id')
    user.pop('github_access_token', None)
    return jsonify(user)


@users_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    github_id = get_jwt_identity()
    data = request.get_json()
    allowed_fields = ['name', 'bio', 'location', 'portfolio', 'status', 'skills', 'interests', 'avatar']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    result = db.users.update_one(
        {"github_id": int(github_id)},
        {"$set": update_data}
    )

    if not result.matched_count:
        return jsonify({"error": "User not found"}), 404

    updated_user = db.users.find_one({"github_id": int(github_id)})
    updated_user.pop('_id')
    updated_user.pop('github_access_token', None)

    username = updated_user.get("username", "")

    if "skills" in update_data or "interests" in update_data:
        log_activity(github_id, username, "updated_skills", "Updated skills")
    if "bio" in update_data:
        log_activity(github_id, username, "updated_bio", "Updated bio")
    if "portfolio" in update_data:
        log_activity(github_id, username, "updated_portfolio", "Updated portfolio")
    if "status" in update_data:
        log_activity(github_id, username, "changed_status", "Changed status")
    if any(f in update_data for f in ['name', 'location', 'avatar']):
        log_activity(github_id, username, "updated_profile", "Updated profile")

    return jsonify(updated_user)


@users_bp.route('/me/activity', methods=['GET'])
@jwt_required()
def get_my_activity():
    github_id = get_jwt_identity()
    activities = get_user_activity(github_id)
    return jsonify(activities)


@users_bp.route('/activity', methods=['POST'])
@jwt_required()
def post_activity():
    github_id = get_jwt_identity()
    data = request.get_json()
    activity_type = data.get('type')
    message = data.get('message')
    metadata = data.get('metadata', {})
    if not activity_type or not message:
        return jsonify({"error": "type and message are required"}), 400
    user = db.users.find_one({"github_id": int(github_id)})
    username = user.get("username", "") if user else ""
    log_activity(github_id, username, activity_type, message, metadata)
    return jsonify({"message": "Activity logged"}), 201


@users_bp.route('/profile/<string:username>', methods=['GET'])
def get_public_profile(username):
    user = db.users.find_one({"username": username})
    if not user:
        return jsonify({"error": "User not found"}), 404
    public_fields = ['username', 'name', 'bio', 'location', 'portfolio', 'website',
                     'status', 'skills', 'interests', 'avatar', 'joinedDate', 'github_id']
    profile = {k: user[k] for k in public_fields if k in user}
    return jsonify(profile)


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


def get_user_with_token_by_username(username):
    user = db.users.find_one({"username": username})
    if not user or not user.get("github_access_token"):
        return None
    return user


@users_bp.route("/profile/<string:username>/github-stats", methods=['GET'])
def public_github_stats(username):
    user = get_user_with_token_by_username(username)
    if not user:
        return jsonify({"error": "No GitHub data available."}), 404

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


@users_bp.route("/profile/<string:username>/github-contributions", methods=['GET'])
def public_github_contributions(username):
    user = get_user_with_token_by_username(username)
    if not user:
        return jsonify({"error": "No GitHub data available."}), 404

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

@users_bp.route('/by-ids', methods=['GET'])
@jwt_required()
def get_users_by_ids():
    ids_param = request.args.get('ids', '')
    if not ids_param:
        return jsonify([])
    try:
        ids = [int(i) for i in ids_param.split(',') if i]
    except ValueError:
        return jsonify({"error": "Invalid ids"}), 400

    users = list(db.users.find({"github_id": {"$in": ids}}))
    result = []
    for u in users:
        result.append({
            "github_id": u["github_id"],
            "username": u.get("username"),
            "name": u.get("name"),
            "avatar": u.get("avatar_url") or u.get("avatar"),
        })
    return jsonify(result)


@users_bp.route('/top-contributors', methods=['GET'])
def get_top_contributors():
    from ..extensions import db as _db
    all_users = list(_db.users.find({}))
    scored = []
    for u in all_users:
        uid = str(u['github_id'])
        projects_created = _db.projects.count_documents({"owner_github_id": uid})
        projects_joined = _db.projects.count_documents({"members": uid})
        approved_requests = _db.join_requests.count_documents({"github_id": uid, "status": "approved"})
        activity_count = _db.activities.count_documents({"github_id": uid})
        score = (projects_created * 10) + (projects_joined * 5) + (approved_requests * 3) + activity_count
        scored.append({
            "github_id": uid,
            "username": u.get("username", "Unknown"),
            "avatar_url": u.get("avatar_url", ""),
            "score": score
        })
    scored.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(scored[:5])



@users_bp.route('/profile/<username>/github-stats', methods=['GET'])
def get_public_github_stats(username):
    user = db.users.find_one({"username": username})
    if not user:
        return jsonify({"error": "User not found"}), 404

    token = user.get("github_access_token")
    gh_username = user.get("username")

    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    import requests as req
    user_resp = req.get(f"https://api.github.com/users/{gh_username}", headers=headers)
    if user_resp.status_code != 200:
        return jsonify({"error": "GitHub API error"}), 502

    gh = user_resp.json()

    repos_resp = req.get(f"https://api.github.com/users/{gh_username}/repos",
                         headers=headers, params={"per_page": 10, "sort": "pushed"})
    repos = repos_resp.json() if repos_resp.status_code == 200 else []

    lang_bytes = {}
    for r in repos:
        if r.get("language"):
            lang_bytes[r["language"]] = lang_bytes.get(r["language"], 0) + (r.get("size", 0))

    total = sum(lang_bytes.values()) or 1
    languages = sorted(
        [{"name": k, "percent": round(v / total * 100), "color": "#6366f1"} for k, v in lang_bytes.items()],
        key=lambda x: x["percent"], reverse=True
    )[:6]

    return jsonify({
        "repositories": gh.get("public_repos", 0),
        "commits": 0,
        "pull_requests": 0,
        "issues": 0,
        "followers": gh.get("followers", 0),
        "following": gh.get("following", 0),
        "languages": languages,
    })


@users_bp.route('/profile/<username>/github-contributions', methods=['GET'])
def get_public_github_contributions(username):
    user = db.users.find_one({"username": username})
    if not user:
        return jsonify({"error": "User not found"}), 404

    token = user.get("github_access_token")
    gh_username = user.get("username")

    if not token:
        return jsonify({"weeks": [], "total_contributions": 0, "current_streak": 0})

    import requests as req
    query = """
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
              }
            }
          }
        }
      }
    }
    """
    resp = req.post(
        "https://api.github.com/graphql",
        json={"query": query, "variables": {"login": gh_username}},
        headers={"Authorization": f"Bearer {token}"}
    )

    if resp.status_code != 200:
        return jsonify({"weeks": [], "total_contributions": 0, "current_streak": 0})

    data = resp.json()
    calendar = data.get("data", {}).get("user", {}).get("contributionsCollection", {}).get("contributionCalendar", {})
    weeks_raw = calendar.get("weeks", [])
    weeks = [[day["contributionCount"] for day in week["contributionDays"]] for week in weeks_raw]

    all_days = [count for week in weeks for count in week]
    streak = 0
    for count in reversed(all_days):
        if count > 0:
            streak += 1
        else:
            break

    return jsonify({
        "weeks": weeks,
        "total_contributions": calendar.get("totalContributions", 0),
        "current_streak": streak,
    })