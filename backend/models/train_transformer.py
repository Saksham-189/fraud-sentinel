import os
import sys
import json
import numpy as np
import torch
from torch.utils.data import Dataset
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)
from config.config import (
    PROCESSED_DIR, SYNTHETIC_DIR, MODEL_DIR,
    BERT_MODEL_NAME, BERT_MAX_LENGTH,
    BERT_TRAIN_EPOCHS, BERT_TRAIN_BATCH, BERT_EVAL_BATCH,
    BERT_MAX_SAMPLES, BERT_GRADIENT_ACCUMULATION_STEPS,
    BERT_LEARNING_RATE, BERT_WEIGHT_DECAY, BERT_WARMUP_STEPS,
    TEST_SPLIT_SIZE, RANDOM_SEED,
)
REAL_DATA_PATH      = os.path.join(PROCESSED_DIR, "real_data.json")
SYNTHETIC_DATA_PATH = os.path.join(SYNTHETIC_DIR,  "synthetic_data.json")
SAVE_PATH           = os.path.join(MODEL_DIR, "distilbert_model")


def env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        parsed = int(value)
    except ValueError:
        print(f"  [WARN] Invalid {name}={value!r}; using {default}")
        return default
    return max(parsed, 1)


def env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        print(f"  [WARN] Invalid {name}={value!r}; using {default}")
        return default


class FraudDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
    def __len__(self):
        return len(self.texts)
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt",
        )
        return {
            "input_ids":      encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "labels":         torch.tensor(label, dtype=torch.long),
        }
def load_training_data():
    texts, labels = [], []
    if os.path.exists(REAL_DATA_PATH):
        with open(REAL_DATA_PATH, encoding="utf-8") as f:
            real = json.load(f)
        for msg in real.get("messages", []):
            text = msg.get("text", "").strip()
            label = msg.get("label", "safe")
            if text:
                texts.append(text)
                labels.append(1 if label == "fraud" else 0)
        print(f"  Real data: {len(texts)} messages")
    if os.path.exists(SYNTHETIC_DATA_PATH):
        count_before = len(texts)
        with open(SYNTHETIC_DATA_PATH, encoding="utf-8") as f:
            synthetic = json.load(f)
        for conv in synthetic:
            for msg in conv.get("messages", []):
                text = msg.get("text", "").strip()
                label = msg.get("label", "fraud")
                if text:
                    texts.append(text)
                    labels.append(1 if label == "fraud" else 0)
        print(f"  Synthetic data: {len(texts) - count_before} messages")
    max_samples = env_int("BERT_MAX_SAMPLES", BERT_MAX_SAMPLES)
    if len(texts) > max_samples:
        print(f"  Dataset too large for BERT ({len(texts)} samples). Balanced subsampling...")
        from sklearn.model_selection import train_test_split
        fraud_texts = [t for t, l in zip(texts, labels) if l == 1]
        fraud_labels = [1] * len(fraud_texts)
        safe_texts = [t for t, l in zip(texts, labels) if l == 0]
        safe_labels = [0] * len(safe_texts)
        n_per_class = max_samples // 2
        if len(fraud_texts) > n_per_class:
            fraud_texts, _, fraud_labels, _ = train_test_split(
                fraud_texts, fraud_labels,
                train_size=n_per_class,
                random_state=RANDOM_SEED,
            )
        if len(safe_texts) > n_per_class:
            safe_texts, _, safe_labels, _ = train_test_split(
                safe_texts, safe_labels,
                train_size=n_per_class,
                random_state=RANDOM_SEED,
            )
        texts = fraud_texts + safe_texts
        labels = fraud_labels + safe_labels
        print(f"  Subsampled to {len(texts)} samples (fraud: {sum(labels)}, safe: {len(labels) - sum(labels)})")
    return texts, labels
def compute_metrics(eval_pred):
    from sklearn.metrics import accuracy_score, precision_recall_fscore_support
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, predictions, average="binary", zero_division=0
    )
    acc = accuracy_score(labels, predictions)
    return {
        "accuracy": acc,
        "f1": f1,
        "precision": precision,
        "recall": recall,
    }
