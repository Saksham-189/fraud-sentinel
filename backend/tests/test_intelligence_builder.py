import os
import sys


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from core.intelligence_builder import build_intelligence  # noqa: E402
from core.pipeline import run_analysis_pipeline  # noqa: E402


def test_short_benign_message_gets_safe_intelligence():
    result = run_analysis_pipeline({"conversation_id": "t1", "messages": [{"text": "hello"}]})
    intel = result["intelligence"]
    assert intel["risk_level"] == "SAFE"
    assert 0.02 <= intel["risk_score"] <= 0.08
    assert intel["reasoning_quality"] == "No Evidence"
    assert intel["classification"]["primary"] == "Safe Message"
    assert intel["evidence"] == []
    assert "No concrete fraud indicators" in intel["summary"]
    assert intel["verdict"] == "No fraud indicators found"
    assert intel["attack_playbook"] == []
    assert intel["dont_do"] == []
    assert "Nothing in this message" in intel["why_it_matters"]


def test_otp_request_gets_high_risk_credential_evidence():
    result = run_analysis_pipeline({
        "conversation_id": "t2",
        "messages": [{"text": "Your account will be blocked. Send OTP now."}],
    })
    intel = result["intelligence"]
    assert intel["risk_level"] == "HIGH"
    assert intel["risk_score"] >= 0.65
    assert intel["classification"]["primary"] in {
        "Bank Impersonation Scam",
        "Credential Theft Attempt",
    }
    assert any(item["type"] == "credential_request" for item in intel["evidence"])
    assert any("OTP" in item["evidence_text"].upper() for item in intel["evidence"])
    advisory_text = f"{intel['why_it_matters']} {intel['shareable_summary']}".lower()
    assert "credential" in advisory_text or "otp" in advisory_text
    assert intel["attack_playbook"]
    assert intel["dont_do"]
    assert any("OTP" in item or "password" in item or "PIN" in item for item in intel["dont_do"])


def test_suspicious_url_classifies_as_phishing():
    analysis = {
        "fraud_probability": 0.72,
        "behavior_level": "HIGH RISK",
        "messages_analysis": [{
            "text": "Verify your account here: http://secure-login-update.com",
            "fraud_probability": 0.72,
            "behavior_level": "HIGH RISK",
            "features": {"link_risk": 0.8, "url_present": 1.0, "urgency": 0.0, "fear": 0.0, "authority": 0.0, "credential_intent": 0.0},
            "evidence": {"strong_signals": ["suspicious_link"], "weak_signals": [], "has_strong_evidence": True, "has_any_evidence": True},
            "guardrails": [],
            "model_fallbacks": {},
        }],
    }
    intel = build_intelligence(analysis, {"messages": [{"text": analysis["messages_analysis"][0]["text"]}]})
    assert intel["risk_level"] == "HIGH"
    assert intel["classification"]["primary"] == "Phishing Attempt"
    assert any(item["type"] == "suspicious_link" for item in intel["evidence"])
    assert "link" in intel["why_it_matters"].lower()
    assert any("link" in item.lower() for item in intel["safe_alternative"])


def test_safe_bank_security_message_is_not_high_without_request():
    result = run_analysis_pipeline({
        "conversation_id": "t3",
        "messages": [{"text": "Your bank security team says your monthly statement is ready."}],
    })
    intel = result["intelligence"]
    assert intel["risk_level"] != "HIGH"
    assert "High-risk" not in intel["decision"]["title"]


def test_model_fallback_reduces_confidence():
    analysis = {
        "fraud_probability": 0.55,
        "behavior_level": "MEDIUM RISK",
        "messages_analysis": [{
            "text": "Please verify your profile.",
            "fraud_probability": 0.55,
            "behavior_level": "MEDIUM RISK",
            "features": {"link_risk": 0.3, "url_present": 0.0, "urgency": 0.0, "fear": 0.0, "authority": 0.0, "credential_intent": 0.0},
            "evidence": {"strong_signals": [], "weak_signals": ["link_present"], "has_strong_evidence": False, "has_any_evidence": True},
            "guardrails": ["weak_evidence_only"],
            "model_fallbacks": {"lr": True, "bert": True},
        }],
    }
    intel = build_intelligence(analysis, {"messages": [{"text": "Please verify your profile."}]})
    assert intel["risk_level"] == "MEDIUM"
    assert intel["confidence"] <= 0.62
    assert intel["reasoning_quality"] == "Limited Evidence"
    assert "HIGH" not in intel["verdict"]


def test_weak_evidence_cannot_be_high():
    analysis = {
        "fraud_probability": 0.9,
        "behavior_level": "HIGH RISK",
        "messages_analysis": [{
            "text": "Please verify your profile.",
            "fraud_probability": 0.9,
            "behavior_level": "HIGH RISK",
            "features": {"link_risk": 0.35, "url_present": 0.0, "urgency": 0.0, "fear": 0.0, "authority": 0.0, "credential_intent": 0.0},
            "evidence": {"strong_signals": [], "weak_signals": ["link_present"], "has_strong_evidence": False, "has_any_evidence": True},
            "guardrails": ["weak_evidence_only", "high_risk_requires_strong_evidence"],
            "model_fallbacks": {},
        }],
    }
    intel = build_intelligence(analysis, {"messages": [{"text": "Please verify your profile."}]})
    assert intel["risk_level"] == "MEDIUM"
    assert intel["confidence"] <= 0.62
