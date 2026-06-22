from ..extensions import db
from datetime import datetime, timezone


def log_activity(github_id, username, activity_type, message, metadata=None):
    db.activities.insert_one({
        "user_id": int(github_id),
        "username": username,
        "type": activity_type,
        "message": message,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc)
    })


def get_user_activity(github_id, limit=20):
    cursor = db.activities.find(
        {"user_id": int(github_id)},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit)
    activities = []
    for doc in cursor:
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        activities.append(doc)
    return activities