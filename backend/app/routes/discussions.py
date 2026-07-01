# backend/app/routes/discussions.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from ..extensions import db

discussions_bp = Blueprint("discussions", __name__)

CATEGORIES = {"General", "Backend", "Frontend", "Bug", "Feature", "Other"}


def str_id(val):
    return str(val) if val is not None else None


def serialize_reply(r, me):
    return {
        "id": str(r["_id"]),
        "text": r.get("text", ""),
        "author_id": str_id(r.get("author_id")),
        "author_username": r.get("author_username", ""),
        "author_avatar": r.get("author_avatar"),
        "likes": r.get("likes", 0),
        "liked_by_me": str(me) in [str(x) for x in r.get("liked_by", [])],
        "is_accepted": r.get("is_accepted", False),
        "created_at": r.get("created_at", datetime.utcnow()).isoformat(),
    }


def serialize_discussion(d, me, reply_count=None):
    return {
        "id": str(d["_id"]),
        "project_id": str_id(d.get("project_id")),
        "title": d.get("title", ""),
        "body": d.get("body", ""),
        "category": d.get("category", "General"),
        "status": d.get("status", "open"),
        "pinned": d.get("pinned", False),
        "author_id": str_id(d.get("author_id")),
        "author_username": d.get("author_username", ""),
        "author_avatar": d.get("author_avatar"),
        "likes": d.get("likes", 0),
        "liked_by_me": str(me) in [str(x) for x in d.get("liked_by", [])],
        "reply_count": reply_count if reply_count is not None else d.get("reply_count", 0),
        "participants": d.get("participants", []),
        "created_at": d.get("created_at", datetime.utcnow()).isoformat(),
    }


# ── GET /api/discussions/<project_id> ────────────────────────────────────────
@discussions_bp.route("/<project_id>", methods=["GET"])
@jwt_required()
def list_discussions(project_id):
    me = str(get_jwt_identity())
    discussions = list(
        db.discussions.find({"project_id": project_id}).sort([
            ("pinned", -1), ("created_at", -1)
        ])
    )
    result = []
    for d in discussions:
        reply_count = db.discussion_replies.count_documents(
            {"discussion_id": str(d["_id"])}
        )
        result.append(serialize_discussion(d, me, reply_count))
    return jsonify(result), 200


# ── POST /api/discussions/<project_id> ───────────────────────────────────────
@discussions_bp.route("/<project_id>", methods=["POST"])
@jwt_required()
def create_discussion(project_id):
    me = str(get_jwt_identity())
    data = request.get_json()
    title = data.get("title", "").strip()
    body = data.get("body", "").strip()
    category = data.get("category", "General")

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if category not in CATEGORIES:
        category = "General"

    # get author info
    try:
        user = db.users.find_one({"github_id": int(me) if me.isdigit() else me})
    except Exception:
        user = None

    doc = {
        "project_id": project_id,
        "title": title,
        "body": body,
        "category": category,
        "status": "open",
        "pinned": False,
        "author_id": me,
        "author_username": user.get("username", me) if user else me,
        "author_avatar": user.get("avatar") if user else None,
        "likes": 0,
        "liked_by": [],
        "reply_count": 0,
        "participants": [me],
        "created_at": datetime.utcnow(),
    }
    result = db.discussions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify(serialize_discussion(doc, me, 0)), 201


# ── GET /api/discussions/<project_id>/<discussion_id> ────────────────────────
@discussions_bp.route("/<project_id>/<discussion_id>", methods=["GET"])
@jwt_required()
def get_discussion(project_id, discussion_id):
    me = str(get_jwt_identity())
    try:
        d = db.discussions.find_one({"_id": ObjectId(discussion_id)})
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    if not d:
        return jsonify({"error": "Not found"}), 404

    replies = list(
        db.discussion_replies.find({"discussion_id": discussion_id}).sort("created_at", 1)
    )
    return jsonify({
        "discussion": serialize_discussion(d, me, len(replies)),
        "replies": [serialize_reply(r, me) for r in replies],
    }), 200


# ── POST /api/discussions/<project_id>/<discussion_id>/reply ─────────────────
@discussions_bp.route("/<project_id>/<discussion_id>/reply", methods=["POST"])
@jwt_required()
def add_reply(project_id, discussion_id):
    me = str(get_jwt_identity())
    data = request.get_json()
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Reply text required"}), 400

    try:
        user = db.users.find_one({"github_id": int(me) if me.isdigit() else me})
    except Exception:
        user = None

    doc = {
        "discussion_id": discussion_id,
        "project_id": project_id,
        "text": text,
        "author_id": me,
        "author_username": user.get("username", me) if user else me,
        "author_avatar": user.get("avatar") if user else None,
        "likes": 0,
        "liked_by": [],
        "is_accepted": False,
        "created_at": datetime.utcnow(),
    }
    result = db.discussion_replies.insert_one(doc)
    doc["_id"] = result.inserted_id

    # update participant list + reply count
    db.discussions.update_one(
        {"_id": ObjectId(discussion_id)},
        {
            "$addToSet": {"participants": me},
            "$inc": {"reply_count": 1},
        }
    )
    return jsonify(serialize_reply(doc, me)), 201


