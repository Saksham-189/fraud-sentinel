from fastapi import APIRouter
from sqlalchemy import text
from database.connection import engine
from services.system_metrics import metrics_store
import psutil

router = APIRouter()

# 🔥 STEP 1 — CREATE HEALTH ROUTE
@router.get("/health")
def health_check():
    db_status = "disconnected"
    try:
        # 🔥 STEP 2 — ADD DATABASE CHECK
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        metrics_store.log_error(f"DB Healthcheck failed: {e}")
        
    return {"status": "healthy", "database": db_status}

# 🔥 STEP 4 — CREATE STATUS ENDPOINT
@router.get("/system-status")
def system_status():
    db_status = "disconnected"
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        db_status = "connected"
    except:
        pass
        
    rate = 0
    if metrics_store.total_analyses > 0:
        rate = int((metrics_store.fraud_detections / metrics_store.total_analyses) * 100)
        
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "uptime": metrics_store.get_uptime(),
        "total_requests": metrics_store.total_requests,
        "failed_requests": metrics_store.failed_requests,
        "total_analyses": metrics_store.total_analyses,
        "fraud_detections": metrics_store.fraud_detections,
        "fraud_detection_rate": f"{rate}%",
        "api_latency_ms": int(metrics_store.api_latency_ms),
        "recent_errors": list(metrics_store.recent_errors),
        "recent_activity": list(metrics_store.recent_activity),
        "system": {
            "cpu_usage": f"{psutil.cpu_percent()}%",
            "ram_usage": f"{psutil.virtual_memory().percent}%"
        },
        "version": "2.1.0"
    }
