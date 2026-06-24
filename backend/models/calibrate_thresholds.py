import argparse
import json
import os
import random
import sys
from datetime import datetime


_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from core.pipeline import run_message_analysis  # noqa: E402


VALIDATION_PATH = os.path.join(_project_root, "data", "processed", "validation_data.json")
CALIBRATION_PATH = os.path.join(_project_root, "config", "calibration.json")
REPORT_PATH = os.path.join(_project_root, "data", "processed", "calibration_report.json")


REGRESSION_CASES = [
    ("hello", "safe"),
    ("hi", "safe"),
    ("okay", "safe"),
    ("thanks", "safe"),
    ("are you free", "safe"),
    ("I will not share my OTP with anyone", "safe"),
    ("The bank confirmed my account is safe", "safe"),
    ("I changed my PIN at the ATM yesterday", "safe"),
    ("Your account will be blocked. Send OTP now.", "fraud"),
    ("URGENT: verify your bank account immediately or it will be suspended.", "fraud"),
    ("Click this link and enter your password to restore access.", "fraud"),
    ("Transfer the processing fee now to secure your job offer.", "fraud"),
]


def load_validation(max_samples: int) -> list[dict]:
    samples = []
    if os.path.exists(VALIDATION_PATH):
        with open(VALIDATION_PATH, encoding="utf-8") as f:
            data = json.load(f)
        for msg in data.get("messages", []):
            text = msg.get("text", "").strip()
            label = msg.get("label", "safe")
            if text and label in {"safe", "fraud"}:
                samples.append({"text": text, "label": label, "source": msg.get("source", "validation")})
    random.seed(42)
    random.shuffle(samples)
    if max_samples and len(samples) > max_samples:
        half = max_samples // 2
        safe = [sample for sample in samples if sample["label"] == "safe"][:half]
        fraud = [sample for sample in samples if sample["label"] == "fraud"][: max_samples - len(safe)]
        samples = safe + fraud
        random.shuffle(samples)
    for text, label in REGRESSION_CASES:
        samples.append({"text": text, "label": label, "source": "regression"})
    return samples


def cap_score(result: dict, candidate: dict) -> float:
    if "benign_short_message" in result.get("guardrails", []):
        return float(result["fraud_probability"])
    score = float(result.get("raw_fraud_probability", result.get("fraud_probability", 0.0)))
    evidence = result.get("evidence", {})
    features = result.get("features", {})
    behavior_score = float(result.get("behavior_score", 0.0))
    signal_values = [
        features.get("urgency", 0.0),
        features.get("authority", 0.0),
        features.get("fear", 0.0),
        features.get("credential_intent", 0.0),
        features.get("link_risk", 0.0),
        features.get("url_present", 0.0),
    ]
    if max(signal_values or [0.0]) <= 0.0 and behavior_score <= 0.0:
        score = min(score, candidate["no_behavior_score_cap"])
    if not evidence.get("has_any_evidence"):
        score = min(score, candidate["no_evidence_score_cap"])
    elif not evidence.get("has_strong_evidence"):
        score = min(score, candidate["weak_evidence_score_cap"])
    if score >= candidate["high_threshold"] and not evidence.get("has_strong_evidence"):
        score = min(score, candidate["high_threshold"] - 0.01)
    return max(0.0, min(1.0, score))


def classify(score: float, result: dict, candidate: dict) -> str:
    evidence = result.get("evidence", {})
    if score >= candidate["high_threshold"] and evidence.get("has_strong_evidence"):
        return "fraud"
    if score >= candidate["safe_threshold"]:
        return "fraud"
    return "safe"


