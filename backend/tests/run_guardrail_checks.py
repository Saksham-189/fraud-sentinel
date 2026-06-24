import os
import sys


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from core.pipeline import run_message_analysis  # noqa: E402


SAFE_CASES = [
    "hello",
    "hi",
    "okay",
    "thanks",
    "are you free",
    "I will not share my OTP with anyone",
    "The bank confirmed my account is safe",
    "I changed my PIN at the ATM yesterday",
]


FRAUD_CASES = [
    "Your account will be blocked. Send OTP now.",
    "URGENT: verify your bank account immediately or it will be suspended.",
    "Click this link and enter your password to restore access.",
    "Transfer the processing fee now to secure your job offer.",
]


def main():
    failures = []
    for text in SAFE_CASES:
        result = run_message_analysis(text)
        probability = result["fraud_probability"]
        level = result["behavior_level"]
        if len(text.split()) <= 4:
            if probability > 0.10 or level != "SAFE":
                failures.append(f"safe short failed: {text!r} -> {probability}, {level}")
        elif probability >= 0.30:
            failures.append(f"safe hard-negative failed: {text!r} -> {probability}, {level}")

    for text in FRAUD_CASES:
        result = run_message_analysis(text)
        probability = result["fraud_probability"]
        level = result["behavior_level"]
        if probability < 0.65 or level != "HIGH RISK":
            failures.append(f"fraud case failed: {text!r} -> {probability}, {level}")

    if failures:
        print("Guardrail checks failed:")
        for failure in failures:
            print(" - " + failure)
        raise SystemExit(1)
    print("Guardrail checks passed.")


if __name__ == "__main__":
    main()
