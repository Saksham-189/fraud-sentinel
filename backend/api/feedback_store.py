import os
import json
from datetime import datetime
import logging
from database.connection import SessionLocal
from database.models import Feedback, DynamicConfig, DynamicWeight, WeightHistory

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
    
    db = SessionLocal()
    try:
        count = db.query(DynamicConfig).count()
        if count > 0:
            return
        now = datetime.now().isoformat()
        for k, v in cfg.items():
            db.merge(DynamicConfig(key=str(k), value=json.dumps(v), updated_at=now))
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding dynamic config: {e}")
    finally:
        db.close()

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
    
    db = SessionLocal()
    try:
        count = db.query(DynamicWeight).count()
        if count > 0:
            return
        now = datetime.now().isoformat()
        for k, v in w.items():
            try:
                fv = float(v)
            except Exception:
                continue
            db.merge(DynamicWeight(key=str(k), value=fv, updated_at=now))
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding dynamic weights: {e}")
    finally:
        db.close()

def get_dynamic_config(default: dict | None = None) -> dict:
    _seed_dynamic_config_from_json_if_needed()
    db = SessionLocal()
    try:
        rows = db.query(DynamicConfig).all()
        if not rows:
            return default or {"high_risk_threshold": 0.55, "medium_risk_threshold": 0.30}
        out = {}
        for r in rows:
            val = _safe_json_load(r.value)
            out[r.key] = val if val is not None else r.value
        return out
    finally:
        db.close()

def set_dynamic_config(cfg: dict) -> dict:
    if not isinstance(cfg, dict):
        return cfg
    now = datetime.now().isoformat()
    db = SessionLocal()
    try:
        for k, v in cfg.items():
            db.merge(DynamicConfig(key=str(k), value=json.dumps(v), updated_at=now))
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error setting dynamic config: {e}")
    finally:
        db.close()
    return cfg

def get_dynamic_weights(default: dict | None = None) -> dict:
    _seed_dynamic_weights_from_json_if_needed()
    db = SessionLocal()
    try:
        rows = db.query(DynamicWeight).all()
        if not rows:
            return default or {}
        return {r.key: float(r.value) for r in rows}
    finally:
        db.close()

def set_dynamic_weights(weights: dict) -> dict:
    if not isinstance(weights, dict):
        return weights
    now = datetime.now().isoformat()
    db = SessionLocal()
    try:
        for k, v in weights.items():
            try:
                fv = float(v)
            except Exception:
                continue
            db.merge(DynamicWeight(key=str(k), value=fv, updated_at=now))
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error setting dynamic weights: {e}")
    finally:
        db.close()
    return weights

def save_feedback(data: dict):
    now = datetime.now().isoformat()
    db = SessionLocal()
    try:
        new_fb = Feedback(
            conversation_id=data.get("conversation_id"),
            user_id=data.get("user_id"),
            is_correct=data.get("is_correct"),
            reason=data.get("reason"),
            created_at=now
        )
        db.add(new_fb)
        db.commit()
        
        total = db.query(Feedback).count()
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving feedback: {e}")
        return
    finally:
        db.close()
        
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
    db = SessionLocal()
    try:
        rows = db.query(Feedback).all()
        if not rows:
            return None
        false_positives = 0
        false_negatives = 0
        for row in rows:
            if not row.is_correct:
                reason = row.reason
                if reason == "false_positive":
                    false_positives += 1
                elif reason == "missed_fraud":
                    false_negatives += 1
        return {
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "total": len(rows)
        }
    finally:
        db.close()

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
    
    db = SessionLocal()
    try:
        for k, v in weights.items():
            db.merge(DynamicWeight(key=str(k), value=float(v), updated_at=now))
        
        new_hist = WeightHistory(
            old_weights=json.dumps(old_weights),
            new_weights=json.dumps(weights),
            timestamp=now,
            reason="auto_update_from_feedback"
        )
        db.add(new_hist)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating behavior weights: {e}")
    finally:
        db.close()
    return weights

def log_weight_history(old_weights: dict, new_weights: dict, reason: str):
    db = SessionLocal()
    try:
        new_hist = WeightHistory(
            old_weights=json.dumps(old_weights),
            new_weights=json.dumps(new_weights),
            timestamp=datetime.now().isoformat(),
            reason=reason
        )
        db.add(new_hist)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error logging weight history: {e}")
    finally:
        db.close()

def rollback_weights(steps: int = 1):
    db = SessionLocal()
    try:
        rows = db.query(WeightHistory).order_by(WeightHistory.id.desc()).limit(steps).all()
        if not rows:
            return "No history found"
        if len(rows) < steps:
            return "Not enough history to rollback"
        target_row = rows[-1]
        previous_weights = _safe_json_load(target_row.old_weights) or {}
        set_dynamic_weights(previous_weights)
        return {
            "status": "rollback successful",
            "restored_weights": previous_weights
        }
    finally:
        db.close()

def detect_weight_drift(threshold: float = 0.15):
    db = SessionLocal()
    try:
        rows = db.query(WeightHistory).order_by(WeightHistory.id.desc()).limit(2).all()
        if not rows:
            return {"status": "no data"}
        if len(rows) < 2:
            return {"status": "not enough history"}
        last = _safe_json_load(rows[0].new_weights) or {}
        prev = _safe_json_load(rows[1].new_weights) or {}
        drift = {}
        for k in last:
            diff = abs(last[k] - prev.get(k, 0.0))
            drift[k] = round(diff, 3)
        max_drift = max(drift.values()) if drift else 0.0
        
        total_entries = db.query(WeightHistory).count()
        
        return {
            "drift_per_feature": drift,
            "max_drift": max_drift,
            "unstable": max_drift > threshold and total_entries > 3
        }
    finally:
        db.close()