from datetime import datetime
import uuid
import json
import logging
from api.database import db
logger = logging.getLogger(__name__)
def _safe_json_load(data):
    try:
        return json.loads(data) if data else None
    except (json.JSONDecodeError, TypeError) as exc:
        logger.warning("Corrupt JSON in DB row: %s", exc)
        return None
def save_conversation(input_data, result, user_id):
    conv_id = str(uuid.uuid4())
    input_data["user_id"] = user_id
    input_data["source"] = "api"
    input_data["version"] = "v1"
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO conversations (id, user_id, timestamp, input, result) VALUES (?, ?, ?, ?, ?)", (
            conv_id,
            user_id,
            datetime.now().isoformat(),
            json.dumps(input_data),
            json.dumps(result)
        ))
    return conv_id
def get_conversation(conv_id: str, user_id: str):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, timestamp, input, result FROM conversations WHERE id = ? AND user_id = ?",
            (conv_id, user_id),
        )
        row = cursor.fetchone()
    if row is None:
        return None
    return {
        "id": row["id"],
        "timestamp": row["timestamp"],
        "input": _safe_json_load(row["input"]),
        "result": _safe_json_load(row["result"]),
    }
def get_all_conversations(user_id: str, limit: int = 50):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, timestamp, input, result FROM conversations WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?",
            (user_id, limit),
        )
        rows = cursor.fetchall()
    out = []
    for r in rows:
        out.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "input": _safe_json_load(r["input"]),
            "result": _safe_json_load(r["result"]),
        })
    return out
def append_to_conversation(conv_id: str, new_message: dict, result: dict, user_id: str):
    record = get_conversation(conv_id, user_id)
    if record is None:
        return None
    conv_input = record.get("input") or {}
    messages = list(conv_input.get("messages") or [])   # safe copy
    messages.append(new_message)
    conv_input["messages"] = messages
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE conversations SET input = ?, result = ? WHERE id = ?",
            (json.dumps(conv_input), json.dumps(result), conv_id),
        )
    record["input"] = conv_input
    record["result"] = result
    return record
def delete_conversation(conv_id: str, user_id: str):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM conversations WHERE id = ? AND user_id = ?",
            (conv_id, user_id)
        )
        return cursor.rowcount > 0