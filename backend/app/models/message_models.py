# server/models/message_models.py
"""
MongoDB schema definitions (using PyMongo directly — no ODM).

Collections:
  messages       – individual chat messages
  conversations  – denormalised summary per (user_id, other_id) pair

Indexes to create once on startup (add to your app factory):

    db.messages.create_index([("from_id", 1), ("to_id", 1), ("created_at", 1)])
    db.messages.create_index([("to_id", 1), ("status", 1)])
    db.conversations.create_index([("user_id", 1), ("other_id", 1)], unique=True)
    db.conversations.create_index([("user_id", 1), ("last_time", -1)])
"""

from datetime import datetime


# ── Message document ─────────────────────────────────────────────────────────
MESSAGE_SCHEMA = {
    # "_id"       : ObjectId  (auto)
    "from_id":    str,        # github_id of sender
    "to_id":      str,        # github_id of recipient
    "text":       str,        # plain text body (may be empty if attachment only)
    "status":     str,        # "sent" | "delivered" | "seen"
    "attachment": dict,       # None  OR  { url, mime, name }
    # attachment sub-document:
    #   url  : str  – relative or absolute URL to the file
    #   mime : str  – MIME type e.g. "image/jpeg", "application/pdf"
    #   name : str  – original filename
    "reply_to":   dict,       # None  OR  { id, text }
    # reply_to sub-document:
    #   id   : str  – _id of the parent message
    #   text : str  – first N chars of parent text (preview)
    "created_at": datetime,   # UTC timestamp
}


# ── Conversation summary document ────────────────────────────────────────────
CONVERSATION_SCHEMA = {
    # "_id"       : ObjectId  (auto)
    "user_id":    str,        # github_id of the owning user
    "other_id":   str,        # github_id of the other party
    "last_text":  str,        # preview of the most recent message
    "last_time":  datetime,   # UTC timestamp of most recent message
    # unread_count could be added here if needed
}


def build_message(from_id, to_id, text="", attachment=None, reply_to=None):
    """Helper to build a well-formed message document dict."""
    return {
        "from_id":    from_id,
        "to_id":      to_id,
        "text":       text or "",
        "status":     "sent",
        "attachment": attachment,   # { url, mime, name } or None
        "reply_to":   reply_to,     # { id, text } or None
        "created_at": datetime.utcnow(),
    }


def build_conversation_summary(user_id, other_id, last_text="", last_time=None):
    """Helper to build / refresh a conversation summary document."""
    return {
        "user_id":   user_id,
        "other_id":  other_id,
        "last_text": last_text,
        "last_time": last_time or datetime.utcnow(),
    }