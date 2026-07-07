# FraudSentinel

FraudSentinel is an AI-powered fraud intelligence assistant for detecting scams, phishing attempts, impersonation attacks, credential theft, job fraud, financial fraud, suspicious URLs, and social engineering tactics in messages and conversations.

The product is designed as a single-user cybersecurity SaaS prototype: focused, explainable, and action-oriented. It is not an enterprise SOC dashboard, admin console, RBAC system, team workspace, or multi-tenant organization platform.

## What It Answers

A good fraud report should help the user make a decision quickly. FraudSentinel is built around four questions:

- Why was this message flagged?
- What evidence supports the decision?
- How confident is the AI?
- What should the user do next?

## Highlights

- Message and conversation-level fraud analysis
- Hybrid AI scoring with classical ML, DistilBERT, behavioral signals, and calibrated guardrails
- Evidence-based intelligence reports with threat assessment, scam classification, plain-English explanation, findings, annotated message, confidence analysis, and recommended actions
- Guardrails that prevent benign short text such as `hello` from becoming high risk
- Local SQLite support for development and PostgreSQL/Supabase support for production
- Authenticated user flow with analysis history, profile, settings, and theme switching
- Dark-mode-first UI with a light theme option
- Local inline SVG icon system with no Google Material Symbols dependency

## Product Scope

FraudSentinel is for individual users who want to check suspicious:

- SMS or WhatsApp-style messages
- Emails
- Banking or KYC alerts
- Job offers
- Payment requests
- Investment or crypto pitches
- Suspicious links
- Multi-message conversations

Out of scope:

- Enterprise SOC operations
- Admin dashboards
- Team management
- Role-based access control
- Multi-tenant organizations
- SIEM/SOAR workflows

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Framer Motion |
| Backend | FastAPI, SQLAlchemy |
| Database | SQLite locally, PostgreSQL/Supabase in production |
| Classical ML | TF-IDF, Logistic Regression |
| Transformer | DistilBERT |
| ML Runtime | PyTorch, CUDA-capable training path |
| Charts | Recharts |
| Auth | JWT-based auth |
| Deployment Targets | Vercel frontend, Render backend, Supabase database |

## Repository Structure

```text
fraud-sentinelV2/
|-- backend/
|   |-- api/                  # FastAPI routes, auth, conversation and feedback APIs
|   |-- core/                 # Feature extraction, behavior engine, risk pipeline
|   |-- database/             # SQLAlchemy connection, models, schemas
|   |-- data_pipeline/        # Dataset ingestion, normalization, balancing, synthesis
|   |-- models/               # Training, prediction, calibration scripts
|   |-- services/             # Runtime metrics and service helpers
|   `-- tests/                # Guardrail and model behavior tests
|-- frontend/
|   |-- src/
|   |   |-- components/       # Motion helpers and local icon bridge
|   |   |-- context/          # Auth and theme providers
|   |   |-- pages/            # Product pages and authenticated app pages
|   |   `-- services/         # API client
|   `-- package.json
|-- DEPLOYMENT.md
|-- Dockerfile
`-- README.md
```

## Core Product Flow

1. User signs in or registers.
2. User submits a suspicious message or conversation.
3. Backend extracts text, URL, behavioral, and conversation signals.
4. Hybrid model produces a calibrated fraud score.
5. Guardrails prevent high-risk labels without evidence.
6. The app shows a human-readable result.
7. User can open an intelligence report, review evidence, give feedback, and revisit the analysis from history.

## Model Architecture

FraudSentinel uses a hybrid scoring pipeline:

| Component | Role |
|---|---|
| TF-IDF + Logistic Regression | Fast interpretable baseline classification |
| DistilBERT | Semantic classification for nuanced scam language |
| Behavioral Signal Extractor | Detects urgency, authority, fear, credential intent, link risk, and related signals |
| Evidence Guardrails | Prevents high-risk results without meaningful fraud evidence |
| Calibration Layer | Converts raw model outputs into safer user-facing risk levels |

The final score is not a raw model probability. It is a calibrated decision combining model output, behavioral evidence, signal strength, conversation context, and safety caps.

## Risk Levels

| Level | Rule |
|---|---|
| SAFE | Score below `0.30` |
| MEDIUM | Score from `0.30` to below `0.65` |
| HIGH | Score at least `0.65` and strong fraud evidence exists |

Guardrail score caps:

| Guardrail | Cap |
|---|---:|
| No behavioral signals | `0.15` |
| No fraud evidence | `0.25` |
| Weak evidence only | `0.45` |
| Benign short message | `0.02` to `0.08` |

## Dataset Analytics

Latest data pipeline run:

| Metric | Count |
|---|---:|
| Raw records after deduplication | 137,382 |
| Real training records | 91,542 |
| Validation records | 10,170 |
| Synthetic conversations | 1,800 |
| Synthetic messages | 8,693 |
| Total Logistic Regression training tuples | 100,235 |
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

