import logging
import re
import json
import os
from config.config import (
    LR_WEIGHT,
    BERT_WEIGHT,
    BEHAVIOR_WEIGHT,
    SAFE_RISK_THRESHOLD,
    HIGH_RISK_THRESHOLD,
    BENIGN_SHORT_MIN_PROBABILITY,
    BENIGN_SHORT_MAX_PROBABILITY,
    NO_BEHAVIOR_SCORE_CAP,
    NO_EVIDENCE_SCORE_CAP,
    WEAK_EVIDENCE_SCORE_CAP,
)
from data_pipeline.data_cleaner import clean_text
from core.feature_extractor import extract_features, behavior_score
from models.predict import get_lr_prediction
from models.transformer_model import predict_transformer
from core.llm_engine import generate_llm_explanation
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def _load_runtime_calibration() -> dict:
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "config", "calibration.json"))
    defaults = {
        "safe_threshold": SAFE_RISK_THRESHOLD,
        "high_threshold": HIGH_RISK_THRESHOLD,
        "benign_short_min_probability": BENIGN_SHORT_MIN_PROBABILITY,
        "benign_short_max_probability": BENIGN_SHORT_MAX_PROBABILITY,
        "no_behavior_score_cap": NO_BEHAVIOR_SCORE_CAP,
        "no_evidence_score_cap": NO_EVIDENCE_SCORE_CAP,
        "weak_evidence_score_cap": WEAK_EVIDENCE_SCORE_CAP,
    }
    if not os.path.exists(path):
        return defaults
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return {**defaults, **{key: value for key, value in data.items() if isinstance(value, (int, float))}}
    except Exception as exc:
        logging.warning(f"[pipeline] Could not load calibration file: {exc}")
        return defaults


CALIBRATION = _load_runtime_calibration()
SAFE_THRESHOLD = float(CALIBRATION["safe_threshold"])
HIGH_THRESHOLD = float(CALIBRATION["high_threshold"])
BENIGN_SHORT_MIN = float(CALIBRATION["benign_short_min_probability"])
BENIGN_SHORT_MAX = float(CALIBRATION["benign_short_max_probability"])
NO_BEHAVIOR_CAP = float(CALIBRATION["no_behavior_score_cap"])
NO_EVIDENCE_CAP = float(CALIBRATION["no_evidence_score_cap"])
WEAK_EVIDENCE_CAP = float(CALIBRATION["weak_evidence_score_cap"])


def get_risk_level(score: float, evidence: dict | None = None) -> str:
    evidence = evidence or {}
    if score >= HIGH_THRESHOLD and evidence.get("has_strong_evidence"):
        return "HIGH RISK"
    if score >= SAFE_THRESHOLD:
        return "MEDIUM RISK"
    return "SAFE"


def _token_count(text: str) -> int:
    return len(re.findall(r"[a-z0-9]+", text.lower()))


def _is_probable_benign_short(text: str, features: dict) -> bool:
    if _token_count(text) > 4:
        return False
    if features.get("url_present", 0.0) > 0:
        return False
    signal_values = [
        features.get("urgency", 0.0),
        features.get("authority", 0.0),
        features.get("fear", 0.0),
        features.get("credential_intent", 0.0),
        features.get("link_risk", 0.0),
        features.get("url_present", 0.0),
    ]
    return max(signal_values or [0.0]) < 0.25


def _benign_short_score(text: str) -> float:
    token_factor = min(_token_count(text), 4) / 4
    score = BENIGN_SHORT_MIN + (
        (BENIGN_SHORT_MAX - BENIGN_SHORT_MIN) * token_factor
    )
    return max(BENIGN_SHORT_MIN, min(BENIGN_SHORT_MAX, score))


