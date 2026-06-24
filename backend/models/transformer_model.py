import os
try:
    import torch
except Exception:
    torch = None
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "distilbert_model")
_tokenizer = None
_model = None
_loaded = False
_load_attempted = False
def load_transformer():
    global _tokenizer, _model, _loaded, _load_attempted
    if _load_attempted:
        return _loaded
    _load_attempted = True
    if torch is None:
        print("[Transformer] torch is not installed. Transformer inference will be treated as unavailable.")
        _loaded = False
        return False
    if not os.path.exists(MODEL_PATH):
        print(f"[Transformer] Model directory not found at {MODEL_PATH}")
        print("[Transformer] Run train_transformer.py to fine-tune DistilBERT.")
        _loaded = False
        return False
    try:
        from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
        _tokenizer = DistilBertTokenizer.from_pretrained(MODEL_PATH)
        _model = DistilBertForSequenceClassification.from_pretrained(MODEL_PATH)
        _model.eval()
        _loaded = True
        print("[Transformer] DistilBERT model loaded successfully.")
        return True
    except ImportError:
        print("[Transformer] transformers library not installed. "
              "Install with: pip install transformers torch")
        _loaded = False
        return False
    except Exception as e:
        print(f"[Transformer] Error loading model: {type(e).__name__}: {e}")
        _loaded = False
        return False
def is_loaded() -> bool:
    return _loaded
def predict_transformer(text: str) -> dict:
    if not _load_attempted:
        load_transformer()
    if not _loaded:
        return {"probability": 0.5, "confidence": 0.0, "fallback": True, "reason": "model_not_loaded"}
    try:
        from config.config import BERT_MAX_LENGTH
        inputs = _tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=BERT_MAX_LENGTH
        )
        with torch.no_grad():
            outputs = _model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
        fraud_prob = float(probs[0][1])
        confidence = abs(fraud_prob - 0.5) * 2  # Maps [0.5, 1.0] → [0.0, 1.0]
        return {
            "probability": max(0.0, min(1.0, fraud_prob)),
            "confidence": max(0.0, min(1.0, confidence)),
            "fallback": False,
            "reason": "ok",
        }
    except Exception as e:
        import logging
        logging.error(f"[Transformer] Inference error: {type(e).__name__}: {e}")
        return {"probability": 0.5, "confidence": 0.0, "fallback": True, "reason": "inference_error"}
