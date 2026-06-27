# backend/app/routes/messages.py
import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from bson import ObjectId
from ..extensions import db

messages_bp = Blueprint("messages", __name__)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "pdf", "docx", "zip"}
UPLOAD_FOLDER = os.path.join("static", "uploads", "messages")


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def str_id(val):
    """Always return a string so comparisons are consistent."""
    return str(val) if val is not None else None


def serialize_message(m):
    return {
        "id": str(m["_id"]),
        "from_id": str_id(m.get("from_id")),
        "to_id": str_id(m.get("to_id")),
        "text": m.get("text", ""),
        "status": m.get("status", "sent"),
        "attachment": m.get("attachment"),
        "reply_to": m.get("reply_to"),
        "created_at": m.get("created_at", datetime.utcnow()).isoformat(),
    }


# ── GET /api/messages/<other_id> ─────────────────────────────────────────────
@messages_bp.route("/<other_id>", methods=["GET"])
@jwt_required()
def get_conversation(other_id):
    me = str(get_jwt_identity())
    other_id = str(other_id)
    msgs = db.messages.find(
        {
            "$or": [
                {"from_id": me, "to_id": other_id},
                {"from_id": other_id, "to_id": me},
                # also handle int-stored ids
                {"from_id": int(me) if me.isdigit() else me, "to_id": int(other_id) if other_id.isdigit() else other_id},
                {"from_id": int(other_id) if other_id.isdigit() else other_id, "to_id": int(me) if me.isdigit() else me},
            ]
        }
    ).sort("created_at", 1)
    return jsonify([serialize_message(m) for m in msgs]), 200


# ── POST /api/messages ────────────────────────────────────────────────────────
@messages_bp.route("/", methods=["POST"])
@jwt_required()
def send_message():
    me = str(get_jwt_identity())
    data = request.get_json()
    to_id = str(data.get("to_id", ""))
    text = data.get("text", "")
    attachment = data.get("attachment")
    reply_to_id = data.get("reply_to")

    if not to_id:
        return jsonify({"error": "to_id required"}), 400

    reply_to = None
    if reply_to_id:
        try:
            parent = db.messages.find_one({"_id": ObjectId(reply_to_id)})
            if parent:
                reply_to = {"id": reply_to_id, "text": parent.get("text", "")}
        except Exception:
            pass

    doc = {
        "from_id": me,
        "to_id": to_id,
        "text": text,
        "status": "sent",
        "attachment": attachment,
        "reply_to": reply_to,
        "created_at": datetime.utcnow(),
    }
    result = db.messages.insert_one(doc)
    doc["_id"] = result.inserted_id

    for pair in [(me, to_id), (to_id, me)]:
        db.conversations.update_one(
            {"user_id": pair[0], "other_id": pair[1]},
            {
                "$set": {
                    "last_text": text or ("📎 Attachment" if attachment else ""),
                    "last_time": datetime.utcnow(),
                }
            },
            upsert=True,
        )

    return jsonify(serialize_message(doc)), 201


# ── POST /api/messages/upload ─────────────────────────────────────────────────
@messages_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_attachment():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, unique_name)
    file.save(save_path)

    mime = file.content_type or f"application/{ext}"
    url = f"/static/uploads/messages/{unique_name}"

    return jsonify({"url": url, "mime": mime, "name": secure_filename(file.filename)}), 200


# ── PUT /api/messages/read ────────────────────────────────────────────────────
@messages_bp.route("/read", methods=["PUT"])
@jwt_required()
def mark_read():
    me = str(get_jwt_identity())
    data = request.get_json()
    other_id = str(data.get("other_id", ""))
    if not other_id:
        return jsonify({"error": "other_id required"}), 400

    db.messages.update_many(
        {"from_id": other_id, "to_id": me, "status": {"$ne": "seen"}},
        {"$set": {"status": "seen"}},
    )
    return jsonify({"ok": True}), 200


# ── GET /api/messages/conversations-summary ───────────────────────────────────
@messages_bp.route("/conversations-summary", methods=["GET"])
@jwt_required()
def get_conversations_summary():
    me = str(get_jwt_identity())
    convos = list(db.conversations.find({"user_id": me}).sort("last_time", -1))
    result = []
    for c in convos:
        result.append({
            "other_id": str_id(c.get("other_id")),
            "last_text": c.get("last_text", ""),
            "last_time": c.get("last_time", datetime.utcnow()).isoformat(),
        })
    return jsonify(result), 200


# ── DELETE /api/messages/<msg_id> ─────────────────────────────────────────────
@messages_bp.route("/<msg_id>", methods=["DELETE"])
@jwt_required()
def delete_message(msg_id):
    me = str(get_jwt_identity())
    try:
        msg = db.messages.find_one({"_id": ObjectId(msg_id)})
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    if not msg:
        return jsonify({"error": "Not found"}), 404
    if str_id(msg.get("from_id")) != me:
        return jsonify({"error": "Forbidden"}), 403
    db.messages.delete_one({"_id": ObjectId(msg_id)})
    return jsonify({"ok": True}), 200