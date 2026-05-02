import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from config.config import SPIKE_THRESHOLD, SPIKE_MIN_ABSOLUTE, TREND_THRESHOLD
from core.lifecycle_engine import lifecycle_analysis
from core.risk_engine import final_risk_decision
from models.predict import predict_message
def analyze_conversation(conversation: dict) -> list:
    results = []
    prev_text = None
    for msg in conversation.get("messages", []):
        text = msg.get("text", "").strip()
        if not text:
            continue
        prediction = predict_message(text, prev_text=prev_text)
        results.append({
            "text":              text,
            "fraud_probability": prediction.get("fraud_probability", 0.0),
            "lr_probability":    prediction.get("lr_probability", 0.0),
            "bert_probability":  prediction.get("bert_probability", None),
            "behavior_score":    prediction.get("behavior_score",    0.0),
            "behavior_level":    prediction.get("behavior_level",    "LOW RISK"),
            "features":          prediction.get("features",          {}),
        })
        prev_text = text
    return results
def detect_trend(results: list) -> str:
    if len(results) < 2:
        return "insufficient data"
    scores = [
        0.5 * r.get("behavior_score", 0.0) + 0.5 * r.get("fraud_probability", 0.0)
        for r in results
    ]
    mid = max(len(scores) // 2, 1)
    first_half_avg  = sum(scores[:mid]) / mid
    second_half_avg = sum(scores[mid:]) / max(len(scores) - mid, 1)
    delta = second_half_avg - first_half_avg
    if delta > TREND_THRESHOLD:
        return "increasing risk"
    elif delta < -TREND_THRESHOLD:
        return "decreasing risk"
    else:
        return "stable"
def detect_spike(results: list) -> bool:
    scores = [
        0.5 * r.get("behavior_score", 0.0) + 0.5 * r.get("fraud_probability", 0.0)
        for r in results
    ]
    for i in range(1, len(scores)):
        delta = scores[i] - scores[i - 1]
        if delta >= SPIKE_THRESHOLD and scores[i] >= SPIKE_MIN_ABSOLUTE:
            return True
    return False
def conversation_risk(results: list) -> dict:
    if not results:
        return {
            "weighted_risk": 0.0,
            "peak_risk": 0.0,
            "final_message_risk": 0.0,
            "avg_ml_probability": 0.0,
            "avg_behavior_score": 0.0,
        }
    n = len(results)
    weights      = [(i + 1) ** 2 for i in range(n)]
    total_weight = sum(weights)
    composite_scores = [
        0.45 * r.get("fraud_probability", 0.0) + 0.55 * r.get("behavior_score", 0.0)
        for r in results
    ]
    weighted_sum = sum(
        composite_scores[i] * weights[i]
        for i in range(n)
    )
    weighted_avg    = weighted_sum / total_weight
    peak            = max(composite_scores)
    final_msg_score = composite_scores[-1]
    avg_ml          = sum(r.get("fraud_probability", 0.0) for r in results) / n
    avg_behavior    = sum(r.get("behavior_score", 0.0) for r in results) / n
    return {
        "weighted_risk":      round(weighted_avg,    4),
        "peak_risk":          round(peak,            4),
        "final_message_risk": round(final_msg_score, 4),
        "avg_ml_probability": round(avg_ml,          4),
        "avg_behavior_score": round(avg_behavior,    4),
    }
def interpret_conversation(risk: dict, trend: str, spike: bool,
                           lifecycle: dict = None) -> str:
    w_risk  = risk.get("weighted_risk",      0.0)
    peak    = risk.get("peak_risk",          0.0)
    final_m = risk.get("final_message_risk", 0.0)
    max_stage = (lifecycle or {}).get("max_stage", "normal")
    if peak >= 0.75:
        return "HIGH RISK"
    if max_stage in ("attack", "escalation") and w_risk > 0.25:
        return "HIGH RISK"
    if spike and w_risk > 0.30:
        return "HIGH RISK"
    if w_risk >= 0.55:
        return "HIGH RISK"
    if final_m >= 0.65:
        return "HIGH RISK"
    if trend == "increasing risk" and w_risk >= 0.25:
        return "MEDIUM RISK"
    if w_risk >= 0.30:
        return "MEDIUM RISK"
    if max_stage in ("incubation", "escalation"):
        return "MEDIUM RISK"
    return "LOW RISK"
def generate_explanation(results: list, trend: str, spike: bool,
                         level: str, lifecycle: dict = None) -> str:
    parts = []
    if spike:
        parts.append("sudden escalation detected between messages")
    if trend == "increasing risk":
        parts.append("risk increases progressively across the conversation")
    if lifecycle:
        pattern = lifecycle.get("pattern", {})
        pattern_name = pattern.get("pattern_name", "benign")
        if pattern_name in ("classic_fraud", "fast_fraud", "blitz_fraud"):
            parts.append(f"matches {pattern_name.replace('_', ' ')} pattern")
        max_stage = lifecycle.get("max_stage", "normal")
        if max_stage in ("attack", "escalation"):
            parts.append(f"conversation reached {max_stage} stage")
    has_signals = {
        "credential/OTP request": False,
        "fear/threat language": False,
        "authority impersonation": False,
        "strong urgency pressure": False,
        "suspicious link": False,
    }
    for r in results:
        feats = r.get("features", {})
        if feats.get("credential_intent", 0) >= 0.6:
            has_signals["credential/OTP request"] = True
        if feats.get("fear", 0) >= 0.5:
            has_signals["fear/threat language"] = True
        if feats.get("authority", 0) >= 0.5:
            has_signals["authority impersonation"] = True
        if feats.get("urgency", 0) >= 0.5:
            has_signals["strong urgency pressure"] = True
        if feats.get("link_risk", 0) >= 0.5:
            has_signals["suspicious link"] = True
    for signal, present in has_signals.items():
        if present:
            parts.append(f"{signal} detected")
    if not parts:
        return f"Conversation classified as {level} based on behavioral analysis."
    return (
        f"{level}: "
        + "; ".join(p.capitalize() for p in parts)
        + "."
    )
def full_conversation_analysis(conversation: dict) -> dict:
    results = analyze_conversation(conversation)
    if not results:
        return {"error": "No valid messages to analyze."}
    lifecycle = lifecycle_analysis(results)
    trend       = detect_trend(results)
    spike       = detect_spike(results)
    risk        = conversation_risk(results)
    level       = interpret_conversation(risk, trend, spike, lifecycle)
    explanation = generate_explanation(results, trend, spike, level, lifecycle)
    analysis = {
        "conversation_id":    conversation.get("conversation_id", "unknown"),
        "total_messages":     len(results),
        "messages_analysis":  results,
        "trend":              trend,
        "sudden_spike":       spike,
        "risk_summary":       risk,
        "final_risk_level":   level,
        "explanation":        explanation,
        "lifecycle":          lifecycle,
    }
    final = final_risk_decision(analysis)
    return {
        **analysis,
        **final,
    }
if __name__ == "__main__":
    import json
    test_conv = {
        "conversation_id": "test_001",
        "messages": [
            {"text": "Hello, we noticed unusual activity on your account."},
            {"text": "This is your bank security team contacting you."},
            {"text": "Your account will be blocked in 10 minutes."},
            {"text": "Send your OTP immediately to avoid account suspension."},
        ]
    }
    result = full_conversation_analysis(test_conv)
    print("=" * 60)
    print("CONVERSATION ANALYSIS RESULT")
    print("=" * 60)
    print(f"Trend          : {result['trend']}")
    print(f"Sudden Spike   : {result['sudden_spike']}")
    print(f"Weighted Risk  : {result['risk_summary']['weighted_risk']:.4f}")
    print(f"Peak Risk      : {result['risk_summary']['peak_risk']:.4f}")
    print(f"Final Risk     : {result['final_risk_level']}")
    print(f"Final Score    : {result.get('final_score', 'N/A')}")
    print(f"Confidence     : {result.get('confidence', 'N/A')}")
    print(f"Lifecycle      : {result['lifecycle']['current_stage']} "
          f"(max: {result['lifecycle']['max_stage']})")
    print(f"Pattern        : {result['lifecycle']['pattern']['pattern_name']}")
    print(f"Explanation    : {result['explanation']}")
    print(f"Reasoning      : {result.get('reasoning', 'N/A')}")
    print("\nPer-Message Scores:")
    for i, m in enumerate(result["messages_analysis"]):
        stage = m.get("stage", "?")
        print(f"  [{i+1}] B-Score: {m['behavior_score']:.3f}  "
              f"| ML-Prob: {m['fraud_probability']:.3f}  "
              f"| Stage: {stage:12s}"
              f"| Level: {m['behavior_level']}")
        print(f"       Text: {m['text'][:60]}")