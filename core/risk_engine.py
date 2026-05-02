from config.config import (
    FINAL_SCORE_WEIGHTS, STAGE_WEIGHTS,
    HIGH_RISK_THRESHOLD, MEDIUM_RISK_THRESHOLD,
    USE_LLM_REASONING, LLM_INVOKE_CONDITIONS,
)
def compute_final_score(ml_prob: float, behavior: float,
                        weighted_risk: float, stage_risk: float) -> dict:
    w = FINAL_SCORE_WEIGHTS
    components = {
        "ml_probability":    ml_prob     * w["ml_probability"],
        "behavior_score":    behavior    * w["behavior_score"],
        "conversation_risk": weighted_risk * w["conversation_risk"],
        "lifecycle_stage":   stage_risk  * w["lifecycle_stage"],
    }
    total = sum(components.values())
    return {
        "score": round(min(total, 1.0), 4),
        "decomposition": {k: round(v, 4) for k, v in components.items()}
    }
def classify_risk(score: float) -> str:
    if score >= HIGH_RISK_THRESHOLD:
        return "HIGH RISK"
    elif score >= MEDIUM_RISK_THRESHOLD:
        return "MEDIUM RISK"
    else:
        return "LOW RISK"
def compute_confidence(results: list, ml_prob: float,
                       behavior_avg: float, stage_risk: float) -> float:
    if not results:
        return 0.3
    ml_behavior_delta = abs(ml_prob - behavior_avg)
    scores = [r.get("behavior_score", 0.0) for r in results]
    if len(scores) > 1:
        score_range = max(scores) - min(scores)
        score_std = (sum((s - sum(scores) / len(scores)) ** 2
                         for s in scores) / len(scores)) ** 0.5
    else:
        score_range = 0.0
        score_std = 0.0
    confidence = 0.75
    confidence -= ml_behavior_delta * 0.3  # Max -0.3 penalty
    confidence -= score_std * 0.2          # Max ~-0.15 penalty
    if ml_behavior_delta < 0.15 and score_range < 0.3:
        confidence += 0.10
    avg_signal = (ml_prob + behavior_avg) / 2
    if avg_signal > 0.8 or avg_signal < 0.15:
        confidence += 0.08
    if (stage_risk >= 0.7 and behavior_avg >= 0.5) or \
       (stage_risk <= 0.1 and behavior_avg <= 0.2):
        confidence += 0.05
    return round(max(0.30, min(confidence, 0.98)), 3)
def detect_anomalies(ml_prob: float, behavior_avg: float,
                     stage_risk: float) -> list:
    anomalies = []
    if ml_prob < 0.3 and behavior_avg > 0.6:
        anomalies.append(
            "ML model classifies as safe but behavioral signals indicate "
            "high risk — possible novel fraud pattern not in training data"
        )
    if ml_prob > 0.7 and behavior_avg < 0.25:
        anomalies.append(
            "ML model classifies as fraud but behavioral signals are weak — "
            "possible false positive, consider message context"
        )
    if stage_risk >= 0.7 and behavior_avg < 0.3:
        anomalies.append(
            "Lifecycle reached advanced stage but individual message risk "
            "is low — may be subtle social engineering"
        )
    return anomalies
def generate_reasoning(results: list, lifecycle: dict,
                       trend: str, spike: bool,
                       decomposition: dict = None,
                       anomalies: list = None) -> str:
    reasons = []
    stage = lifecycle.get("current_stage", "normal")
    max_stage = lifecycle.get("max_stage", "normal")
    pattern = lifecycle.get("pattern", {})
    if max_stage == "attack":
        reasons.append("Conversation reached ATTACK stage — direct credential/data request detected")
    elif max_stage == "escalation":
        reasons.append("Conversation reached ESCALATION stage — urgency and pressure tactics detected")
    elif max_stage == "incubation":
        reasons.append("Authority impersonation phase detected")
    pattern_name = pattern.get("pattern_name", "benign")
    if pattern_name in ("classic_fraud", "fast_fraud", "blitz_fraud"):
        reasons.append(f"Matches known fraud pattern: {pattern.get('description', '')}")
    has_credential = False
    has_link = False
    has_fear = False
    has_authority = False
    has_urgency = False
    for r in results:
        f = r.get("features", {})
        if f.get("credential_intent", 0) >= 0.7:
            has_credential = True
        if f.get("link_risk", 0) >= 0.5:
            has_link = True
        if f.get("fear", 0) >= 0.5:
            has_fear = True
        if f.get("authority", 0) >= 0.5:
            has_authority = True
        if f.get("urgency", 0) >= 0.5:
            has_urgency = True
    if has_credential:
        reasons.append("Credential/OTP request detected")
    if has_link:
        reasons.append("Suspicious link detected")
    if has_fear:
        reasons.append("Fear/threat language present")
    if has_authority:
        reasons.append("Authority impersonation detected")
    if has_urgency:
        reasons.append("Strong urgency pressure applied")
    if trend == "increasing risk":
        reasons.append("Risk increases progressively over conversation")
    if spike:
        reasons.append("Sudden risk escalation detected between messages")
    if anomalies:
        for a in anomalies:
            reasons.append(f"⚠ {a}")
    if decomposition:
        top_contributor = max(decomposition.items(), key=lambda x: x[1])
        reasons.append(f"Primary risk driver: {top_contributor[0]} ({top_contributor[1]:.3f})")
    if not reasons:
        return "No strong fraud indicators detected"
    return "; ".join(reasons)
