# FraudSentinel

FraudSentinel is an AI-powered fraud intelligence assistant for detecting scam, phishing, impersonation, credential theft, job fraud, financial fraud, and social engineering messages.

The project is built as a single-user cybersecurity SaaS prototype. It combines classical ML, a fine-tuned transformer model, behavioral signal extraction, calibrated thresholds, and evidence-based guardrails so simple benign messages such as `hello` are not incorrectly treated as high-risk fraud.

## Product Scope

FraudSentinel is designed for individual users who want to analyze suspicious messages, URLs, emails, job offers, banking alerts, and conversation snippets.

It is not designed as an enterprise SOC, admin dashboard, team workspace, RBAC system, or multi-tenant organization platform.

Core user questions the product answers:

- Why was this message flagged?
- What evidence supports the decision?
- How confident is the AI?
- What should the user do next?

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI |
| Classical ML | TF-IDF + Logistic Regression |
| Transformer | DistilBERT |
| ML Runtime | PyTorch CUDA |
| Local Database | SQLite |
| Production Database Target | PostgreSQL / Supabase |
| Frontend Deployment Target | Vercel |
| Backend Deployment Target | Render |

## Model Architecture

FraudSentinel uses a hybrid scoring system:

| Component | Purpose |
|---|---|
| TF-IDF + Logistic Regression | Fast interpretable text classification |
| Fine-tuned DistilBERT | Context-aware semantic classification |
| Behavioral signal extractor | Detects urgency, authority, fear, credential intent, and link risk |
| Evidence guardrails | Prevents high-risk labels without fraud evidence |
| Calibration layer | Converts raw signals into safer user-facing risk levels |

The final score is not a raw model output. It is a calibrated hybrid decision that considers model probability, behavioral evidence, conversation stage, and safety caps.

## Dataset Analytics

Latest dataset pipeline run:

| Metric | Count |
|---|---:|
| Raw records after deduplication | 137,382 |
| Real training records | 91,542 |
| Validation records | 10,170 |
| Synthetic conversations | 1,800 |
| Synthetic messages | 8,693 |
| Total LR training tuples | 100,235 |
| DistilBERT training tuples | 50,000 |

Label distribution after deduplication:

| Label | Count |
|---|---:|
| Safe | 86,526 |
| Fraud | 50,856 |

Source distribution after deduplication:

| Source | Count |
|---|---:|
| Legacy phishing CSV | 36,001 |
| Legacy Enron CSV | 35,000 |
| PhreshPhish | 60,000 |
| SpamAssassin ham | 4,196 |
| SpamAssassin spam | 1,817 |
| OpenPhish | 300 |
| Curated short safe messages | 43 |
| Curated hard negatives | 25 |

Synthetic data includes both safe and fraud conversation-style examples across banking scams, UPI/payment scams, job fraud, loan scams, crypto/investment fraud, delivery scams, government KYC scams, and tech-support style fraud.

## Training Analytics

### Logistic Regression

The TF-IDF + Logistic Regression model was trained on the full combined dataset:

| Metric | Value |
|---|---:|
| Training tuples | 100,235 |
| Held-out accuracy | 96.1% |

### DistilBERT

DistilBERT was fine-tuned on a balanced 50,000 tuple dataset using an RTX 3050 Laptop GPU.

| Metric | Value |
|---|---:|
| Total tuples | 50,000 |
| Fraud tuples | 25,000 |
| Safe tuples | 25,000 |
| Train split | 40,000 |
| Eval split | 10,000 |
| Max sequence length | 192 |
| Epochs | 2 |
| Batch size | 8 |
| Gradient accumulation | 4 |
| Effective batch size | 32 |
| Mixed precision | fp16 |
| Training time | About 14.7 minutes |

DistilBERT evaluation results:

| Metric | Value |
|---|---:|
| Accuracy | 98.71% |
| Precision | 99.11% |
| Recall | 98.30% |
| F1 score | 98.70% |

CUDA environment used:

| Item | Value |
|---|---|
| PyTorch | 2.11.0+cu128 |
| CUDA available | True |
| GPU | NVIDIA GeForce RTX 3050 6GB Laptop GPU |

