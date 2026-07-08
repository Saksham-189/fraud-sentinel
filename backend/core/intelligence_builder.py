import re
from typing import Any


SIGNAL_DEFINITIONS = {
    "credential_request": {
        "feature": "credential_intent",
        "label": "Credential Request",
        "reason": "The sender asks for sensitive authentication information.",
        "terms": [
            r"send\s+(?:me\s+)?(?:the\s+)?otp",
            r"share\s+(?:your\s+)?otp",
            r"enter\s+(?:your\s+)?otp",
            r"\botp\b",
            r"\bpassword\b",
            r"\bcvv\b",
            r"\bpin\b",
            r"login credentials",
            r"bank login",
        ],
        "strong_names": {"credential_request", "authority_plus_request"},
        "weak_names": {"credential_language"},
        "base_contribution": 0.40,
    },
    "urgency": {
        "feature": "urgency",
        "label": "Urgency",
        "reason": "The message pressures the user to act quickly.",
        "terms": [
            r"\bimmediately\b",
            r"\burgent\b",
            r"\bright now\b",
            r"\bnow\b",
            r"\basap\b",
            r"\bhurry\b",
            r"act fast",
            r"within \d+ (?:minutes|hours|days)",
        ],
        "strong_names": {"high_urgency", "urgent_threat_combo"},
        "weak_names": {"urgency"},
        "base_contribution": 0.20,
    },
    "fear": {
        "feature": "fear",
        "label": "Threat Language",
        "reason": "The sender uses fear of loss, suspension, or punishment.",
        "terms": [
            r"\bblocked\b",
            r"\bsuspended\b",
            r"\blocked\b",
            r"\bfrozen\b",
            r"legal action",
            r"\bpenalty\b",
            r"\bwarning\b",
            r"\bunauthorized\b",
            r"permanent suspension",
        ],
        "strong_names": {"threat_or_fear", "urgent_threat_combo"},
        "weak_names": {"fear_language"},
        "base_contribution": 0.22,
    },
    "authority": {
        "feature": "authority",
        "label": "Authority Impersonation",
        "reason": "The sender claims institutional authority or official status.",
        "terms": [
            r"\bbank\b",
            r"security team",
            r"support team",
            r"\bofficial\b",
            r"\brbi\b",
            r"\bgovernment\b",
            r"fraud department",
            r"customer care",
            r"verification team",
        ],
        "strong_names": {"authority_impersonation", "authority_plus_request"},
        "weak_names": {"authority_language"},
        "base_contribution": 0.18,
    },
    "suspicious_link": {
        "feature": "link_risk",
        "label": "Suspicious Link",
        "reason": "The message contains a link or instruction commonly associated with phishing.",
        "terms": [
            r"https?://[^\s]+",
            r"www\.[^\s]+",
            r"click here",
            r"tap here",
            r"open this",
            r"\bverify\b",
            r"secure link",
        ],
        "strong_names": {"suspicious_link"},
        "weak_names": {"link_present"},
        "base_contribution": 0.32,
    },
}


GUARDRAIL_EFFECTS = {
    "benign_short_message": "Capped risk because the text is short and has no fraud evidence.",
    "no_behavior_signals": "Capped risk because no behavioral fraud signals were detected.",
    "no_fraud_evidence": "Capped risk because no concrete fraud evidence was found.",
    "weak_evidence_only": "Capped risk because only weak evidence was detected.",
    "high_risk_requires_strong_evidence": "Prevented high risk because strong fraud evidence is required.",
}


EVIDENCE_IMPACTS = {
    "credential_request": "Credential requests can give an attacker direct access to an account or transaction approval.",
    "urgency": "Urgency is often used to make people act before verifying the request.",
    "fear": "Threat language can pressure the user into following unsafe instructions.",
    "authority": "Authority claims can make a fake request look like it came from a trusted institution.",
    "suspicious_link": "Suspicious links can lead to phishing pages, malware, or credential capture.",
}


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, float(value)))


def _has_high_risk_evidence(evidence: list[dict[str, Any]]) -> bool:
    high_risk_types = {"credential_request", "suspicious_link", "urgency", "fear"}
    return any(item.get("severity") == "strong" and item.get("type") in high_risk_types for item in evidence)


