from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from ..extensions import db
from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity

tasks_bp = Blueprint('tasks', __name__)


def serialize_task(t):
    t['_id'] = str(t['_id'])
    t['project_id'] = str(t['project_id'])
    if isinstance(t.get('due_date'), datetime):
        t['due_date'] = t['due_date'].isoformat()
    if isinstance(t.get('created_at'), datetime):
        t['created_at'] = t['created_at'].isoformat()
    return t


def get_project_or_404(project_id):
    return db.projects.find_one({"_id": ObjectId(project_id)})


def is_overdue(task):
    if task.get('status') == 'done':
        return False
    due = task.get('due_date')
    if not due:
        return False
    if isinstance(due, str):
        due = datetime.fromisoformat(due)
    if due.tzinfo is None:
        due = due.replace(tzinfo=timezone.utc)
    return due < datetime.now(timezone.utc)


@tasks_bp.route('/project/<project_id>', methods=['POST'])
@jwt_required()
def create_task(project_id):
    current_user = get_jwt_identity()
    project = get_project_or_404(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    if current_user not in project.get('members', []):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    is_owner = str(project['owner_github_id']) == str(current_user)

    assignee = data.get('assignee_github_id')
    if assignee and not is_owner:
        return jsonify({"error": "Only the owner can assign tasks"}), 403

    due_date = data.get('due_date')
    if due_date:
        due_date = datetime.fromisoformat(due_date).replace(tzinfo=timezone.utc)

    subtasks = [
        {"id": str(i), "text": s.get("text", s) if isinstance(s, dict) else s, "done": s.get("done", False) if isinstance(s, dict) else False}
        for i, s in enumerate(data.get('subtasks', []))
    ]

    task = {
        "project_id": ObjectId(project_id),
        "title": data.get('title'),
        "description": data.get('description', ''),
        "assignee_github_id": str(assignee) if assignee else None,
        "status": data.get('status', 'to_do'),
        "priority": data.get('priority', 'medium'),
        "due_date": due_date,
        "subtasks": subtasks,
        "created_by": current_user,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.tasks.insert_one(task)
    task['_id'] = result.inserted_id
    return jsonify(serialize_task(task)), 201


@tasks_bp.route('/project/<project_id>', methods=['GET'])
@jwt_required()
def get_project_tasks(project_id):
    current_user = get_jwt_identity()
    project = get_project_or_404(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    if current_user not in project.get('members', []):
        return jsonify({"error": "Unauthorized"}), 403

    tasks = list(db.tasks.find({"project_id": ObjectId(project_id)}).sort("due_date", 1))
    enriched = _attach_assignee_info(tasks)
    return jsonify([serialize_task(t) for t in enriched])


def _attach_assignee_info(tasks):
    assignee_ids = [int(t['assignee_github_id']) for t in tasks if t.get('assignee_github_id')]
    users = {u["github_id"]: u for u in db.users.find({"github_id": {"$in": assignee_ids}})}
    for t in tasks:
        t['is_overdue'] = is_overdue(t)
        if t.get('assignee_github_id'):
            u = users.get(int(t['assignee_github_id']))
            t['assignee_username'] = u.get('username') if u else 'Unknown'
            t['assignee_avatar'] = u.get('avatar_url') if u else None
        else:
            t['assignee_username'] = None
            t['assignee_avatar'] = None
    return tasks


@tasks_bp.route('/owner/upcoming', methods=['GET'])
@jwt_required()
def get_owner_upcoming_tasks():
    current_user = get_jwt_identity()
    owned_projects = list(db.projects.find({"owner_github_id": current_user}))
    project_ids = [p["_id"] for p in owned_projects]
    project_lookup = {str(p["_id"]): p.get("title") for p in owned_projects}

    tasks = list(db.tasks.find({"project_id": {"$in": project_ids}}).sort("due_date", 1))
    enriched = _attach_assignee_info(tasks)
    result = []
    for t in enriched:
        st = serialize_task(t)
        st['project_title'] = project_lookup.get(st['project_id'], 'Unknown')
        result.append(st)
    return jsonify(result)


@tasks_bp.route('/me/upcoming', methods=['GET'])
@jwt_required()
def get_my_upcoming_tasks():
    current_user = get_jwt_identity()
    tasks = list(db.tasks.find({"assignee_github_id": str(current_user)}).sort("due_date", 1))

    project_ids = list({t['project_id'] for t in tasks})
    projects = {str(p["_id"]): p.get("title") for p in db.projects.find({"_id": {"$in": project_ids}})}

    enriched = _attach_assignee_info(tasks)
    result = []
    for t in enriched:
        st = serialize_task(t)
        st['project_title'] = projects.get(st['project_id'], 'Unknown')
        result.append(st)
    return jsonify(result)


@tasks_bp.route('/<task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    current_user = get_jwt_identity()
    task = db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        return jsonify({"error": "Task not found"}), 404

    project = get_project_or_404(str(task['project_id']))
    is_owner = str(project['owner_github_id']) == str(current_user)
    is_assignee = str(task.get('assignee_github_id')) == str(current_user)

    if not is_owner and not is_assignee:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    update_data = {}

    # Owner-only fields
    owner_fields = ['title', 'description', 'priority', 'due_date', 'assignee_github_id']
    for f in owner_fields:
        if f in data:
            if not is_owner:
                return jsonify({"error": f"Only owner can edit '{f}'"}), 403
            if f == 'due_date' and data[f]:
                update_data[f] = datetime.fromisoformat(data[f]).replace(tzinfo=timezone.utc)
            elif f == 'assignee_github_id':
                update_data[f] = str(data[f]) if data[f] else None
            else:
                update_data[f] = data[f]

    # Owner or assignee can update status/subtasks
    if 'status' in data:
        update_data['status'] = data['status']
    if 'subtasks' in data:
        update_data['subtasks'] = data['subtasks']

    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_data})
    updated = db.tasks.find_one({"_id": ObjectId(task_id)})
    return jsonify(serialize_task(updated))


@tasks_bp.route('/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    current_user = get_jwt_identity()
    task = db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        return jsonify({"error": "Task not found"}), 404

    project = get_project_or_404(str(task['project_id']))
    if str(project['owner_github_id']) != str(current_user):
        return jsonify({"error": "Only owner can delete tasks"}), 403

    db.tasks.delete_one({"_id": ObjectId(task_id)})
    return jsonify({"message": "Task deleted"})