## Calibrated Pipeline Metrics

The calibrated hybrid pipeline was evaluated after retraining DistilBERT.

| Metric | Value |
|---|---:|
| Calibration samples | 3,012 |
| True positives | 1,359 |
| False positives | 10 |
| True negatives | 1,498 |
| False negatives | 145 |
| Precision | 99.27% |
| Recall | 90.36% |
| F1 score | 94.60% |
| False positive rate | 0.66% |
| False negative rate | 9.64% |
| Short safe false positives | 0 |

Current calibrated thresholds:

| Level | Rule |
|---|---|
| SAFE | Score below 0.30 |
| MEDIUM | Score from 0.30 to below 0.65 |
| HIGH | Score at least 0.65 and strong fraud evidence exists |

Guardrail score caps:

| Guardrail | Cap |
|---|---:|
| No behavioral signals | 0.15 |
| No fraud evidence | 0.25 |
| Weak evidence only | 0.45 |
| Benign short message | 0.02 to 0.08 |

## Guardrail Examples

Latest sanity check outputs:

| Input | Fraud Probability | Risk |
|---|---:|---|
| `hello` | 0.0350 | SAFE |
| `hi` | 0.0350 | SAFE |
| `are you free` | 0.0650 | SAFE |
| `The bank confirmed my account is safe and no action is needed.` | 0.0107 | SAFE |
| `Your account will be blocked. Send OTP immediately.` | 0.9664 | HIGH RISK |
| `Transfer the processing fee now to secure your job offer.` | 0.7906 | HIGH RISK |

## Data Pipeline

Main pipeline:

```bash
backend/.venv312/Scripts/python.exe backend/data_pipeline/run_pipeline.py
```

The pipeline performs:

- Raw dataset ingestion
- Text normalization
- Aggressive deduplication
- Label conflict removal
- Safe/fraud balancing
- Validation split generation
- Synthetic conversation generation
- Dataset manifest generation

Important outputs:

| Output | Path |
|---|---|
| Real processed data | `backend/data/processed/real_data.json` |
| Validation data | `backend/data/processed/validation_data.json` |
| Dataset manifest | `backend/data/processed/dataset_manifest.json` |
| Synthetic data | `backend/data/synthetic/synthetic_data.json` |

## Training Commands

Train Logistic Regression:

```bash
backend/.venv312/Scripts/python.exe backend/models/train_model.py
```

Train DistilBERT with the GPU profile:

```bash
set BERT_MAX_SAMPLES=50000
set BERT_MAX_LENGTH=192
set BERT_TRAIN_BATCH=8
set BERT_EVAL_BATCH=16
set BERT_GRADIENT_ACCUMULATION_STEPS=4
set BERT_TRAIN_EPOCHS=2
set BERT_FP16=1
backend/.venv312/Scripts/python.exe backend/models/train_transformer.py
```

Recalibrate thresholds:

```bash
backend/.venv312/Scripts/python.exe backend/models/calibrate_thresholds.py
```

## Verification

Backend tests:

```bash
backend/.venv312/Scripts/python.exe -m pytest backend/tests
```

Guardrail checks:

```bash
backend/.venv312/Scripts/python.exe backend/tests/run_guardrail_checks.py
```

API import check:

```bash
backend/.venv312/Scripts/python.exe -c "import sys; sys.path.insert(0, 'backend'); import api.main; print('api import ok')"
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend build:

```bash
cd frontend
npm run build -- --outDir dist-check --emptyOutDir
```

Latest verification status:

| Check | Status |
|---|---|
| Backend pytest | Passed |
| Guardrail checks | Passed |
| API import | Passed |
| Frontend lint | Passed |
| Frontend production build | Passed |
| Backend source compile check | Passed |

## Project Status

FraudSentinel is currently a strong college/research-grade AI cybersecurity SaaS prototype. The model is suitable for demos, controlled testing, and continued product integration.

For production use, the next step would be collecting real user feedback, expanding region-specific scam examples, adding more hard negatives, and maintaining a separate untouched production-style test set.
