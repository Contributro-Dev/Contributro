from datetime import datetime , timezone
from flask import Blueprint, jsonify ,request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from bson import ObjectId


projects_bp = Blueprint('projects', __name__)


@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    project ={
        "title": data.get('title'),
        "description": data.get('description'),
        "required_skills": data.get('required_skills'),
        "team_size": data.get('team_size'),
        "timeline": data.get('timeline'),
        "owner_github_id": current_user,
        "status": "open",
        "members": [current_user],
        "created_at": datetime.now(timezone.utc)
    }
    
    insert_result = db.projects.insert_one(project)
    return jsonify({"message":"Project created successfully", "project_id": str(insert_result.inserted_id)}), 201

#section to get all projects, accessible by anyone, returns a list of all projects with their details, including the project ID for reference

@projects_bp.route('/', methods=['GET'])
def get_all_projects():
    projects = list(db.projects.find())
    for project in projects:
        project['_id'] = str(project['_id'])  # Convert ObjectId to string for JSON serialization
    return jsonify(projects)    
    
@projects_bp.route('/<project_id>', methods=['GET'])
def get_project(project_id):
    project = db.projects.find_one({"_id": ObjectId(project_id)})
    if project:
        project['_id'] = str(project['_id'])  # Convert ObjectId to string for JSON serialization
        return jsonify(project)
    return jsonify({"error": "Project not found"}), 404    

#section to join a project, only accessible by authenticated users to join a project, creates a join request that the project owner can approve or reject

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

# Only project owner can view join requests for their project
#section to view join requests for a project, only accessible by the project owner

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
        req['_id'] = str(req['_id'])  # Convert ObjectId to string for JSON serialization
        req['project_id'] = str(req['project_id']) # Convert ObjectId to string for JSON serialization
    return jsonify(pending_requests)


#To handle join requests, only accessible by the project owner to approve or reject join requests for their project, updates the project members list and the status of the join request accordingly
    
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