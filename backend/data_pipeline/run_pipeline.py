import os
import sys
import json
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)
from config.config import (
    RAW_DIR, PROCESSED_DIR, SYNTHETIC_DIR,
    SYNTHETIC_FRAUD_COUNT, SYNTHETIC_SAFE_COUNT,
)
from data_pipeline.data_loader    import load_kaggle_data, load_enron_data
from data_pipeline.data_cleaner   import clean_text
from data_pipeline.data_formatter import create_message, create_conversation
from data_pipeline.synthetic_data_generator import generate_dataset
PHISHING_CSV     = os.path.join(RAW_DIR, "phishing.csv")
ENRON_CSV        = os.path.join(RAW_DIR, "enron.csv")
REAL_OUTPUT      = os.path.join(PROCESSED_DIR, "real_data.json")
SYNTHETIC_OUTPUT = os.path.join(SYNTHETIC_DIR,  "synthetic_data.json")
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(SYNTHETIC_DIR,  exist_ok=True)
def process_real_data() -> dict:
    all_messages = []
    if os.path.exists(PHISHING_CSV):
        try:
            phishing_df = load_kaggle_data(PHISHING_CSV)
            text_col = next(
                (c for c in ["text", "message", "email_text", "body", "content"]
                 if c in phishing_df.columns),
                None
            )
            if text_col is None:
                print(f"  [WARN] phishing.csv columns: {list(phishing_df.columns)}")
                print("  [WARN] Could not find text column in phishing.csv - skipping.")
            else:
                count = 0
                for _, row in phishing_df.iterrows():
                    raw  = str(row[text_col]) if row[text_col] else ""
                    text = clean_text(raw)
                    if text:
                        all_messages.append(
                            create_message(text, label="fraud", stage="attack")
                        )
                        count += 1
                print(f"  Loaded {count} fraud messages from phishing.csv")
        except Exception as e:
            print(f"  [WARN] Error loading phishing.csv: {e}")
    else:
        print(f"  [WARN] phishing.csv not found at {PHISHING_CSV}")
    if os.path.exists(ENRON_CSV):
        try:
            enron_df = load_enron_data(ENRON_CSV)
            text_col = next(
                (c for c in ["text", "message", "email_text", "body", "content"]
                 if c in enron_df.columns),
                None
            )
            if text_col is None:
                print(f"  [WARN] enron.csv columns: {list(enron_df.columns)}")
                print("  [WARN] Could not find text column in enron.csv - skipping.")
            else:
                count = 0
                for _, row in enron_df.iterrows():
                    raw  = str(row[text_col]) if row[text_col] else ""
                    text = clean_text(raw)
                    if text:
                        all_messages.append(
                            create_message(text, label="safe", stage="normal")
                        )
                        count += 1
                print(f"  Loaded {count} safe messages from enron.csv")
        except Exception as e:
            print(f"  [WARN] Error loading enron.csv: {e}")
    else:
        print(f"  [WARN] enron.csv not found at {ENRON_CSV}")
    if not all_messages:
        print("  [WARN] No real data loaded. Only synthetic data will be used.")
    return create_conversation(all_messages)
def generate_synthetic_data(n_fraud: int = None, n_safe: int = None) -> list:
    n_fraud = n_fraud or SYNTHETIC_FRAUD_COUNT
    n_safe  = n_safe  or SYNTHETIC_SAFE_COUNT
    print(f"  Generating {n_fraud} fraud + {n_safe} safe conversations...")
    return generate_dataset(n_fraud=n_fraud, n_safe=n_safe)
def run():
    print("\n" + "=" * 60)
    print("FRAUD SENTINEL - DATA PIPELINE")
    print("=" * 60)
    print("\n[1/2] Processing real datasets...")
    real_data = process_real_data()
    with open(REAL_OUTPUT, "w") as f:
        json.dump(real_data, f, indent=2)
    print(f"  Saved -> {REAL_OUTPUT}")
    print("\n[2/2] Generating synthetic data...")
    synthetic_data = generate_synthetic_data()
    with open(SYNTHETIC_OUTPUT, "w") as f:
        json.dump(synthetic_data, f, indent=2)
    print(f"  Saved -> {SYNTHETIC_OUTPUT}")
    n_real      = len(real_data.get("messages", []))
    n_synthetic = sum(len(c.get("messages", [])) for c in synthetic_data)
    print(f"\n  Real messages      : {n_real}")
    print(f"  Synthetic messages : {n_synthetic}")
    print(f"  Total              : {n_real + n_synthetic}")
    print("\nPipeline complete. Run train_model.py next.\n")
if __name__ == "__main__":
    run()