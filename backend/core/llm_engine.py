def generate_llm_explanation(result: dict) -> str:
    risk_level = result.get("final_risk_level", result.get("behavior_level", "UNKNOWN"))
    messages = result.get("messages_analysis", [])
    if not messages and "text" in result:
        text = result["text"]
    elif messages:
        text = messages[-1].get("text", "")
    else:
        text = "Unknown text"
    risk_level = risk_level.upper()
    if "HIGH" in risk_level:
        return f"The system identified HIGH RISK signals. The content '{text}' strongly indicates an attempt to solicit sensitive information, exploit authority, or create false urgency."
    elif "MODERATE" in risk_level or "MEDIUM" in risk_level:
        return f"The system identified MODERATE RISK signals. The content '{text}' contains suspicious elements that warrant caution."
    else:
        return f"The system identified LOW RISK signals. The content '{text}' appears to be standard, non-malicious communication."
def query_llm(prompt: str) -> str:
    if "false_positives" in prompt.lower() or "overestimated" in prompt.lower():
        return "- decrease: urgency, fear"
    elif "false_negatives" in prompt.lower() or "underestimated" in prompt.lower():
        return "- increase: credential_intent"
    return "LLM analysis not configured."
def analyze_feedback_with_llm(feedback_data: list) -> str:
    try:
        sample = feedback_data[-5:]  # last 5 entries
        text_block = "\n".join(
            [f"Text: {d['text']} | Predicted: {d['predicted_label']} | Actual: {d['correct_label']}"
             for d in sample]
        )
        prompt = f
        return query_llm(prompt)
    except Exception as e:
        return ""