def evaluate_evidence(features: dict) -> dict:
    cred = features.get("credential_intent", 0.0)
    urg = features.get("urgency", 0.0)
    fear = features.get("fear", 0.0)
    auth = features.get("authority", 0.0)
    link = features.get("link_risk", 0.0)
    url_present = features.get("url_present", 0.0)
    strong = []
    weak = []
    if cred >= 0.7:
        strong.append("credential_request")
    elif cred >= 0.35:
        weak.append("credential_language")
    if link >= 0.65 or (url_present and link >= 0.45):
        strong.append("suspicious_link")
    elif link >= 0.30 or url_present:
        weak.append("link_present")
    if urg >= 0.7:
        strong.append("high_urgency")
    elif urg >= 0.35:
        weak.append("urgency")
    if fear >= 0.7:
        strong.append("threat_or_fear")
    elif fear >= 0.35:
        weak.append("fear_language")
    if auth >= 0.7:
        strong.append("authority_impersonation")
    elif auth >= 0.35:
        weak.append("authority_language")
    if auth >= 0.5 and (cred >= 0.5 or link >= 0.5):
        strong.append("authority_plus_request")
    if urg >= 0.5 and fear >= 0.5:
        strong.append("urgent_threat_combo")
    return {
        "strong_signals": sorted(set(strong)),
        "weak_signals": sorted(set(weak)),
        "has_strong_evidence": bool(strong),
        "has_any_evidence": bool(strong or weak),
    }


def _effective_model_vote(prediction: dict) -> tuple[float, float]:
    probability = float(prediction.get("probability", 0.5))
    if prediction.get("fallback"):
        return 0.5, 0.0
    confidence = float(prediction.get("confidence", abs(probability - 0.5) * 2))
    confidence = max(0.0, min(1.0, confidence))
    effective_probability = 0.5 + ((probability - 0.5) * confidence)
    return max(0.0, min(1.0, effective_probability)), confidence


def hybrid_combine(lr_prediction: dict, bert_prediction: dict, b_score: float) -> tuple[float, dict]:
    lr_vote, lr_conf = _effective_model_vote(lr_prediction)
    bert_vote, bert_conf = _effective_model_vote(bert_prediction)
    weighted_votes = []
    if lr_conf > 0:
        weighted_votes.append((LR_WEIGHT * max(0.20, lr_conf), lr_vote))
    if bert_conf > 0:
        weighted_votes.append((BERT_WEIGHT * max(0.20, bert_conf), bert_vote))
    weighted_votes.append((BEHAVIOR_WEIGHT, b_score))
    total_w = sum(weight for weight, _ in weighted_votes) or 1.0
    final_score = sum(weight * score for weight, score in weighted_votes) / total_w
    meta = {
        "lr_effective_probability": round(lr_vote, 4),
        "lr_confidence": round(lr_conf, 4),
        "bert_effective_probability": round(bert_vote, 4),
        "bert_confidence": round(bert_conf, 4),
    }
    return max(0.0, min(1.0, final_score)), meta


def apply_score_caps(score: float, features: dict, evidence: dict, b_score: float) -> tuple[float, list[str]]:
    caps = []
    capped = score
    signal_values = [
        features.get("urgency", 0.0),
        features.get("authority", 0.0),
        features.get("fear", 0.0),
        features.get("credential_intent", 0.0),
        features.get("link_risk", 0.0),
    ]
    if max(signal_values or [0.0]) <= 0.0 and b_score <= 0.0:
        capped = min(capped, NO_BEHAVIOR_CAP)
        caps.append("no_behavior_signals")
    if not evidence.get("has_any_evidence"):
        capped = min(capped, NO_EVIDENCE_CAP)
        caps.append("no_fraud_evidence")
    elif not evidence.get("has_strong_evidence"):
        capped = min(capped, WEAK_EVIDENCE_CAP)
        caps.append("weak_evidence_only")
    if capped >= HIGH_THRESHOLD and not evidence.get("has_strong_evidence"):
        capped = min(capped, HIGH_THRESHOLD - 0.01)
        caps.append("high_risk_requires_strong_evidence")
    return max(0.0, min(1.0, capped)), caps
    return max(0.0, min(1.0, final_score))
def generate_template_explanation(features: dict, score: float, level: str, evidence: dict | None = None) -> str:
    parts = []
    if features.get("urgency", 0) > 0.5:
        parts.append("strong urgency")
    if features.get("fear", 0) > 0.5:
        parts.append("fear or threat tactics")
    if features.get("authority", 0) > 0.5:
        parts.append("authority impersonation")
    if features.get("credential_intent", 0) > 0.5:
        parts.append("requests for sensitive credentials/OTP")
    if features.get("link_risk", 0) > 0.5:
        parts.append("suspicious links")
    if not parts:
        return f"Message classified as {level} based on behavioral analysis."
    evidence = evidence or {}
    strength = "strong" if evidence.get("has_strong_evidence") else "limited"
    return f"Message classified as {level}. It contains {strength} evidence: {', '.join(parts)}."
