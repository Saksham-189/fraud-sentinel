import os
import json
from datetime import datetime
import logging
from api.database import db, get_connection
from core.llm_engine import analyze_feedback_with_llm
logger = logging.getLogger(__name__)
def _safe_json_load(data):
    try:
        return json.loads(data) if data else None
    except (json.JSONDecodeError, TypeError) as exc:
        logger.warning("Corrupt JSON in DB row: %s", exc)
        return None
_CFG_JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "dynamic_config.json")
_WEIGHTS_JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "dynamic_weights.json")
def _seed_dynamic_config_from_json_if_needed():
    if not os.path.exists(_CFG_JSON_PATH):
        return
    try:
        with open(_CFG_JSON_PATH, "r") as f:
            cfg = json.load(f)
    except Exception:
        return
    if not isinstance(cfg, dict) or not cfg:
        return
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS n FROM dynamic_config")
        if (cur.fetchone()["n"] or 0) > 0:
            return
        now = datetime.now().isoformat()
        for k, v in cfg.items():
            cur.execute(
                "INSERT OR REPLACE INTO dynamic_config (key, value, updated_at) VALUES (?, ?, ?)",
                (str(k), json.dumps(v), now),
            )
def _seed_dynamic_weights_from_json_if_needed():
    if not os.path.exists(_WEIGHTS_JSON_PATH):
        return
    try:
        with open(_WEIGHTS_JSON_PATH, "r") as f:
            w = json.load(f)
    except Exception:
        return
    if not isinstance(w, dict) or not w:
        return
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS n FROM dynamic_weights")
        if (cur.fetchone()["n"] or 0) > 0:
            return
        now = datetime.now().isoformat()
        for k, v in w.items():
            try:
                fv = float(v)
            except Exception:
                continue
            cur.execute(
                "INSERT OR REPLACE INTO dynamic_weights (key, value, updated_at) VALUES (?, ?, ?)",
                (str(k), fv, now),
            )
def get_dynamic_config(default: dict | None = None) -> dict:
    _seed_dynamic_config_from_json_if_needed()
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT key, value FROM dynamic_config")
        rows = cur.fetchall()
    if not rows:
        return default or {"high_risk_threshold": 0.55, "medium_risk_threshold": 0.30}
    out: dict = {}
    for r in rows:
        val = _safe_json_load(r["value"])
        out[r["key"]] = val if val is not None else r["value"]
    return out
def set_dynamic_config(cfg: dict) -> dict:
    if not isinstance(cfg, dict):
        return cfg
    now = datetime.now().isoformat()
    with db() as conn:
        cur = conn.cursor()
        for k, v in cfg.items():
            cur.execute(
                "INSERT OR REPLACE INTO dynamic_config (key, value, updated_at) VALUES (?, ?, ?)",
                (str(k), json.dumps(v), now),
            )
    return cfg
def get_dynamic_weights(default: dict | None = None) -> dict:
    _seed_dynamic_weights_from_json_if_needed()
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT key, value FROM dynamic_weights")
        rows = cur.fetchall()
    if not rows:
        return default or {}
    return {r["key"]: float(r["value"]) for r in rows}
def set_dynamic_weights(weights: dict) -> dict:
    if not isinstance(weights, dict):
        return weights
    now = datetime.now().isoformat()
    with db() as conn:
        cur = conn.cursor()
        for k, v in weights.items():
            try:
                fv = float(v)
            except Exception:
                continue
            cur.execute(
                "INSERT OR REPLACE INTO dynamic_weights (key, value, updated_at) VALUES (?, ?, ?)",
                (str(k), fv, now),
            )
    return weights
def save_feedback(data: dict):
    now = datetime.now().isoformat()
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO feedback (conversation_id, user_id, is_correct, reason, created_at) VALUES (?, ?, ?, ?, ?)", (
            data.get("conversation_id"),
            data.get("user_id"),
            data.get("is_correct"),
            data.get("reason"),
            now
        ))
        cursor.execute("SELECT COUNT(*) AS n FROM feedback")
        total = cursor.fetchone()["n"]
    try:
        cfg = get_dynamic_config()
        last_update = cfg.get("last_weight_update")
        cooldown_passed = True
        if last_update:
            last_dt = datetime.fromisoformat(last_update)
            hours_diff = (datetime.now() - last_dt).total_seconds() / 3600
            if hours_diff < 1:
                cooldown_passed = False
        if total >= 5 and cooldown_passed:
            update_behavior_weights()
            cfg["last_weight_update"] = now
            set_dynamic_config(cfg)
    except Exception as e:
        logger.error(f"[AUTO-UPDATE ERROR] {e}")
