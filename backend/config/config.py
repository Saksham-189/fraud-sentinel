import os
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR     = os.path.join(PROJECT_ROOT, "data")
RAW_DIR      = os.path.join(DATA_DIR, "raw")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
SYNTHETIC_DIR = os.path.join(DATA_DIR, "synthetic")
MODEL_DIR    = os.path.join(PROJECT_ROOT, "models")
USE_TRANSFORMER = True      # Enable DistilBERT semantic layer
USE_CALIBRATION = True      # Use CalibratedClassifierCV for LR
LR_WEIGHT       = 0.30    # Logistic Regression (fast, interpretable)
BERT_WEIGHT     = 0.40    # DistilBERT (contextual, handles nuance)
BEHAVIOR_WEIGHT = 0.30    # Behavioral scoring (signals like Urgency, Fear)
BEHAVIOR_WEIGHTS = {
    "credential_intent": 0.35,
    "urgency":           0.20,
    "authority":         0.20,
    "fear":              0.20,
    "link_risk":         0.05,
}
SPIKE_THRESHOLD      = 0.25    # Min delta for spike detection
SPIKE_MIN_ABSOLUTE   = 0.30    # Spike destination must exceed this
TREND_THRESHOLD      = 0.10    # Delta for trend change detection
STAGE_WEIGHTS = {
    "normal":      0.00,
    "infection":   0.20,
    "incubation":  0.40,
    "escalation":  0.70,
    "attack":      1.00,
}
STAGE_ORDER = ["normal", "infection", "incubation", "escalation", "attack"]
FINAL_SCORE_WEIGHTS = {
    "ml_probability":     0.30,
    "behavior_score":     0.25,
    "conversation_risk":  0.25,
    "lifecycle_stage":    0.20,
}
HIGH_RISK_THRESHOLD   = 0.55
MEDIUM_RISK_THRESHOLD = 0.30
TFIDF_MAX_FEATURES = 10000
TFIDF_NGRAM_RANGE  = (1, 2)
LR_MAX_ITER        = 1000
LR_C               = 1.0
TEST_SPLIT_SIZE    = 0.2
RANDOM_SEED        = 42
BERT_MODEL_NAME     = "distilbert-base-uncased"
BERT_MAX_LENGTH     = 128
BERT_TRAIN_EPOCHS   = 1
BERT_TRAIN_BATCH    = 16
BERT_EVAL_BATCH     = 16
BERT_LEARNING_RATE  = 2e-5
BERT_WEIGHT_DECAY   = 0.01
BERT_WARMUP_STEPS   = 100
SYNTHETIC_FRAUD_COUNT = 150
SYNTHETIC_SAFE_COUNT  = 150
USE_LLM_REASONING   = False           # Enable when Ollama is available
LLM_MODEL_NAME      = "mistral"       # Model to use via Ollama
LLM_API_ENDPOINT    = "http://localhost:11434/api/generate"
LLM_TIMEOUT_SECONDS = 30
LLM_MAX_TOKENS      = 512
LLM_INVOKE_CONDITIONS = {
    "signal_disagreement_threshold": 0.30,   # ML vs behavior delta
    "ambiguous_score_range":         (0.35, 0.65),  # "grey zone"
    "min_conversation_length":       3,       # Don't invoke for single messages
}