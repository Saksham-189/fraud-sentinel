import os
import sys


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from core.pipeline import run_message_analysis  # noqa: E402


def test_short_benign_message_stays_safe():
    result = run_message_analysis("hello")
    assert result["behavior_level"] == "SAFE"
    assert 0.02 <= result["fraud_probability"] <= 0.08
    assert "benign_short_message" in result.get("guardrails", [])


def test_otp_theft_message_is_high_risk():
    result = run_message_analysis("Your account will be blocked. Send OTP now.")
    assert result["behavior_level"] == "HIGH RISK"
    assert result["fraud_probability"] >= 0.65
    assert result["evidence"]["has_strong_evidence"]


def test_job_processing_fee_message_is_high_risk():
    result = run_message_analysis("Transfer the processing fee now to secure your job offer.")
    assert result["behavior_level"] == "HIGH RISK"
    assert result["fraud_probability"] >= 0.65
    assert "credential_request" in result["evidence"]["strong_signals"]