# ── PUT /api/discussions/<discussion_id>/like ─────────────────────────────────
@discussions_bp.route("/<discussion_id>/like", methods=["PUT"])
@jwt_required()
def like_discussion(discussion_id):
    me = str(get_jwt_identity())
    try:
        d = db.discussions.find_one({"_id": ObjectId(discussion_id)})
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    if not d:
        return jsonify({"error": "Not found"}), 404

    already = str(me) in [str(x) for x in d.get("liked_by", [])]
    if already:
        db.discussions.update_one(
            {"_id": ObjectId(discussion_id)},
            {"$pull": {"liked_by": me}, "$inc": {"likes": -1}}
        )
        liked = False
    else:
        db.discussions.update_one(
            {"_id": ObjectId(discussion_id)},
            {"$addToSet": {"liked_by": me}, "$inc": {"likes": 1}}
        )
        liked = True

    updated = db.discussions.find_one({"_id": ObjectId(discussion_id)})
    return jsonify({"likes": updated["likes"], "liked": liked}), 200


# ── PUT /api/discussions/reply/<reply_id>/like ───────────────────────────────
@discussions_bp.route("/reply/<reply_id>/like", methods=["PUT"])
@jwt_required()
def like_reply(reply_id):
    me = str(get_jwt_identity())
    try:
        r = db.discussion_replies.find_one({"_id": ObjectId(reply_id)})
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    if not r:
        return jsonify({"error": "Not found"}), 404

    already = str(me) in [str(x) for x in r.get("liked_by", [])]
    if already:
        db.discussion_replies.update_one(
            {"_id": ObjectId(reply_id)},
            {"$pull": {"liked_by": me}, "$inc": {"likes": -1}}
        )
        liked = False
    else:
        db.discussion_replies.update_one(
            {"_id": ObjectId(reply_id)},
            {"$addToSet": {"liked_by": me}, "$inc": {"likes": 1}}
        )
        liked = True

    updated = db.discussion_replies.find_one({"_id": ObjectId(reply_id)})
    return jsonify({"likes": updated["likes"], "liked": liked}), 200


# ── PUT /api/discussions/<discussion_id>/accept/<reply_id> ───────────────────
@discussions_bp.route("/<discussion_id>/accept/<reply_id>", methods=["PUT"])
@jwt_required()
def accept_reply(discussion_id, reply_id):
    me = str(get_jwt_identity())
    try:
        d = db.discussions.find_one({"_id": ObjectId(discussion_id)})
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    if not d:
        return jsonify({"error": "Not found"}), 404
    if str(d.get("author_id")) != me:
        return jsonify({"error": "Only the discussion author can accept an answer"}), 403

    # unmark all replies first
    db.discussion_replies.update_many(
        {"discussion_id": discussion_id},
        {"$set": {"is_accepted": False}}
    )
    # mark this one
    db.discussion_replies.update_one(
        {"_id": ObjectId(reply_id)},
        {"$set": {"is_accepted": True}}
    )
    # mark discussion as answered
    db.discussions.update_one(
        {"_id": ObjectId(discussion_id)},
        {"$set": {"status": "answered"}}
    )
    return jsonify({"ok": True}), 200


# ── PUT /api/discussions/<discussion_id>/pin ──────────────────────────────────
@discussions_bp.route("/<discussion_id>/pin", methods=["PUT"])
@jwt_required()
def pin_discussion(discussion_id):
    me = str(get_jwt_identity())
    try:
        d = db.discussions.find_one({"_id": ObjectId(discussion_id)})
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    if not d:
        return jsonify({"error": "Not found"}), 404

    # check project ownership
    project = db.projects.find_one({"_id": ObjectId(d["project_id"])}) if ObjectId.is_valid(d["project_id"]) else None
    if not project or str(project.get("owner_github_id")) != me:
        return jsonify({"error": "Only project owner can pin"}), 403

    new_pinned = not d.get("pinned", False)
    db.discussions.update_one(
        {"_id": ObjectId(discussion_id)},
        {"$set": {"pinned": new_pinned}}
    )
    return jsonify({"pinned": new_pinned}), 200


# ── DELETE /api/discussions/<discussion_id> ───────────────────────────────────
@discussions_bp.route("/<discussion_id>", methods=["DELETE"])
@jwt_required()
def delete_discussion(discussion_id):
    me = str(get_jwt_identity())
    try:
        d = db.discussions.find_one({"_id": ObjectId(discussion_id)})
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    if not d:
        return jsonify({"error": "Not found"}), 404
    if str(d.get("author_id")) != me:
        return jsonify({"error": "Forbidden"}), 403

    db.discussions.delete_one({"_id": ObjectId(discussion_id)})
    db.discussion_replies.delete_many({"discussion_id": discussion_id})
    return jsonify({"ok": True}), 200