Synthetic data covers both safe and fraudulent conversations across banking scams, UPI/payment scams, job fraud, loan scams, crypto/investment fraud, delivery scams, government KYC scams, and tech-support style fraud.

## Training Analytics

### Logistic Regression

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

Evaluation:

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

## Guardrail Examples

Latest sanity-check outputs:

| Input | Fraud Probability | Risk |
|---|---:|---|
| `hello` | 0.0350 | SAFE |
| `hi` | 0.0350 | SAFE |
| `are you free` | 0.0650 | SAFE |
| `The bank confirmed my account is safe and no action is needed.` | 0.0107 | SAFE |
| `Your account will be blocked. Send OTP immediately.` | 0.9664 | HIGH RISK |
| `Transfer the processing fee now to secure your job offer.` | 0.7906 | HIGH RISK |

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Git
- Optional: CUDA-capable NVIDIA GPU for transformer training

### 1. Clone

```bash
git clone https://github.com/Saksham-189/fraud-sentinel.git
cd fraud-sentinel
```

### 2. Backend

Windows PowerShell:

```powershell
cd backend
py -3.12 -m venv .venv312
.\.venv312\Scripts\python.exe -m pip install --upgrade pip
.\.venv312\Scripts\python.exe -m pip install -r requirements.txt
.\.venv312\Scripts\python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"healthy","database":"connected"}
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

## Environment Variables

Backend:

| Variable | Required | Purpose |
|---|---|---|
| `SECRET_KEY` | Production yes | JWT signing secret |
| `DATABASE_URL` | Optional | SQLAlchemy database URL. Defaults to local SQLite |
| `ENV` | Optional | Set to `production` to enable production-only behavior such as HTTPS redirects |

Frontend:

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Production yes | Backend API URL. Defaults to `/api` for local Vite proxy use |

Example local `.env`:

```env
SECRET_KEY=replace-this-in-production
DATABASE_URL=sqlite:///fraud.db
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Never commit real production secrets.

## Data Pipeline

Run the full processing pipeline:

```powershell
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

Data and trained model artifacts are intentionally excluded from Git when they are large or generated. Rebuild them locally or provide them through your deployment artifact strategy.

## Training Commands

Train Logistic Regression:

```powershell
backend/.venv312/Scripts/python.exe backend/models/train_model.py
```

Train DistilBERT with the 50k GPU profile:

```powershell
$env:BERT_MAX_SAMPLES="50000"
$env:BERT_MAX_LENGTH="192"
$env:BERT_TRAIN_BATCH="8"
$env:BERT_EVAL_BATCH="16"
$env:BERT_GRADIENT_ACCUMULATION_STEPS="4"
$env:BERT_TRAIN_EPOCHS="2"
$env:BERT_FP16="1"
backend/.venv312/Scripts/python.exe backend/models/train_transformer.py
```

Recalibrate thresholds:

```powershell
backend/.venv312/Scripts/python.exe backend/models/calibrate_thresholds.py
```

## Verification

Backend tests:

```powershell
backend/.venv312/Scripts/python.exe -m pytest backend/tests
```

Guardrail checks:

```powershell
backend/.venv312/Scripts/python.exe backend/tests/run_guardrail_checks.py
```

API import check:

```powershell
backend/.venv312/Scripts/python.exe -c "import sys; sys.path.insert(0, 'backend'); import api.main; print('api import ok')"
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend production build:

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

Known build note: the frontend currently emits a large chunk warning. This does not block the build, but route-level code splitting would be a good future optimization.

## Security Notes

- Passwords are hashed before storage.
- Auth uses JWT access tokens.
- Forgot-password responses do not return reset tokens to the browser.
- Reset tokens should be delivered by a real email provider before production use.
- `SECRET_KEY` must be replaced in production.
- Local SQLite is convenient for development but should not be used as the only production persistence layer on ephemeral hosting.
- The app is designed for a single-user SaaS flow, not enterprise tenancy isolation.

## Deployment

Recommended production split:

| Component | Target |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Supabase PostgreSQL |

Frontend:

```bash
cd frontend
npm install
npm run build
```

Build output:

```text
frontend/dist
```

Backend:

```bash
cd backend
pip install -r requirements.txt
gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:${PORT:-8000}
```

See `DEPLOYMENT.md` for additional deployment details.

## Current Status

FraudSentinel is a strong college/research-grade AI cybersecurity SaaS prototype. It is suitable for demos, controlled testing, model iteration, and product development.

Before production use, the recommended next steps are:

- Collect real user feedback
- Expand region-specific scam examples
- Add more hard negatives
- Maintain a separate untouched production-style test set
- Add production email delivery for password reset
- Add observability, CI, and release checks
- Add route-level frontend code splitting

## License

No license has been declared yet. Add one before distributing or accepting external contributions.