def metrics_for(scored: list[dict], candidate: dict) -> dict:
    tp = fp = tn = fn = 0
    short_fp = 0
    for item in scored:
        score = cap_score(item["result"], candidate)
        pred = classify(score, item["result"], candidate)
        truth = item["label"]
        if pred == "fraud" and truth == "fraud":
            tp += 1
        elif pred == "fraud" and truth == "safe":
            fp += 1
            if item["source"] == "regression" and len(item["text"].split()) <= 4:
                short_fp += 1
        elif pred == "safe" and truth == "safe":
            tn += 1
        elif pred == "safe" and truth == "fraud":
            fn += 1
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    false_positive_rate = fp / (fp + tn) if (fp + tn) else 0.0
    false_negative_rate = fn / (fn + tp) if (fn + tp) else 0.0
    recall_penalty = max(0.0, 0.85 - recall)
    objective = (
        f1
        - (0.35 * false_positive_rate)
        - (0.35 * false_negative_rate)
        - (0.50 * recall_penalty)
        - (0.25 * short_fp)
    )
    return {
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "false_positive_rate": false_positive_rate,
        "false_negative_rate": false_negative_rate,
        "short_safe_false_positives": short_fp,
        "objective": objective,
    }


def candidate_grid(center: dict | None = None, step: float = 0.05) -> list[dict]:
    if center is None:
        safe_values = [0.30]
        high_values = [0.65, 0.70, 0.75]
        no_behavior_values = [0.15, 0.20]
        no_evidence_values = [0.25, 0.30, 0.35]
        weak_values = [0.45, 0.50, 0.55, 0.60]
    else:
        def around(key, low, high):
            values = [center[key] - step, center[key], center[key] + step]
            return sorted({round(max(low, min(high, value)), 3) for value in values})

        safe_values = [0.30]
        high_values = around("high_threshold", 0.65, 0.80)
        no_behavior_values = around("no_behavior_score_cap", 0.10, 0.20)
        no_evidence_values = around("no_evidence_score_cap", 0.20, 0.40)
        weak_values = around("weak_evidence_score_cap", 0.40, 0.62)

    candidates = []
    for safe in safe_values:
        for high in high_values:
            if high <= safe:
                continue
            for no_behavior in no_behavior_values:
                for no_evidence in no_evidence_values:
                    for weak in weak_values:
                        if no_behavior > no_evidence or no_evidence > weak:
                            continue
                        candidates.append({
                            "safe_threshold": safe,
                            "high_threshold": high,
                            "benign_short_min_probability": 0.02,
                            "benign_short_max_probability": 0.08,
                            "no_behavior_score_cap": no_behavior,
                            "no_evidence_score_cap": no_evidence,
                            "weak_evidence_score_cap": weak,
                        })
    return candidates


def calibrate(max_samples: int, rounds: int) -> dict:
    samples = load_validation(max_samples=max_samples)
    scored = []
    for index, sample in enumerate(samples, start=1):
        if index % 250 == 0:
            print(f"  Scored {index}/{len(samples)} validation samples...")
        scored.append({
            **sample,
            "result": run_message_analysis(sample["text"]),
        })

    best = None
    best_metrics = None
    step = 0.05
    for round_index in range(rounds):
        candidates = candidate_grid(best, step=step)
        for candidate in candidates:
            metrics = metrics_for(scored, candidate)
            if best_metrics is None or metrics["objective"] > best_metrics["objective"]:
                best = candidate
                best_metrics = metrics
        step = max(0.01, step / 2)
        print(
            f"  Round {round_index + 1}: objective={best_metrics['objective']:.4f}, "
            f"f1={best_metrics['f1']:.4f}, fp={best_metrics['fp']}, fn={best_metrics['fn']}"
        )

    report = {
        "generated_at": datetime.now().isoformat(),
        "samples": len(scored),
        "calibration": best,
        "metrics": best_metrics,
    }
    os.makedirs(os.path.dirname(CALIBRATION_PATH), exist_ok=True)
    with open(CALIBRATION_PATH, "w", encoding="utf-8") as f:
        json.dump(best, f, indent=2)
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    return report


def main():
    parser = argparse.ArgumentParser(description="Calibrate FraudSentinel thresholds and score caps.")
    parser.add_argument("--max-samples", type=int, default=3000)
    parser.add_argument("--rounds", type=int, default=3)
    args = parser.parse_args()
    print("Calibrating thresholds...")
    report = calibrate(max_samples=args.max_samples, rounds=args.rounds)
    print("Calibration complete.")
    print(json.dumps(report["calibration"], indent=2))
    print(json.dumps(report["metrics"], indent=2))


if __name__ == "__main__":
    main()
