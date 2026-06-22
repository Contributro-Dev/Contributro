# routes/connections.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from datetime import datetime

connections_bp = Blueprint('connections', __name__)

@connections_bp.route('/connect/<int:target_github_id>', methods=['POST'])
@jwt_required()
def connect(target_github_id):
    me = int(get_jwt_identity())
    existing = db.connections.find_one({"from_id": me, "to_id": target_github_id})
    if existing:
        return jsonify({"message": "Already connected", "connected": True}), 200
    db.connections.insert_one({"from_id": me, "to_id": target_github_id, "created_at": datetime.utcnow()})
    return jsonify({"message": "Connected", "connected": True}), 201

@connections_bp.route('/connect/<int:target_github_id>', methods=['DELETE'])
@jwt_required()
def disconnect(target_github_id):
    me = int(get_jwt_identity())
    db.connections.delete_one({"from_id": me, "to_id": target_github_id})
    return jsonify({"message": "Disconnected", "connected": False}), 200

@connections_bp.route('/my-connections', methods=['GET'])
@jwt_required()
def my_connections():
    me = int(get_jwt_identity())
    rows = list(db.connections.find({"from_id": me}))
    return jsonify({"connected_ids": [r["to_id"] for r in rows]}), 200


@connections_bp.route('/invite/<int:target_github_id>/<project_id>', methods=['POST'])
@jwt_required()
def invite(target_github_id, project_id):
    me = int(get_jwt_identity())
    existing = db.invites.find_one({"from_id": me, "to_id": target_github_id, "project_id": project_id})
    if existing:
        return jsonify({"message": "Already invited", "invited": True}), 200
    db.invites.insert_one({"from_id": me, "to_id": target_github_id, "project_id": project_id, "created_at": datetime.utcnow()})
    return jsonify({"message": "Invited", "invited": True}), 201

@connections_bp.route('/my-invites', methods=['GET'])
@jwt_required()
def my_invites():
    me = int(get_jwt_identity())
    rows = list(db.invites.find({"from_id": me}))
    return jsonify({"invited_ids": [r["to_id"] for r in rows]}), 200