def _risk_level(score: float, has_high_risk_evidence: bool, raw_level: str = "") -> str:
    normalized = (raw_level or "").upper()
    if "UNKNOWN" in normalized:
        return "UNKNOWN"
    if score >= 0.65 and has_high_risk_evidence:
        return "HIGH"
    if score >= 0.30:
        return "MEDIUM"
    return "SAFE"


def _find_evidence_text(text: str, patterns: list[str]) -> str:
    for pattern in patterns:
        match = re.search(pattern, text or "", flags=re.IGNORECASE)
        if match:
            return match.group(0)
    return ""


def _evidence_strength(signal_type: str, evidence_meta: dict[str, Any], score: float) -> str | None:
    strong = set(evidence_meta.get("strong_signals") or [])
    weak = set(evidence_meta.get("weak_signals") or [])
    definition = SIGNAL_DEFINITIONS[signal_type]
    if strong.intersection(definition["strong_names"]) or score >= 0.70:
        return "strong"
    if weak.intersection(definition["weak_names"]) or score >= 0.35:
        return "weak"
    return None


def _build_evidence_for_text(text: str, message_result: dict[str, Any]) -> list[dict[str, Any]]:
    features = message_result.get("features") or {}
    evidence_meta = message_result.get("evidence") or {}
    findings = []
    for signal_type, definition in SIGNAL_DEFINITIONS.items():
        feature_score = _clamp(features.get(definition["feature"], 0.0))
        evidence_text = _find_evidence_text(text, definition["terms"])
        severity = _evidence_strength(signal_type, evidence_meta, feature_score)
        if not severity and not evidence_text:
            continue
        confidence = max(feature_score, 0.72 if evidence_text else 0.0)
        if severity == "strong":
            confidence = max(confidence, 0.82)
        contribution = definition["base_contribution"] * max(feature_score, 0.5 if evidence_text else 0.0)
        findings.append({
            "type": signal_type,
            "label": definition["label"],
            "confidence": round(_clamp(confidence), 3),
            "evidence_text": evidence_text,
            "reason": definition["reason"],
            "impact": EVIDENCE_IMPACTS.get(signal_type, "This signal increases the likelihood that the message is unsafe."),
            "risk_contribution": round(_clamp(contribution), 3),
            "severity": severity or "weak",
        })
    findings.sort(key=lambda item: (item["severity"] != "strong", -item["confidence"]))
    return findings


def _message_texts(conversation: dict[str, Any], results: list[dict[str, Any]]) -> list[str]:
    messages = conversation.get("messages") if isinstance(conversation, dict) else None
    if isinstance(messages, list) and messages:
        return [str(message.get("text", "")) for message in messages if isinstance(message, dict)]
    return [str(result.get("text", "")) for result in results]


