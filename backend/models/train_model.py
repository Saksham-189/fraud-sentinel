import os
import sys
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)
from config.config import (
    PROCESSED_DIR, SYNTHETIC_DIR, MODEL_DIR,
    TFIDF_MAX_FEATURES, TFIDF_NGRAM_RANGE,
    LR_MAX_ITER, LR_C, TEST_SPLIT_SIZE, RANDOM_SEED,
    USE_CALIBRATION,
)
REAL_DATA_PATH      = os.path.join(PROCESSED_DIR,  "real_data.json")
SYNTHETIC_DATA_PATH = os.path.join(SYNTHETIC_DIR,   "synthetic_data.json")
MODEL_SAVE_PATH      = os.path.join(MODEL_DIR, "fraud_model.pkl")
VECTORIZER_SAVE_PATH = os.path.join(MODEL_DIR, "vectorizer.pkl")
def load_processed_data() -> tuple:
    texts, labels = [], []
    if os.path.exists(REAL_DATA_PATH):
        with open(REAL_DATA_PATH, encoding="utf-8") as f:
            real = json.load(f)
        messages = real.get("messages", [])
        print(f"  Loaded {len(messages)} messages from real_data.json")
        for msg in messages:
            text  = msg.get("text", "").strip()
            label = msg.get("label", "safe")
            if text:
                texts.append(text)
                labels.append(1 if label == "fraud" else 0)
    else:
        print(f"  [WARN] real_data.json not found at {REAL_DATA_PATH}")
    if os.path.exists(SYNTHETIC_DATA_PATH):
        with open(SYNTHETIC_DATA_PATH, encoding="utf-8") as f:
            synthetic = json.load(f)
        synthetic_count = 0
        for conv in synthetic:
            for msg in conv.get("messages", []):
                text  = msg.get("text", "").strip()
                label = msg.get("label", "fraud")
                if text:
                    texts.append(text)
                    labels.append(1 if label == "fraud" else 0)
                    synthetic_count += 1
        print(f"  Loaded {synthetic_count} messages from synthetic_data.json")
    else:
        print(f"  [WARN] synthetic_data.json not found at {SYNTHETIC_DATA_PATH}")
    return texts, labels
def train():
    print("\n" + "=" * 60)
    print("FRAUD SENTINEL - MODEL TRAINING")
    print("=" * 60)
    print("\n[1/6] Loading data...")
    texts, labels = load_processed_data()
    if not texts:
        print("ERROR: No training data found. Run run_pipeline.py first.")
        return
    total   = len(labels)
    n_fraud = sum(labels)
    n_safe  = total - n_fraud
    print(f"\n  Total samples : {total}")
    print(f"  Fraud         : {n_fraud} ({100 * n_fraud / total:.1f}%)")
    print(f"  Safe          : {n_safe}  ({100 * n_safe  / total:.1f}%)")
    if total < 20:
        print("\n[WARN] Very small dataset. Results may be unreliable.")
    print("\n[2/6] Vectorising text...")
    vectorizer = TfidfVectorizer(
        max_features=TFIDF_MAX_FEATURES,
        ngram_range=TFIDF_NGRAM_RANGE,
        sublinear_tf=True,
        strip_accents="unicode",
        analyzer="word",
        min_df=2,
        max_df=0.95,
    )
    X = vectorizer.fit_transform(texts)
    y = np.array(labels)
    print(f"  Feature matrix: {X.shape[0]} samples × {X.shape[1]} features")
    print("[3/6] Splitting train/test...")
    stratify = y if total > 10 and n_fraud > 1 and n_safe > 1 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SPLIT_SIZE, random_state=RANDOM_SEED,
        stratify=stratify,
    )
    print("[4/6] Training Logistic Regression (balanced)...")
    base_model = LogisticRegression(
        class_weight="balanced",
        max_iter=LR_MAX_ITER,
        C=LR_C,
        solver="lbfgs",
        random_state=RANDOM_SEED,
    )
    if USE_CALIBRATION and total > 50:
        print("  Applying probability calibration (CalibratedClassifierCV)...")
        model = CalibratedClassifierCV(
            estimator=base_model,
            cv=min(5, max(2, n_fraud, n_safe)),
            method="isotonic" if total > 200 else "sigmoid",
        )
    else:
        model = base_model
    model.fit(X_train, y_train)
    print("[5/6] Cross-validation...")
    if total > 30:
        cv_folds = min(5, max(2, n_fraud, n_safe))
        try:
            cv_scores = cross_val_score(
                base_model, X, y, cv=cv_folds, scoring="f1"
            )
            print(f"  CV F1 scores: {[f'{s:.3f}' for s in cv_scores]}")
            print(f"  CV F1 mean:   {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        except Exception as e:
            print(f"  [WARN] Cross-validation failed: {e}")
    else:
        print("  [SKIP] Dataset too small for cross-validation")
    print("\n[6/6] Evaluation:")
    y_pred = model.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)
    print(f"\n  Accuracy  : {acc:.4f} ({acc * 100:.1f}%)")
    print("\n  Classification Report:")
    print(classification_report(y_test, y_pred,
                                target_names=["safe", "fraud"],
                                zero_division=0))
    cm = confusion_matrix(y_test, y_pred)
    print("  Confusion Matrix:")
    if cm.shape == (2, 2):
        print(f"    TN={cm[0][0]}  FP={cm[0][1]}")
        print(f"    FN={cm[1][0]}  TP={cm[1][1]}")
    else:
        print(f"    {cm}")
    if hasattr(model, "predict_proba"):
        y_proba = model.predict_proba(X_test)[:, 1]
        print(f"\n  Probability stats (fraud class):")
        print(f"    Mean: {y_proba.mean():.4f}  Std: {y_proba.std():.4f}")
        print(f"    Min:  {y_proba.min():.4f}  Max: {y_proba.max():.4f}")
    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(MODEL_SAVE_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(VECTORIZER_SAVE_PATH, "wb") as f:
        pickle.dump(vectorizer, f)
    print(f"\n  Model saved      -> {MODEL_SAVE_PATH}")
    print(f"  Vectorizer saved -> {VECTORIZER_SAVE_PATH}")
    print("\nTraining complete.\n")
if __name__ == "__main__":
    train()