def analyze_feedback():
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_correct, reason FROM feedback")
        rows = cursor.fetchall()
    if not rows:
        return None
    false_positives = 0
    false_negatives = 0
    for row in rows:
        if not row["is_correct"]:
            reason = row["reason"]
            if reason == "false_positive":
                false_positives += 1
            elif reason == "missed_fraud":
                false_negatives += 1
    return {
        "false_positives": false_positives,
        "false_negatives": false_negatives,
        "total": len(rows)
    }
def update_thresholds():
    pass
def update_behavior_weights():
    stats = analyze_feedback()
    if not stats or stats["total"] < 5:
        return "Not enough data"
    weights = get_dynamic_weights()
    if not weights:
        weights = {
            "credential_intent": 0.35,
            "urgency": 0.20,
            "authority": 0.20,
            "fear": 0.20,
            "link_risk": 0.05,
        }
    old_weights = weights.copy()
    if stats["false_negatives"] > stats["false_positives"]:
        weights["credential_intent"] += 0.02
        weights["urgency"] += 0.01
    elif stats["false_positives"] > stats["false_negatives"]:
        weights["urgency"] -= 0.01
        weights["fear"] -= 0.01
    for k in weights:
        if weights[k] > old_weights[k] + 0.02:
            weights[k] = old_weights[k] + 0.02
        if weights[k] < old_weights[k] - 0.02:
            weights[k] = old_weights[k] - 0.02
        weights[k] = round(min(max(weights[k], 0.01), 0.6), 3)
    total = sum(weights.values())
    if total > 0:
        for k in weights:
            weights[k] = round(weights[k] / total, 3)
    now = datetime.now().isoformat()
    with db() as conn:
        cursor = conn.cursor()
        for k, v in weights.items():
            cursor.execute(
                "INSERT OR REPLACE INTO dynamic_weights (key, value, updated_at) VALUES (?, ?, ?)",
                (str(k), float(v), now),
            )
        cursor.execute("INSERT INTO weight_history (old_weights, new_weights, timestamp, reason) VALUES (?, ?, ?, ?)", (
            json.dumps(old_weights),
            json.dumps(weights),
            now,
            "auto_update_from_feedback",
        ))
    return weights
def log_weight_history(old_weights: dict, new_weights: dict, reason: str):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO weight_history (old_weights, new_weights, timestamp, reason) VALUES (?, ?, ?, ?)", (
            json.dumps(old_weights),
            json.dumps(new_weights),
            datetime.now().isoformat(),
            reason,
        ))
def rollback_weights(steps: int = 1):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT old_weights FROM weight_history ORDER BY id DESC LIMIT ?",
            (steps,)
        )
        rows = cursor.fetchall()
    if not rows:
        return "No history found"
    if len(rows) < steps:
        return "Not enough history to rollback"
    target_row = rows[-1]
    previous_weights = _safe_json_load(target_row["old_weights"]) or {}
    set_dynamic_weights(previous_weights)
    return {
        "status": "rollback successful",
        "restored_weights": previous_weights
    }
def detect_weight_drift(threshold: float = 0.15):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT new_weights FROM weight_history ORDER BY id DESC LIMIT 2"
        )
        rows = cursor.fetchall()
    if not rows:
        return {"status": "no data"}
    if len(rows) < 2:
        return {"status": "not enough history"}
    last = _safe_json_load(rows[0]["new_weights"]) or {}
    prev = _safe_json_load(rows[1]["new_weights"]) or {}
    drift = {}
    for k in last:
        diff = abs(last[k] - prev.get(k, 0.0))
        drift[k] = round(diff, 3)
    max_drift = max(drift.values()) if drift else 0.0
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS n FROM weight_history")
        total_entries = cursor.fetchone()["n"]
    return {
        "drift_per_feature": drift,
        "max_drift": max_drift,
        "unstable": max_drift > threshold and total_entries > 3
    }