def _aggregate_evidence(texts: list[str], results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_type: dict[str, dict[str, Any]] = {}
    for text, result in zip(texts, results):
        for finding in _build_evidence_for_text(text, result):
            existing = by_type.get(finding["type"])
            if not existing or finding["confidence"] > existing["confidence"]:
                by_type[finding["type"]] = finding
            elif existing and not existing.get("evidence_text") and finding.get("evidence_text"):
                existing["evidence_text"] = finding["evidence_text"]
    return sorted(by_type.values(), key=lambda item: (item["severity"] != "strong", -item["confidence"]))


def _reasoning_quality(evidence: list[dict[str, Any]]) -> str:
    strong_count = sum(1 for item in evidence if item.get("severity") == "strong")
    if strong_count >= 3:
        return "Strong Evidence"
    if strong_count >= 1 or len(evidence) >= 3:
        return "Moderate Evidence"
    if evidence:
        return "Limited Evidence"
    return "No Evidence"


def _classify(text: str, evidence: list[dict[str, Any]], risk_level: str) -> dict[str, str]:
    lower = (text or "").lower()
    evidence_types = {item["type"] for item in evidence}
    if risk_level == "SAFE" and not evidence:
        return {"primary": "Safe Message", "secondary": "No fraud indicators", "industry": "General"}
    if ("bank" in lower or "account" in lower or "card" in lower) and "credential_request" in evidence_types:
        return {"primary": "Bank Impersonation Scam", "secondary": "Credential Theft", "industry": "Financial Fraud"}
    if any(term in lower for term in ["crypto", "bitcoin", "investment", "trading", "profit"]):
        return {"primary": "Investment Fraud", "secondary": "Financial Manipulation", "industry": "Financial Fraud"}
    if any(term in lower for term in ["job", "offer", "interview", "salary", "recruiter"]):
        return {"primary": "Job Scam", "secondary": "Identity or Payment Fraud", "industry": "Recruitment Fraud"}
    if any(term in lower for term in ["support", "technician", "windows", "device"]) and evidence_types.intersection({"suspicious_link", "authority"}):
        return {"primary": "Tech Support Scam", "secondary": "Account Takeover", "industry": "Consumer Fraud"}
    if "credential_request" in evidence_types:
        return {"primary": "Credential Theft Attempt", "secondary": "Account Takeover", "industry": "Identity Fraud"}
    if "suspicious_link" in evidence_types:
        return {"primary": "Phishing Attempt", "secondary": "Suspicious Link", "industry": "Cyber Fraud"}
    return {"primary": "Suspicious Message", "secondary": "Behavioral Risk", "industry": "General Fraud"}


def _confidence(score: float, evidence: list[dict[str, Any]], results: list[dict[str, Any]], guardrails: list[str]) -> float:
    quality = _reasoning_quality(evidence)
    if quality == "No Evidence":
        base = 0.22 if score < 0.30 else 0.35
    elif quality == "Limited Evidence":
        base = 0.48
    elif quality == "Moderate Evidence":
        base = 0.68
    else:
        base = 0.82
    base += min(0.10, len(evidence) * 0.025)
    base += min(0.06, abs(score - 0.5) * 0.12)
    fallback_count = 0
    for result in results:
        fallbacks = result.get("model_fallbacks") or {}
        fallback_count += sum(1 for value in fallbacks.values() if value)
    if fallback_count:
        base -= min(0.25, fallback_count * 0.06)
    if guardrails:
        base -= min(0.12, len(guardrails) * 0.03)
    if not any(item.get("severity") == "strong" for item in evidence):
        base = min(base, 0.62)
    return round(_clamp(base, 0.10, 0.98), 3)


def _guardrail_notes(results: list[dict[str, Any]]) -> list[dict[str, str]]:
    seen = []
    for result in results:
        for name in result.get("guardrails") or []:
            if name not in seen:
                seen.append(name)
    return [{"name": name, "effect": GUARDRAIL_EFFECTS.get(name, "Adjusted the score to avoid overstatement.")} for name in seen]


def _timeline(texts: list[str], results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for index, (text, result) in enumerate(zip(texts, results), start=1):
        score = _clamp(result.get("fraud_probability", result.get("final_score", 0.0)))
        evidence = _build_evidence_for_text(text, result)
        level = _risk_level(score, _has_high_risk_evidence(evidence), result.get("behavior_level", ""))
        if evidence:
            top = evidence[0]
            reason = f"{top['label']} detected"
            if top.get("evidence_text"):
                reason += f": \"{top['evidence_text']}\""
        elif result.get("guardrails"):
            reason = GUARDRAIL_EFFECTS.get(result["guardrails"][0], "Risk adjusted by guardrails.")
        else:
            reason = "No strong fraud trigger detected."
        rows.append({
            "message_index": index,
            "text": text,
            "risk_score": round(score, 4),
            "risk_level": level,
            "reason": reason,
            "triggered_evidence": [item["type"] for item in evidence],
        })
    return rows


def _recommended_actions(risk_level: str, evidence: list[dict[str, Any]]) -> list[str]:
    evidence_types = {item["type"] for item in evidence}
    if risk_level == "HIGH":
        actions = ["Do not reply", "Do not share OTP, PIN, passwords, or card details"]
        if "suspicious_link" in evidence_types:
            actions.append("Do not click the link")
        actions.extend(["Block the sender", "Contact the institution using official channels", "Report the suspicious message"])
        return actions
    if risk_level == "MEDIUM":
        return ["Verify through official channels", "Do not click links until verified", "Do not share sensitive information", "Keep the message for reference"]
    if risk_level == "UNKNOWN":
        return ["Retry analysis later", "Do not share sensitive information until verified", "Use official channels for urgent requests"]
    return ["No immediate threat detected", "Stay cautious with links and credential requests", "Verify unexpected financial messages through official channels"]


def _summary(risk_level: str, classification: dict[str, str], evidence: list[dict[str, Any]], guardrails: list[dict[str, str]]) -> str:
    if risk_level == "SAFE" and not evidence:
        return "No concrete fraud indicators were found in this message. It appears safe based on the available evidence."
    if risk_level == "UNKNOWN":
        return "The analysis was inconclusive, so this result should be treated as uncertainty rather than fraud."
    labels = [item["label"].lower() for item in evidence[:3]]
    if labels:
        return f"This appears to be a {classification['primary'].lower()} because it shows {', '.join(labels)}."
    if guardrails:
        return "Only weak or unclear signals were found, so the score was capped to avoid overstating the risk."
    return f"This message was classified as {risk_level.lower()} risk based on available behavioral signals."


def _verdict(risk_level: str, classification: dict[str, str], evidence: list[dict[str, Any]]) -> str:
    if risk_level == "SAFE" and not evidence:
        return "No fraud indicators found"
    if risk_level == "UNKNOWN":
        return "Analysis inconclusive"
    if risk_level == "HIGH":
        return f"Likely {classification['primary'].lower()}"
    if risk_level == "MEDIUM":
        return f"Suspicious: possible {classification['primary'].lower()}"
    return "Low-risk message with minor caution"


def _decision(
    risk_level: str,
    score: float,
    confidence: float,
    classification: dict[str, str],
    evidence: list[dict[str, Any]],
    guardrails: list[dict[str, str]],
) -> dict[str, str]:
    top = evidence[0] if evidence else None
    if risk_level == "SAFE" and not evidence:
        return {
            "title": "No fraud evidence detected",
            "subtitle": "The message does not contain known scam triggers.",
            "severity_label": "Safe",
            "primary_reason": guardrails[0]["effect"] if guardrails else "No credential request, suspicious link, threat, or impersonation signal was found.",
        }
    if risk_level == "UNKNOWN":
        return {
            "title": "Unable to make a reliable call",
            "subtitle": "Treat this as uncertainty, not confirmed fraud.",
            "severity_label": "Unknown",
            "primary_reason": guardrails[0]["effect"] if guardrails else "The available model output was not strong enough for a confident decision.",
        }
    if risk_level == "HIGH":
        return {
            "title": f"High-risk {classification['primary']}",
            "subtitle": f"Risk score {round(score * 100)}/100 with {round(confidence * 100)}% confidence.",
            "severity_label": "High Risk",
            "primary_reason": top["reason"] if top else "Strong fraud evidence was detected.",
        }
    if risk_level == "MEDIUM":
        return {
            "title": f"Suspicious {classification['primary']}",
            "subtitle": f"Risk score {round(score * 100)}/100 with {round(confidence * 100)}% confidence.",
            "severity_label": "Needs Verification",
            "primary_reason": top["reason"] if top else "The message contains weak or incomplete fraud signals.",
        }
    return {
        "title": "Low-risk message",
        "subtitle": "No strong fraud evidence was found.",
        "severity_label": "Low Risk",
        "primary_reason": top["reason"] if top else "The message appears low risk based on available evidence.",
    }


def _why_it_matters(risk_level: str, classification: dict[str, str], evidence: list[dict[str, Any]]) -> str:
    evidence_types = {item["type"] for item in evidence}
    if risk_level == "SAFE" and not evidence:
        return "Nothing in this message suggests credential theft, impersonation, phishing, or financial pressure."
    if risk_level == "UNKNOWN":
        return "The result is uncertain, so sensitive actions should wait until the request is verified through a trusted channel."
    if "credential_request" in evidence_types:
        return "Sharing OTPs, passwords, PINs, or login details can let an attacker take over accounts or approve transactions."
    if "suspicious_link" in evidence_types:
        return "Opening an unverified link can expose credentials, personal information, or device security."
    if {"urgency", "fear"}.intersection(evidence_types):
        return "Pressure and threats are common social engineering tactics designed to bypass careful verification."
    return f"This matters because the message shows behavior associated with {classification['primary'].lower()}."


def _attack_playbook(evidence: list[dict[str, Any]], timeline: list[dict[str, Any]], risk_level: str) -> list[dict[str, Any]]:
    if risk_level == "SAFE" and not evidence:
        return []
    steps = []
    seen = set()
    for item in evidence:
        if item["type"] in seen:
            continue
        seen.add(item["type"])
        steps.append({
            "step": len(steps) + 1,
            "label": item["label"],
            "evidence_text": item.get("evidence_text", ""),
            "explanation": item.get("impact") or item.get("reason", ""),
            "severity": item.get("severity", "weak"),
        })
    if not steps and timeline:
        steps.append({
            "step": 1,
            "label": "Behavioral Risk",
            "evidence_text": timeline[-1].get("text", ""),
            "explanation": timeline[-1].get("reason", "The message needs additional verification."),
            "severity": "weak",
        })
    return steps[:5]


def _safe_alternative(risk_level: str, evidence: list[dict[str, Any]]) -> list[str]:
    evidence_types = {item["type"] for item in evidence}
    if risk_level == "SAFE" and not evidence:
        return ["No action is required unless the message was unexpected.", "Continue to avoid sharing credentials in chat or SMS."]
    actions = ["Verify the request using an official app, website, or phone number you already trust."]
    if "suspicious_link" in evidence_types:
        actions.append("Type the official website address manually instead of using the message link.")
    if "authority" in evidence_types or "credential_request" in evidence_types:
        actions.append("Contact the institution directly and ask whether the request is genuine.")
    if risk_level in {"HIGH", "MEDIUM"}:
        actions.append("Keep a screenshot or copy of the message for reporting.")
    return actions


def _dont_do(risk_level: str, evidence: list[dict[str, Any]]) -> list[str]:
    evidence_types = {item["type"] for item in evidence}
    if risk_level == "SAFE" and not evidence:
        return []
    blocked = []
    if "credential_request" in evidence_types:
        blocked.append("Do not share OTPs, passwords, PINs, CVV, or login codes.")
    if "suspicious_link" in evidence_types:
        blocked.append("Do not open the link or enter information on linked pages.")
    if {"urgency", "fear"}.intersection(evidence_types):
        blocked.append("Do not act only because the message says it is urgent.")
    if "authority" in evidence_types:
        blocked.append("Do not trust the sender identity without independent verification.")
    return blocked or ["Do not share sensitive information until the request is verified."]


def _shareable_summary(
    risk_level: str,
    score: float,
    confidence: float,
    classification: dict[str, str],
    summary: str,
    evidence: list[dict[str, Any]],
    recommended_actions: list[str],
) -> str:
    evidence_labels = ", ".join(item["label"] for item in evidence[:4]) if evidence else "No concrete fraud evidence"
    action = recommended_actions[0] if recommended_actions else "Verify through official channels"
    return (
        f"FraudSentinel result: {risk_level} risk ({round(score * 100)}/100), "
        f"{round(confidence * 100)}% confidence. Classification: {classification['primary']}. "
        f"Summary: {summary} Evidence: {evidence_labels}. Recommended action: {action}."
    )


def build_intelligence(analysis: dict[str, Any], conversation: dict[str, Any] | None = None) -> dict[str, Any]:
    results = analysis.get("messages_analysis") or []
    if not results and analysis.get("text") is not None:
        results = [analysis]
    texts = _message_texts(conversation or {}, results)
    if len(texts) < len(results):
        texts.extend(str(result.get("text", "")) for result in results[len(texts):])
    final_score = _clamp(analysis.get("fraud_probability", analysis.get("final_score", 0.0)))
    evidence = _aggregate_evidence(texts, results)
    risk_level = _risk_level(final_score, _has_high_risk_evidence(evidence), analysis.get("behavior_level") or analysis.get("final_risk_level") or "")
    guardrails = _guardrail_notes(results)
    full_text = "\n".join(texts)
    classification = _classify(full_text, evidence, risk_level)
    confidence = _confidence(final_score, evidence, results, [item["name"] for item in guardrails])
    timeline = _timeline(texts, results)
    recommended_actions = _recommended_actions(risk_level, evidence)
    summary = _summary(risk_level, classification, evidence, guardrails)
    return {
        "risk_level": risk_level,
        "risk_score": round(final_score, 4),
        "confidence": confidence,
        "reasoning_quality": _reasoning_quality(evidence),
        "classification": classification,
        "summary": summary,
        "evidence": evidence,
        "timeline": timeline,
        "guardrails": guardrails,
        "recommended_actions": recommended_actions,
        "verdict": _verdict(risk_level, classification, evidence),
        "decision": _decision(risk_level, final_score, confidence, classification, evidence, guardrails),
        "why_it_matters": _why_it_matters(risk_level, classification, evidence),
        "attack_playbook": _attack_playbook(evidence, timeline, risk_level),
        "safe_alternative": _safe_alternative(risk_level, evidence),
        "dont_do": _dont_do(risk_level, evidence),
        "shareable_summary": _shareable_summary(risk_level, final_score, confidence, classification, summary, evidence, recommended_actions),
    }
