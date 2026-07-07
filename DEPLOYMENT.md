# Deployment Guide for FraudSentinel

FraudSentinel is deployed as two services:

- Backend: FastAPI API service
- Frontend: React/Vite web service

The hosted SaaS flow requires the frontend to call the backend API. It is not an offline-only product.

## Environment Variables

### Backend

Set these on the backend service:

| Variable | Required | Purpose |
| --- | --- | --- |
| `SECRET_KEY` | Yes | JWT signing secret. Use a long random value. |
| `DATABASE_URL` | Recommended | PostgreSQL connection string. Railway/Postgres can provide this automatically. |
| `FRONTEND_URL` | Recommended | Public frontend URL used for CORS. Example: `https://fraud-sentinel-production-34ee.up.railway.app` |
| `CORS_ORIGINS` | Optional | Comma-separated list of additional allowed frontend origins. |
| `ENV` | Optional | Set to `production` only when HTTPS redirect behavior is desired. |

### Frontend

Set this on the frontend service:

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Public backend API URL. Example: `https://your-backend.up.railway.app` |

Do not point `VITE_API_BASE_URL` to the frontend URL. It must be the backend service public domain.

## Railway Notes

### Backend service

- Use the backend service root or backend Dockerfile, depending on the Railway service configuration.
- Public networking should expose port `8000`.
- After adding a Railway Postgres service, set `DATABASE_URL` from the Postgres shared variable.

### Frontend service

- Use the `frontend` directory as the service root when deploying only the web app.
- The frontend start script runs Vite preview on port `5173`.
- Public networking should expose port `5173`.
- The Railway frontend host must be present in `preview.allowedHosts` in `frontend/vite.config.js`.

## Model Artifacts

Large trained model artifacts are intentionally excluded from Git. Production deployments can run with available lightweight behavior and guardrail logic, but best model quality requires shipping the trained artifacts through one of these strategies:

1. Store model artifacts in cloud storage and download them during deployment.
2. Build a private Docker image that already contains the model artifacts.
3. Mount or attach persistent storage if supported by the hosting environment.

If a model artifact is unavailable, the backend should treat fallback model output as uncertainty rather than strong fraud evidence.

## Frontend Build

From `frontend`:

```bash
npm install
npm run build
```

For Railway runtime:

```bash
npm start
```

## Backend Smoke Test

After deployment, verify:

```text
GET /health
GET /docs
```

Then test the main product flow:

1. Register or log in.
2. Analyze a benign short message such as `hello`.
3. Analyze a high-risk message with explicit evidence, such as an OTP request and suspicious link.
4. Open History.
5. Open the Intelligence Report for the analysis.