def train():
    print("\n" + "=" * 60)
    print("FRAUD SENTINEL - DISTILBERT TRAINING")
    print("=" * 60)
    try:
        from transformers import (
            DistilBertTokenizer,
            DistilBertForSequenceClassification,
            Trainer,
            TrainingArguments,
        )
    except ImportError:
        print("\nERROR: transformers library not installed.")
        print("Install with: pip install transformers torch")
        return
    print("\n[1/5] Loading training data...")
    texts, labels = load_training_data()
    if not texts:
        print("ERROR: No training data found. Run run_pipeline.py first.")
        return
    total   = len(labels)
    n_fraud = sum(labels)
    n_safe  = total - n_fraud
    print(f"\n  Total: {total}  |  Fraud: {n_fraud}  |  Safe: {n_safe}")
    device_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    print(f"  Torch: {torch.__version__}  |  CUDA available: {torch.cuda.is_available()}  |  Device: {device_name}")
    print("\n[2/5] Loading tokenizer...")
    tokenizer = DistilBertTokenizer.from_pretrained(BERT_MODEL_NAME)
    print("[3/5] Splitting data...")
    from sklearn.model_selection import train_test_split
    stratify = labels if n_fraud > 1 and n_safe > 1 else None
    train_texts, eval_texts, train_labels, eval_labels = train_test_split(
        texts, labels,
        test_size=TEST_SPLIT_SIZE,
        random_state=RANDOM_SEED,
        stratify=stratify,
    )
    print(f"  Train: {len(train_texts)}  |  Eval: {len(eval_texts)}")
    max_length = env_int("BERT_MAX_LENGTH", BERT_MAX_LENGTH)
    train_batch = env_int("BERT_TRAIN_BATCH", BERT_TRAIN_BATCH)
    eval_batch = env_int("BERT_EVAL_BATCH", BERT_EVAL_BATCH)
    grad_accum = env_int("BERT_GRADIENT_ACCUMULATION_STEPS", BERT_GRADIENT_ACCUMULATION_STEPS)
    epochs = env_float("BERT_TRAIN_EPOCHS", BERT_TRAIN_EPOCHS)
    warmup_steps = env_int("BERT_WARMUP_STEPS", BERT_WARMUP_STEPS)
    fp16_enabled = torch.cuda.is_available() and os.getenv("BERT_FP16", "1") != "0"
    print(
        "  Training profile: "
        f"max_length={max_length}, batch={train_batch}, eval_batch={eval_batch}, "
        f"grad_accum={grad_accum}, epochs={epochs}, fp16={fp16_enabled}"
    )
    train_dataset = FraudDataset(train_texts, train_labels, tokenizer, max_length)
    eval_dataset  = FraudDataset(eval_texts, eval_labels, tokenizer, max_length)
    print("[4/5] Loading pre-trained DistilBERT...")
    model = DistilBertForSequenceClassification.from_pretrained(
        BERT_MODEL_NAME,
        num_labels=2,
    )
    if n_fraud > 0 and n_safe > 0:
        weight_safe  = total / (2 * n_safe)
        weight_fraud = total / (2 * n_fraud)
        class_weights = torch.tensor([weight_safe, weight_fraud], dtype=torch.float)
        print(f"  Class weights: safe={weight_safe:.3f}, fraud={weight_fraud:.3f}")
    else:
        class_weights = None
    output_dir = os.path.join(MODEL_DIR, "distilbert_training_output")
    os.environ["TENSORBOARD_LOGGING_DIR"] = os.path.join(output_dir, "logs")
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=train_batch,
        per_device_eval_batch_size=eval_batch,
        gradient_accumulation_steps=grad_accum,
        learning_rate=BERT_LEARNING_RATE,
        weight_decay=BERT_WEIGHT_DECAY,
        warmup_steps=warmup_steps,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        logging_steps=50,
        seed=RANDOM_SEED,
        fp16=fp16_enabled,
        dataloader_pin_memory=torch.cuda.is_available(),
        report_to="none",  # Disable wandb/mlflow
    )
    class WeightedTrainer(Trainer):
        def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
            labels = inputs.pop("labels")
            outputs = model(**inputs)
            logits = outputs.logits
            if class_weights is not None:
                loss_fn = torch.nn.CrossEntropyLoss(
                    weight=class_weights.to(logits.device)
                )
            else:
                loss_fn = torch.nn.CrossEntropyLoss()
            loss = loss_fn(logits, labels)
            return (loss, outputs) if return_outputs else loss
    print("\n[5/5] Fine-tuning DistilBERT...")
    trainer = WeightedTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        compute_metrics=compute_metrics,
    )
    trainer.train()
    print("\n  Evaluation Results:")
    eval_results = trainer.evaluate()
    for key, value in eval_results.items():
        if isinstance(value, float):
            print(f"    {key}: {value:.4f}")
        else:
            print(f"    {key}: {value}")
    os.makedirs(SAVE_PATH, exist_ok=True)
    model.save_pretrained(SAVE_PATH)
    tokenizer.save_pretrained(SAVE_PATH)
    print(f"\n  Model saved      -> {SAVE_PATH}")
    print(f"  Tokenizer saved  -> {SAVE_PATH}")
    print("\nDistilBERT training complete.\n")
if __name__ == "__main__":
    train()