def _should_invoke_llm(ml_prob: float, behavior_avg: float,
                       conversation_length: int) -> bool:
    if not USE_LLM_REASONING:
        return False
    conditions = LLM_INVOKE_CONDITIONS
    if conversation_length < conditions.get("min_conversation_length", 3):
        return False
    delta = abs(ml_prob - behavior_avg)
    if delta >= conditions.get("signal_disagreement_threshold", 0.30):
        return True
    avg_score = (ml_prob + behavior_avg) / 2
    amb_range = conditions.get("ambiguous_score_range", (0.35, 0.65))
    if amb_range[0] <= avg_score <= amb_range[1]:
        return True
    return False
def _invoke_llm_reasoning(conversation_text: str, analysis_context: dict) -> str:
    return ""  # Placeholder until Ollama is configured
def final_risk_decision(analysis: dict) -> dict:
    results = analysis.get("messages_analysis", [])
    if not results:
        return {
            "final_score": 0.0,
            "risk_level": "LOW RISK",
            "confidence": 0.3,
            "reasoning": "No messages to analyze",
            "decomposition": {},
            "anomalies": [],
        }
    ml_avg = sum(r.get("fraud_probability", 0.0) for r in results) / len(results)
    behavior_avg = sum(r.get("behavior_score", 0.0) for r in results) / len(results)
    weighted_risk = analysis.get("risk_summary", {}).get("weighted_risk", 0.0)
    lifecycle = analysis.get("lifecycle", {})
    stage_risk = lifecycle.get("stage_risk_weight", 0.0)
    score_result = compute_final_score(
        ml_prob=ml_avg,
        behavior=behavior_avg,
        weighted_risk=weighted_risk,
        stage_risk=stage_risk
    )
    score = score_result["score"]
    decomposition = score_result["decomposition"]
    peak_risk = analysis.get("risk_summary", {}).get("peak_risk", 0.0)
    if peak_risk >= 0.85 and score < HIGH_RISK_THRESHOLD:
        score = max(score, HIGH_RISK_THRESHOLD)
    if lifecycle.get("max_stage") == "attack" and score < MEDIUM_RISK_THRESHOLD:
        score = max(score, MEDIUM_RISK_THRESHOLD + 0.05)
    level = classify_risk(score)
    confidence = compute_confidence(results, ml_avg, behavior_avg, stage_risk)
    anomalies = detect_anomalies(ml_avg, behavior_avg, stage_risk)
    reasoning = generate_reasoning(
        results, lifecycle,
        analysis.get("trend", "stable"),
        analysis.get("sudden_spike", False),
        decomposition, anomalies
    )
    llm_reasoning = ""
    if _should_invoke_llm(ml_avg, behavior_avg, len(results)):
        conversation_text = "\n".join(r.get("text", "") for r in results)
        llm_reasoning = _invoke_llm_reasoning(conversation_text, {
            "ml_avg": ml_avg,
            "behavior_avg": behavior_avg,
            "stage": lifecycle.get("current_stage", "normal"),
            "level": level,
        })
    result = {
        "final_score": round(score, 4),
        "risk_level": level,
        "confidence": confidence,
        "reasoning": reasoning,
        "decomposition": decomposition,
        "anomalies": anomalies,
    }
    if llm_reasoning:
        result["llm_reasoning"] = llm_reasoning
    return result
from config.dynamic_state import load_dynamic_config