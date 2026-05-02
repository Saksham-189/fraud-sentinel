# Deployment Guide for FraudSentinel

This guide outlines the steps and requirements for deploying the FraudSentinel application to a production environment (such as Render, Heroku, or a VPS).

## 1. Environment Variables

You must configure the following environment variables in your production environment:

### Backend (API)
- `SECRET_KEY`: A strong, random string used for JWT token signing.
- `DATABASE_URL` (Optional): The connection string for your database (e.g., PostgreSQL). If omitted, the app will fall back to a local SQLite database (`fraud.db`), which may be ephemeral depending on your hosting provider.
- `PORT` (Optional): The port on which the API should listen. Most platforms (like Render/Heroku) inject this automatically.

### Frontend
- `VITE_API_URL`: The full URL to your deployed backend API (e.g., `https://fraud-sentinel-api.onrender.com`). This is required for the frontend to communicate with the backend.

## 2. Model Handling Strategy

**Important:** The fine-tuned DistilBERT model (`models/distilbert_model/`) is very large (~268MB) and is excluded from the GitHub repository via `.gitignore`. 

When deploying, the application will not have this model available immediately. You have a few options:

1. **Fallback (Current Behavior):** If the model is not found, the `predict_transformer` function gracefully falls back to returning a default `0.5` probability. The app will continue to function using the behavioral analysis and LR model.
2. **Download at Build Time:** You can host the model on cloud storage (like AWS S3 or Google Cloud Storage) and add a script to download it during your deployment build process.
3. **Pre-built Docker Image:** You can build a Docker image locally that includes the model, push it to a container registry (like Docker Hub or GitHub Container Registry), and deploy that image.

The Logistic Regression model (`fraud_model.pkl`) and its vectorizer (`vectorizer.pkl`) are small and are not ignored by git. They will be available in production.

## 3. Deployment Steps

### Backend
1. Connect your repository to your hosting provider.
2. Ensure the environment is set to Python or use the provided `Dockerfile`.
3. The application will start using `gunicorn` with `uvicorn` workers, providing a robust production server.

### Frontend
1. The frontend should be deployed as a static site.
2. Build Command: `npm run build` (run within the `frontend` directory).
3. Publish Directory: `frontend/dist`.
4. Ensure you set the `VITE_API_URL` environment variable before building.
