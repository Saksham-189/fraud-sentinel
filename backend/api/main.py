from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel
from typing import List, Optional
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from api.feedback_store import save_feedback
from api.feedback_store import update_thresholds
from api.feedback_store import update_behavior_weights
from core.llm_engine import generate_llm_explanation
from database.connection import engine, Base
import database.models  # Register models on Base
from api.conversation_store import (
    save_conversation,
    get_all_conversations,
    get_conversation,
    append_to_conversation,
    delete_conversation,
)
from database.schemas import UserCreate, UserLogin, UserResponse, Token
from api.auth import hash_password, verify_password, create_access_token, get_current_user, get_current_user_object
from database.connection import get_db
from database.models import User, AnalysisHistory
from sqlalchemy.orm import Session
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from middleware.metrics import MetricsMiddleware
from api.routes import system
from services.system_metrics import metrics_store
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_allowed_origins() -> list[str]:
    defaults = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://fraud-sentinel-seven.vercel.app",
        "https://fraud-sentinel-production-34ee.up.railway.app",
    ]
    configured = []
    for key in ("FRONTEND_URL", "CORS_ORIGINS"):
        raw_value = os.environ.get(key, "")
        configured.extend(origin.strip() for origin in raw_value.split(",") if origin.strip())
    return sorted(set(defaults + configured))

app = FastAPI(
    title="Fraud Sentinel API",
    description="Offline Fraud Detection System",
    version="1.0"
)

# 🚀 STEP 20 — RATE LIMIT LOGIN (SlowAPI)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 🚀 STEP 22 — ENABLE HTTPS ONLY (Conditional for prod)
if os.environ.get("ENV") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

@app.on_event("startup")
def startup_event():
    logger.info("Starting API Server...")
    if str(engine.url).startswith("postgresql"):
        logger.info("Connected to PostgreSQL (Supabase)")
    else:
        logger.info("Using local SQLite database")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully via SQLAlchemy.")
    
