import os
import sys
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)
from models.predict             import predict_message
from core.behavior_engine       import full_conversation_analysis
def test_single_messages():
    print("\n" + "=" * 75)
    print("TEST 1: SINGLE MESSAGE PREDICTIONS")
    print("=" * 75)
    messages = [
        ("Hello, how are you today?",                                "LOW"),
        ("Meeting rescheduled to 3 PM tomorrow.",                    "LOW"),
        ("We noticed unusual activity on your account.",             "LOW-MOD"),
        ("This is your bank's security team.",                       "MODERATE"),
        ("Your account will be blocked. Verify immediately.",        "HIGH"),
        ("Send OTP now or your account will be suspended.",          "HIGH"),
        ("URGENT: Share your PIN immediately to avoid legal action.", "HIGH"),
        ("Click http://secure-bank.fake/verify to restore access.",  "HIGH"),
        ("I will NOT share my OTP with anyone.",                     "LOW (negation)"),
        ("I changed my PIN at the ATM yesterday.",                   "LOW (safe ctx)"),
        ("The bank confirmed my account is safe.",                   "LOW (safe ctx)"),
        ("I was spinning the wheel at the fair.",                    "LOW (no pin)"),
    ]
    print(f"\n{'Message':<55} {'Hybrid':>7} {'LR':>7} {'BERT':>7} {'B-Scr':>7} {'Level'}")
    print("-" * 110)
    for text, expected in messages:
        r = predict_message(text)
        bert_str = f"{r['bert_probability']:.4f}" if r['bert_probability'] is not None else "  N/A "
        is_match = ("HIGH" in r["behavior_level"]) == ("HIGH" in expected)
        flag = "[OK]" if is_match else "[WARN]"
        print(
            f"{text[:54]:<55} "
            f"{r['fraud_probability']:>7.4f} "
            f"{r['lr_probability']:>7.4f} "
            f"{bert_str:>7} "
            f"{r['behavior_score']:>7.4f} "
            f"{r['behavior_level']:<20} {flag}"
        )
def test_conversations():
    print("\n" + "=" * 75)
    print("TEST 2: FULL CONVERSATION ANALYSIS")
    print("=" * 75)
    conversations = [
        {
            "name": "Banking OTP Scam",
            "expected_level": "HIGH RISK",
            "conversation": {
                "conversation_id": "test_banking_001",
                "messages": [
                    {"text": "We noticed unusual activity on your account."},
                    {"text": "This is your bank security team contacting you."},
                    {"text": "Your account will be blocked in 10 minutes."},
                    {"text": "Send your OTP immediately to avoid account suspension."},
                ]
            }
        },
        {
            "name": "Job Scam Progression",
            "expected_level": "HIGH RISK",
            "conversation": {
                "conversation_id": "test_job_001",
                "messages": [
                    {"text": "Congratulations! You have been selected for a remote job."},
                    {"text": "A small registration fee of Rs 2000 is required."},
                    {"text": "Payment must be done within 30 minutes or slot is given away."},
                    {"text": "Transfer Rs 5000 to this UPI ID to confirm your position."},
                ]
            }
        },
        {
            "name": "Normal Safe Chat",
            "expected_level": "LOW RISK",
            "conversation": {
                "conversation_id": "test_safe_001",
                "messages": [
                    {"text": "Hi, can we reschedule the meeting to tomorrow?"},
                    {"text": "Sure, 3 PM works for me."},
                    {"text": "Great, I will send you the invite."},
                ]
            }
        },
        {
            "name": "Slow Escalation (Phishing)",
            "expected_level": "HIGH RISK",
            "conversation": {
                "conversation_id": "test_phishing_001",
                "messages": [
                    {"text": "Hello, this is from the compliance department."},
                    {"text": "We are reviewing accounts flagged for unusual transactions."},
                    {"text": "Your account has been temporarily restricted."},
                    {"text": "Please verify your identity to restore access."},
                    {"text": "Share your account number and OTP to proceed."},
                ]
            }
        },
        {
            "name": "Hard Negative (Safe with fraud keywords)",
            "expected_level": "LOW RISK",
            "conversation": {
                "conversation_id": "test_hard_neg_001",
                "messages": [
                    {"text": "I changed my PIN at the ATM yesterday."},
                    {"text": "Good idea. I should change mine too."},
                    {"text": "The bank confirmed our accounts are safe."},
                ]
            }
        },
        {
            "name": "Anti-Fraud Discussion (Negation)",
            "expected_level": "LOW RISK",
            "conversation": {
                "conversation_id": "test_negation_001",
                "messages": [
                    {"text": "Someone called claiming to be from the bank."},
                    {"text": "They asked for my OTP but I did not share it."},
                    {"text": "I reported the call to the police."},
                ]
            }
        },
    ]
    for test in conversations:
        name = test["name"]
        expected = test["expected_level"]
        conv = test["conversation"]
        result = full_conversation_analysis(conv)
        level = result.get("risk_level", result.get("final_risk_level", "UNKNOWN"))
        w_risk = result.get("risk_summary", {}).get("weighted_risk", 0)
        peak   = result.get("risk_summary", {}).get("peak_risk", 0)
        trend  = result.get("trend", "?")
        spike  = result.get("sudden_spike", False)
        expl   = result.get("explanation", "")
        final_score = result.get("final_score", 0)
        confidence  = result.get("confidence", 0)
        lifecycle   = result.get("lifecycle", {})
        max_stage   = lifecycle.get("max_stage", "?")
        pattern     = lifecycle.get("pattern", {}).get("pattern_name", "?")
        reasoning   = result.get("reasoning", "")
        status = "[OK]" if level == expected else "[WARN]"
        print(f"\n{status} [{name}]")
        print(f"   Expected      : {expected}")
        print(f"   Got           : {level}")
        print(f"   Final Score   : {final_score:.4f}  |  Confidence: {confidence:.3f}")
        print(f"   Trend         : {trend}  |  Spike: {spike}")
        print(f"   Weighted Risk : {w_risk:.4f}  |  Peak: {peak:.4f}")
        print(f"   Lifecycle     : max_stage={max_stage}  |  pattern={pattern}")
        print(f"   Explanation   : {expl[:100]}")
        if reasoning:
            print(f"   Reasoning     : {reasoning[:100]}")
        anomalies = result.get("anomalies", [])
        if anomalies:
            print(f"   Anomalies     : {'; '.join(anomalies)[:100]}")
        print("   Per-message:")
        for i, m in enumerate(result.get("messages_analysis", [])):
            stage = m.get("stage", "?")
            bert_str = f"{m.get('bert_probability', 'N/A')}"
            if isinstance(m.get('bert_probability'), float):
                bert_str = f"{m['bert_probability']:.3f}"
            print(
                f"     [{i+1}] B={m['behavior_score']:.3f} "
                f"ML={m['fraud_probability']:.3f} "
                f"LR={m.get('lr_probability', 0):.3f} "
                f"BERT={bert_str:>5} "
                f"| {stage:12s} "
                f"| {m['text'][:40]}"
            )
if __name__ == "__main__":
    print("\n" + "=" * 75)
    print("FRAUD SENTINEL - INTEGRATION TEST (v2)")
    print("=" * 75)
    test_single_messages()
    test_conversations()
    print("\n" + "=" * 75)
    print("Test complete.")
    print("=" * 75)