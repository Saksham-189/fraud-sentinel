from datetime import datetime
import uuid
import json
import logging
from database.connection import SessionLocal
from database.models import AnalysisHistory

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
    input_data["version"] = "v2"
    
    # 🚀 STEP 17 — SAVE ANALYSIS RESULTS (input, score, timestamp, fraud type)
    messages = input_data.get("messages", [])
    if messages:
        input_text = messages[-1].get("text", "")
    elif input_data.get("text"):
        input_text = input_data["text"]
    else:
        input_text = str(input_data)
    
    risk_score = float(result.get("fraud_probability", result.get("final_score", 0.0)))
    threat_level = str(result.get("behavior_level", result.get("risk_level", "SAFE")))
    reasons_text = result.get("explanation", result.get("reasoning", ""))
    
    db = SessionLocal()
    try:
        new_conv = AnalysisHistory(
            id=conv_id,
            user_id=user_id,
            input_text=input_text,
            risk_score=risk_score,
            threat_level=threat_level,
            reasons=json.dumps([reasons_text]),
            raw_input=json.dumps(input_data),
            raw_result=json.dumps(result),
            created_at=datetime.now().isoformat()
        )
        db.add(new_conv)
        db.commit()
        return conv_id
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving conversation: {e}")
        raise e
    finally:
        db.close()

def get_conversation(conv_id: str, user_id: str):
    db = SessionLocal()
    try:
        conv = db.query(AnalysisHistory).filter(
            AnalysisHistory.id == conv_id,
            AnalysisHistory.user_id == user_id
        ).first()
        if not conv:
            return None
        return {
            "id": conv.id,
            "timestamp": conv.created_at,
            "input": _safe_json_load(conv.raw_input),
            "result": _safe_json_load(conv.raw_result),
        }
    finally:
        db.close()

def get_all_conversations(user_id: str, limit: int = 50):
    db = SessionLocal()
    try:
        rows = db.query(AnalysisHistory).filter(
            AnalysisHistory.user_id == user_id
        ).order_by(AnalysisHistory.created_at.desc()).limit(limit).all()
        out = []
        for r in rows:
            out.append({
                "id": r.id,
                "timestamp": r.created_at,
                "input": _safe_json_load(r.raw_input),
                "result": _safe_json_load(r.raw_result),
            })
        return out
    finally:
        db.close()

def append_to_conversation(conv_id: str, new_message: dict, result: dict, user_id: str):
    record = get_conversation(conv_id, user_id)
    if record is None:
        return None
    conv_input = record.get("input") or {}
    messages = list(conv_input.get("messages") or [])   # safe copy
    messages.append(new_message)
    conv_input["messages"] = messages
    
    input_text = new_message.get("text", "")
    risk_score = float(result.get("fraud_probability", result.get("final_score", 0.0)))
    threat_level = str(result.get("behavior_level", result.get("risk_level", "SAFE")))
    reasons_text = result.get("explanation", result.get("reasoning", ""))
    
    db = SessionLocal()
    try:
        conv = db.query(AnalysisHistory).filter(
            AnalysisHistory.id == conv_id,
            AnalysisHistory.user_id == user_id
        ).first()
        if conv:
            conv.input_text = input_text
            conv.risk_score = risk_score
            conv.threat_level = threat_level
            conv.reasons = json.dumps([reasons_text])
            conv.raw_input = json.dumps(conv_input)
            conv.raw_result = json.dumps(result)
            db.commit()
        record["input"] = conv_input
        record["result"] = result
        return record
    except Exception as e:
        db.rollback()
        logger.error(f"Error appending to conversation: {e}")
        raise e
    finally:
        db.close()

def delete_conversation(conv_id: str, user_id: str):
    db = SessionLocal()
    try:
        conv = db.query(AnalysisHistory).filter(
            AnalysisHistory.id == conv_id,
            AnalysisHistory.user_id == user_id
        ).first()
        if conv:
            db.delete(conv)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting conversation: {e}")
        return False
    finally:
        db.close()