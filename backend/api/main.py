from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from api.feedback_store import save_feedback
from api.feedback_store import update_thresholds
from api.feedback_store import update_behavior_weights
from core.llm_engine import generate_llm_explanation
from api.database import init_db
init_db()
from api.conversation_store import (
    save_conversation,
    get_all_conversations,
    get_conversation,
    append_to_conversation,
    delete_conversation,
)
from api.user_store import create_user, verify_user, create_session
from api.auth import get_current_user
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(
    title="Fraud Sentinel API",
    description="Offline Fraud Detection System",
    version="1.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
@app.get("/health")
def health():
    return {"status": "ok"}
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
@app.post("/register")
def register(req: AuthRequest):
    try:
        user = create_user(req.username, req.password)
        return safe_response(user)
    except Exception as e:
        return safe_response(error=str(e))
@app.post("/login")
def login(req: AuthRequest):
    try:
        result = verify_user(req.username, req.password)
        if not result:
            return safe_response(error="invalid credentials")
        token = create_session(result["user_id"])
        return safe_response({
            "user_id": result["user_id"],
            "token": token
        })
    except Exception as e:
        return safe_response(error=str(e))
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port)