app.include_router(system.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class MessageRequest(BaseModel):
    text: str
class ConversationMessage(BaseModel):
    text: str
class ConversationRequest(BaseModel):
    conversation_id: str = "api_input"
    messages: List[ConversationMessage]
class ContinueConversationRequest(BaseModel):
    message: str
class FeedbackRequest(BaseModel):
    conversation_id: str
    is_correct: bool
    reason: Optional[str] = None
class AuthRequest(BaseModel):
    username: str
    password: str
class SaveConversationRequest(BaseModel):
    input: dict
    result: dict
from sqlalchemy import text
from core.pipeline import run_analysis_pipeline
@app.post("/analyze-message")
def analyze_message(req: MessageRequest, user_id: str = Depends(get_current_user)):
    check_rate_limit(user_id)
    if not req.text or len(req.text) > 5000:
        return safe_response(error="invalid input")
    conversation = {
        "conversation_id": "single_message",
        "messages": [{"text": req.text}]
    }
    try:
        result = run_analysis_pipeline(conversation)
        if result.get("error"):
            return safe_response(error=result["error"])
            
        metrics_store.total_analyses += 1
        fraud_prob = result.get("fraud_probability", result.get("final_score", 0.0))
        if fraud_prob > 0.5:
            metrics_store.fraud_detections += 1
            metrics_store.log_activity("HIGH risk message detected")
        else:
            metrics_store.log_activity("SAFE message processed")
            
        conv_id = save_conversation(
            {"type": "message", "text": req.text},
            result,
            user_id
        )
        result["conversation_id"] = conv_id
        result["user_id"] = user_id
        return safe_response(result)
    except Exception as e:
        logging.error(f"[Analyze Message Error] {e}")
        return safe_response(error="Analysis unavailable due to an internal error.")
@app.post("/analyze-conversation")
def analyze_conversation(req: ConversationRequest, user_id: str = Depends(get_current_user)):
    check_rate_limit(user_id)
    if not req.messages or len(req.messages) == 0:
        return safe_response(error="invalid input")
    for m in req.messages:
        if not m.text or len(m.text) > 5000:
            return safe_response(error="invalid input")
    conversation = {
        "conversation_id": req.conversation_id,
        "messages": [{"text": m.text} for m in req.messages]
    }
    try:
        result = run_analysis_pipeline(conversation)
        if result.get("error"):
            return safe_response(error=result["error"])
            
        metrics_store.total_analyses += 1
        fraud_prob = result.get("fraud_probability", result.get("final_score", 0.0))
        if fraud_prob > 0.5:
            metrics_store.fraud_detections += 1
            metrics_store.log_activity("HIGH risk conversation detected")
        else:
            metrics_store.log_activity("SAFE conversation processed")
            
        conv_id = save_conversation(conversation, result, user_id)
        result["conversation_id"] = conv_id
        result["user_id"] = user_id
        return safe_response(result)
    except Exception as e:
        logging.error(f"[Analyze Conversation Error] {e}")
        return safe_response(error="Analysis unavailable due to an internal error.")
@app.get("/history")
def get_history(user_id: str = Depends(get_current_user)):
    return safe_response(get_all_conversations(user_id))
@app.get("/conversations")
def list_conversations(user_id: str = Depends(get_current_user)):
    return safe_response(get_all_conversations(user_id))
@app.post("/save-conversation")
def save_conversation_route(req: SaveConversationRequest, user_id: str = Depends(get_current_user)):
    conv_id = save_conversation(req.input, req.result, user_id)
    return safe_response({"conversation_id": conv_id, "status": "saved"})
@app.get("/history/{conv_id}")
def get_single(conv_id: str, user_id: str = Depends(get_current_user)):
    record = get_conversation(conv_id, user_id)
    if record is None:
        return safe_response(error="Conversation not found")
    return safe_response(record)
@app.put("/conversations/{conv_id}")
def continue_conversation(conv_id: str, req: ContinueConversationRequest, user_id: str = Depends(get_current_user)):
    check_rate_limit(user_id)
    record = get_conversation(conv_id, user_id)
    if not record:
        return safe_response(error="Conversation not found")
    conv_input = record.get("input") or {}
    messages = list(conv_input.get("messages") or [])
    if conv_input.get("text") and not messages:
        messages = [{"text": conv_input["text"]}]
    messages.append({"text": req.message})
    conversation = {
        "conversation_id": conv_id,
        "messages": messages
    }
    try:
        result = run_analysis_pipeline(conversation)
        if result.get("error"):
            return safe_response(error=result["error"])
        updated_record = append_to_conversation(conv_id, {"text": req.message}, result, user_id)
        result["conversation_id"] = conv_id
        result["user_id"] = user_id
        return safe_response(result)
    except Exception as e:
        logging.error(f"[Continue Conversation Error] {e}")
        return safe_response(error="Analysis unavailable due to an internal error.")
@app.delete("/conversations/{conv_id}")
def delete_conversation_route(conv_id: str, user_id: str = Depends(get_current_user)):
    success = delete_conversation(conv_id, user_id)
    if not success:
        return safe_response(error="Conversation not found")
    return safe_response({"status": "deleted"})
import time
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
_RATE_LIMITS = {}
def check_rate_limit(user_id: str, cooldown_sec: int = 2):
    now = time.time()
    last = _RATE_LIMITS.get(user_id, 0)
    if now - last < cooldown_sec:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
    _RATE_LIMITS[user_id] = now
def safe_response(data: dict = None, error: str = None):
    return {
        "success": error is None,
        "data": data or {},
        "error": error
    }
@app.post("/feedback")
def submit_feedback(req: FeedbackRequest, user_id: str = Depends(get_current_user)):
    check_rate_limit(user_id, cooldown_sec=1)
    try:
        from api.feedback_store import save_feedback
        save_feedback({
            "conversation_id": req.conversation_id,
            "user_id": user_id,
            "is_correct": req.is_correct,
            "reason": req.reason or ""
        })
        logging.info(f"Feedback stored for conversation {req.conversation_id} by {user_id}")
        return safe_response({"status": "Feedback recorded successfully"})
    except Exception as e:
        logging.error(f"[Feedback API Error] {e}")
        return safe_response(error="Failed to store feedback")
from database.schemas import ForgotPasswordRequest, ResetPasswordRequest
import secrets
from datetime import timedelta

@app.post("/auth/register")
@limiter.limit("5/minute")
def register(request: Request, req: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == req.email).first()
        if db_user:
            return safe_response(error="Email already registered")
        
        hashed_password = hash_password(req.password)
        new_user = User(
            name=req.name,
            email=req.email,
            hashed_password=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        access_token = create_access_token(data={"sub": new_user.email})
        return safe_response({
            "access_token": access_token,
            "token": access_token, # UI compatibility
            "token_type": "bearer",
            "user_id": new_user.id
        })
    except Exception as e:
        db.rollback()
        return safe_response(error=str(e))

@app.post("/auth/login")
@limiter.limit("10/minute")
def login(request: Request, req: UserLogin, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == req.email).first()
        if not db_user or not verify_password(req.password, db_user.hashed_password):
            return safe_response(error="Invalid credentials")
        
        db_user.last_login = datetime.now().isoformat()
        db.commit()
        
        access_token = create_access_token(data={"sub": db_user.email})
        return safe_response({
            "access_token": access_token,
            "token": access_token, # UI compatibility
            "token_type": "bearer",
            "user_id": db_user.id
        })
    except Exception as e:
        db.rollback()
        return safe_response(error=str(e))

@app.post("/auth/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == req.email).first()
    if not db_user:
        # Prevent email enumeration
        return safe_response({"status": "If an account exists, a reset link was sent."})
    
    token = secrets.token_urlsafe(32)
    db_user.reset_token = token
    db_user.reset_token_expires = (datetime.now() + timedelta(minutes=15)).isoformat()
    db.commit()
    
    # 🔥 STEP 23 — MOCK EMAIL VERIFICATION
    if os.environ.get("ENV") != "production":
        logger.info(f"[EMAIL SERVICE] Password reset token generated for {req.email}")
    
    return safe_response({"status": "If an account exists, a reset link was sent."})

@app.post("/auth/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, req: ResetPasswordRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.reset_token == req.token).first()
    if not db_user:
        return safe_response(error="Invalid or expired token")
        
    if db_user.reset_token_expires and datetime.fromisoformat(db_user.reset_token_expires) < datetime.now():
        return safe_response(error="Token expired")
        
    db_user.hashed_password = hash_password(req.new_password)
    db_user.reset_token = None
    db_user.reset_token_expires = None
    db.commit()
    
    return safe_response({"status": "Password reset successful"})

@app.get("/auth/me")
def read_users_me(current_user: User = Depends(get_current_user_object)):
    return safe_response({
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login,
        "is_active": current_user.is_active
    })

@app.post("/auth/logout")
def logout():
    return safe_response({"status": "Successfully logged out"})

import json as _json

@app.get("/dashboard-stats")
def dashboard_stats(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return aggregated dashboard statistics for the current user."""
    try:
        records = (
            db.query(AnalysisHistory)
            .filter(AnalysisHistory.user_id == user_id)
            .order_by(AnalysisHistory.created_at.desc())
            .all()
        )

        total_analyses = len(records)
        high_risk = 0
        medium_risk = 0
        safe_count = 0

        for r in records:
            tl = (r.threat_level or "").upper()
            if "HIGH" in tl:
                high_risk += 1
            elif "MEDIUM" in tl:
                medium_risk += 1
            else:
                safe_count += 1

        # Recent analyses (top 5, lightweight fields)
        recent_analyses = []
        for r in records[:5]:
            recent_analyses.append({
                "id": r.id,
                "input_text": (r.input_text or "")[:120],
                "threat_level": r.threat_level,
                "risk_score": r.risk_score,
                "created_at": r.created_at,
            })

        # Top scam types from raw_result feature scores
        FEATURE_DISPLAY = {
            "urgency": "Urgency Language",
            "fear": "Fear / Threat Tactics",
            "authority": "Authority Impersonation",
            "credential_intent": "Credential Request",
            "link_risk": "Suspicious Links",
        }
        feature_counts: dict[str, int] = {k: 0 for k in FEATURE_DISPLAY}

        for r in records:
            if not r.raw_result:
                continue
            try:
                raw = _json.loads(r.raw_result)
            except (ValueError, TypeError):
                continue

            features_list: list[dict] = []
            msgs = raw.get("messages_analysis")
            if isinstance(msgs, list):
                for msg in msgs:
                    feats = msg.get("features") if isinstance(msg, dict) else None
                    if isinstance(feats, dict):
                        features_list.append(feats)
            else:
                top_feats = raw.get("features")
                if isinstance(top_feats, dict):
                    features_list.append(top_feats)

            for feats in features_list:
                for key in FEATURE_DISPLAY:
                    try:
                        if float(feats.get(key, 0)) > 0.4:
                            feature_counts[key] += 1
                    except (ValueError, TypeError):
                        pass

        top_scam_types = sorted(
            [{"name": FEATURE_DISPLAY[k], "count": v} for k, v in feature_counts.items() if v > 0],
            key=lambda x: x["count"],
            reverse=True,
        )[:5]

        return safe_response({
            "total_analyses": total_analyses,
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "safe": safe_count,
            "recent_analyses": recent_analyses,
            "top_scam_types": top_scam_types,
        })
    except Exception as e:
        logging.error(f"[Dashboard Stats Error] {e}")
        return safe_response(error="Failed to load dashboard stats.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port)
