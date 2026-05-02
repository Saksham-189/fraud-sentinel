from config.config import STAGE_ORDER, STAGE_WEIGHTS
def _stage_index(stage: str) -> int:
    try:
        return STAGE_ORDER.index(stage)
    except ValueError:
        return 0
def classify_stage(msg: dict, prev_stage: str = "normal") -> dict:
    f = msg.get("features", {})
    b_score = msg.get("behavior_score", 0.0)
    ml_prob = msg.get("fraud_probability", 0.0)
    cred = f.get("credential_intent", 0.0)
    urg  = f.get("urgency", 0.0)
    fear = f.get("fear", 0.0)
    auth = f.get("authority", 0.0)
    link = f.get("link_risk", 0.0)
    stage = "normal"
    confidence = 0.3
    if (cred >= 0.7 and b_score >= 0.3) or (cred >= 0.5 and link >= 0.5):
        stage = "attack"
        confidence = min(0.5 + cred * 0.4 + link * 0.1, 0.95)
    elif (urg >= 0.5 and fear >= 0.4) or (urg >= 0.6 and b_score >= 0.5):
        stage = "escalation"
        confidence = min(0.5 + urg * 0.3 + fear * 0.2, 0.90)
    elif auth >= 0.5 or (fear >= 0.4 and auth >= 0.3):
        stage = "incubation"
        confidence = min(0.5 + auth * 0.3 + fear * 0.1, 0.85)
    elif (auth >= 0.2 or fear >= 0.2 or b_score >= 0.15 or
          (ml_prob >= 0.55 and b_score >= 0.05)):
        stage = "infection"
        confidence = min(0.4 + b_score * 0.3, 0.75)
    prev_idx = _stage_index(prev_stage)
    curr_idx = _stage_index(stage)
    if curr_idx < prev_idx - 1:
        adjusted_idx = max(prev_idx - 1, 0)
        stage = STAGE_ORDER[adjusted_idx]
        confidence *= 0.7  # Lower confidence for adjusted stages
    if curr_idx == prev_idx + 1:
        confidence = min(confidence + 0.10, 0.95)
    elif curr_idx > prev_idx + 1:
        confidence = min(confidence + 0.05, 0.90)
    return {
        "stage": stage,
        "confidence": round(confidence, 3)
    }
def assign_stages(results: list) -> list:
    stages = []
    prev_stage = "normal"
    for msg in results:
        classification = classify_stage(msg, prev_stage)
        stage = classification["stage"]
        msg["stage"] = stage
        msg["stage_confidence"] = classification["confidence"]
        stages.append(stage)
        prev_stage = stage
    return stages
def detect_stage_flow(stages: list) -> list:
    transitions = []
    for i in range(1, len(stages)):
        if stages[i] != stages[i - 1]:
            transitions.append((stages[i - 1], stages[i]))
    return transitions
def max_stage_reached(stages: list) -> str:
    if not stages:
        return "normal"
    max_idx = max(_stage_index(s) for s in stages)
    return STAGE_ORDER[max_idx]
def final_stage(stages: list) -> str:
    if not stages:
        return "unknown"
    return stages[-1]
def detect_canonical_pattern(stages: list) -> dict:
    unique_stages = []
    for s in stages:
        if not unique_stages or s != unique_stages[-1]:
            unique_stages.append(s)
    indices = [_stage_index(s) for s in unique_stages]
    is_escalating = all(indices[i] <= indices[i + 1] for i in range(len(indices) - 1))
    max_reached = max(indices) if indices else 0
    if max_reached >= 4 and is_escalating and len(unique_stages) >= 4:
        return {
            "pattern_name": "classic_fraud",
            "match_score": 0.95,
            "description": "Classic fraud progression: infection → incubation → escalation → attack"
        }
    if max_reached >= 4 and is_escalating and len(unique_stages) >= 3:
        return {
            "pattern_name": "fast_fraud",
            "match_score": 0.85,
            "description": "Fast fraud progression with skipped stages"
        }
    if max_reached >= 4 and len(unique_stages) >= 2:
        return {
            "pattern_name": "blitz_fraud",
            "match_score": 0.75,
            "description": "Rapid fraud attempt with minimal warmup"
        }
    if max_reached >= 3 and is_escalating:
        return {
            "pattern_name": "escalation_attempt",
            "match_score": 0.60,
            "description": "Escalation pattern detected but did not reach attack stage"
        }
    if max_reached >= 2:
        return {
            "pattern_name": "suspicious_activity",
            "match_score": 0.35,
            "description": "Some suspicious stage progression detected"
        }
    return {
        "pattern_name": "benign",
        "match_score": 0.0,
        "description": "No known fraud progression pattern"
    }
def lifecycle_analysis(results: list) -> dict:
    if not results:
        return {
            "stages": [],
            "transitions": [],
            "current_stage": "unknown",
            "max_stage": "normal",
            "pattern": {
                "pattern_name": "benign",
                "match_score": 0.0,
                "description": "No messages to analyze"
            },
            "stage_risk_weight": 0.0
        }
    stages = assign_stages(results)
    transitions = detect_stage_flow(stages)
    current = final_stage(stages)
    highest = max_stage_reached(stages)
    pattern = detect_canonical_pattern(stages)
    stage_risk = STAGE_WEIGHTS.get(highest, 0.0)
    if pattern["match_score"] >= 0.7:
        stage_risk = min(stage_risk + 0.15, 1.0)
    return {
        "stages": stages,
        "transitions": transitions,
        "current_stage": current,
        "max_stage": highest,
        "pattern": pattern,
        "stage_risk_weight": round(stage_risk, 4)
    }