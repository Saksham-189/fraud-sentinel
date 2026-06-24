import os
import sys
import pickle
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)
from core.feature_extractor import extract_features, behavior_score, interpret_behavior
from config.config import LR_WEIGHT, BERT_WEIGHT, USE_TRANSFORMER
_model_dir = os.path.dirname(os.path.abspath(__file__))
_model = None
_vectorizer = None
_model_loaded = False
try:
    with open(os.path.join(_model_dir, "fraud_model.pkl"), "rb") as f:
        _model = pickle.load(f)
    with open(os.path.join(_model_dir, "vectorizer.pkl"), "rb") as f:
        _vectorizer = pickle.load(f)
    _model_loaded = True
except FileNotFoundError:
    print("[predict.py] WARNING: Model/vectorizer not found. Run train_model.py first.")
    _model_loaded = False
except Exception as e:
    print(f"[predict.py] WARNING: Error loading model: {e}")
    _model_loaded = False
_transformer_module = None
def _get_transformer():
    global _transformer_module
    if _transformer_module is None:
        from models.transformer_model import predict_transformer, is_loaded, load_transformer
        _transformer_module = {
            "predict": predict_transformer,
            "is_loaded": is_loaded,
            "load": load_transformer,
        }
    return _transformer_module
def get_lr_prediction(text: str) -> dict:
    if not text or not isinstance(text, str):
        return {"probability": 0.5, "confidence": 0.0, "fallback": True, "reason": "empty_text"}
    if not _model_loaded:
        return {"probability": 0.5, "confidence": 0.0, "fallback": True, "reason": "model_not_loaded"}
    try:
        from data_pipeline.data_cleaner import clean_text
        cleaned = clean_text(text)
        if not cleaned:
            return {"probability": 0.5, "confidence": 0.0, "fallback": True, "reason": "empty_cleaned_text"}
        vec = _vectorizer.transform([cleaned])
        proba = _model.predict_proba(vec)
        prob = float(proba[0][1])
        prob = max(0.0, min(1.0, prob))
        confidence = max(0.0, min(1.0, abs(prob - 0.5) * 2))
        return {
            "probability": prob,
            "confidence": confidence,
            "fallback": False,
            "reason": "ok",
        }
    except Exception as e:
        import logging
        logging.error(f"[predict.py] LR inference error: {e}")
        return {"probability": 0.5, "confidence": 0.0, "fallback": True, "reason": "inference_error"}


def get_lr_probability(text: str) -> float:
    return get_lr_prediction(text)["probability"]
def predict_message(text: str, prev_text: str = None) -> dict:
    from core.pipeline import run_message_analysis
    return run_message_analysis(text, prev_text)
if __name__ == "__main__":
    test_msgs = [
        "Hello, how are you today?",
        "Your account will be blocked. Send OTP now.",
    ]
    for msg in test_msgs:
        print(f"Msg: {msg} -> LR Prob: {get_lr_probability(msg):.4f}")
