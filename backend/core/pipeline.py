import logging
from config.config import LR_WEIGHT, BERT_WEIGHT, BEHAVIOR_WEIGHT
from data_pipeline.data_cleaner import clean_text
from core.feature_extractor import extract_features, behavior_score
from models.predict import get_lr_probability
from models.transformer_model import predict_transformer
from core.llm_engine import generate_llm_explanation
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
def get_risk_level(score: float) -> str:
    if score >= 0.7:
        return "HIGH RISK"
    if score >= 0.4:
        return "MEDIUM RISK"
    return "SAFE"
def hybrid_combine(ml_prob: float, bert_prob: float, b_score: float) -> float:
    total_w = LR_WEIGHT + BERT_WEIGHT + BEHAVIOR_WEIGHT
    w_lr = LR_WEIGHT / total_w
    w_bert = BERT_WEIGHT / total_w
    w_b = BEHAVIOR_WEIGHT / total_w
    final_score = (w_lr * ml_prob) + (w_bert * bert_prob) + (w_b * b_score)
    return max(0.0, min(1.0, final_score))
def generate_template_explanation(features: dict, score: float, level: str) -> str:
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
    return f"Message classified as {level}. It contains: {', '.join(parts)}."
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
        lr_prob = get_lr_probability(cleaned)
        bert_res = predict_transformer(cleaned)
        bert_prob = bert_res.get("probability", 0.5)
        b_score = behavior_score(features)
        final_score = hybrid_combine(lr_prob, bert_prob, b_score)
        level = get_risk_level(final_score)
        explanation = generate_template_explanation(features, final_score, level)
        return {
            "text": text,
            "fraud_probability": round(final_score, 4),
            "lr_probability": round(lr_prob, 4),
            "bert_probability": round(bert_prob, 4),
            "behavior_score": round(b_score, 4),
            "behavior_level": level,
            "features": features,
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