def run_message_analysis(text: str, prev_text: str = None) -> dict:
    if not text or not text.strip():
        return {
            "text": text,
            "fraud_probability": 0.0,
            "lr_probability": 0.0,
            "bert_probability": 0.0,
            "behavior_score": 0.0,
            "behavior_level": "SAFE",
            "features": {},
            "explanation": "Empty message."
        }
    try:
        cleaned = clean_text(text)
        prev_cleaned = clean_text(prev_text) if prev_text else None
        features = extract_features(cleaned, prev_text=prev_cleaned)
        evidence = evaluate_evidence(features)
        if _is_probable_benign_short(cleaned, features):
            score = _benign_short_score(cleaned)
            return {
                "text": text,
                "fraud_probability": round(score, 4),
                "lr_probability": 0.0,
                "bert_probability": 0.0,
                "behavior_score": 0.0,
                "behavior_level": "SAFE",
                "features": features,
                "evidence": evidence,
                "guardrails": ["benign_short_message"],
                "model_fallbacks": {},
                "explanation": "Short benign message with no fraud signals."
            }
        lr_res = get_lr_prediction(cleaned)
        bert_res = predict_transformer(cleaned)
        b_score = behavior_score(features)
        raw_score, combination_meta = hybrid_combine(lr_res, bert_res, b_score)
        final_score, caps = apply_score_caps(raw_score, features, evidence, b_score)
        level = get_risk_level(final_score, evidence)
        explanation = generate_template_explanation(features, final_score, level, evidence)
        return {
            "text": text,
            "fraud_probability": round(final_score, 4),
            "raw_fraud_probability": round(raw_score, 4),
            "lr_probability": round(lr_res.get("probability", 0.5), 4),
            "bert_probability": round(bert_res.get("probability", 0.5), 4),
            "behavior_score": round(b_score, 4),
            "behavior_level": level,
            "features": features,
            "evidence": evidence,
            "guardrails": caps,
            "model_fallbacks": {
                "lr": bool(lr_res.get("fallback")),
                "bert": bool(bert_res.get("fallback")),
            },
            "combination": combination_meta,
            "explanation": explanation
        }
    except Exception as e:
        logging.error(f"[pipeline] Message analysis failed: {e}")
        return {
            "text": text,
            "fraud_probability": 0.5,
            "lr_probability": 0.5,
            "bert_probability": 0.5,
            "behavior_score": 0.5,
            "behavior_level": "UNKNOWN",
            "features": {},
            "explanation": "Analysis unavailable due to an internal error."
        }
def run_analysis_pipeline(conversation: dict) -> dict:
    try:
        messages = conversation.get("messages", [])
        if not messages:
            return {"error": "No messages found in standard format"}
        results = []
        prev = None
        for m in messages:
            text = m.get("text", "")
            res = run_message_analysis(text, prev)
            results.append(res)
            prev = text
        if not results:
            raise ValueError("No valid messages processed")
        final_msg = results[-1]
        final_score = final_msg["fraud_probability"]
        level = final_msg["behavior_level"]
        try:
            llm_explanation = generate_llm_explanation({
                "final_risk_level": level,
                "messages_analysis": results
            })
        except:
            llm_explanation = final_msg["explanation"]
        return {
            "conversation_id": conversation.get("conversation_id", "unknown"),
            "final_score": final_score,
            "final_risk_level": level,
            "fraud_probability": final_score,
            "behavior_level": level,
            "behavior_score": final_msg["behavior_score"],
            "messages_analysis": results,
            "explanation": llm_explanation,
            "llm_explanation": llm_explanation
        }
    except Exception as e:
        logging.error(f"[pipeline] Full analysis failed: {e}")
        return {
            "conversation_id": conversation.get("conversation_id", "unknown"),
            "final_score": 0.5,
            "final_risk_level": "UNKNOWN",
            "fraud_probability": 0.5,
            "behavior_level": "UNKNOWN",
            "behavior_score": 0.5,
            "messages_analysis": [],
            "explanation": "Analysis unavailable due to an internal error.",
            "llm_explanation": "Analysis unavailable."
        }
