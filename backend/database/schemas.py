from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any

# Auth Schemas
class UserCreate(BaseModel):
    name: str = Field(..., max_length=50, min_length=2, description="User's full name")
    email: EmailStr
    password: str = Field(..., max_length=100, min_length=6, description="Strong password")

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=100)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., max_length=100, min_length=6, description="New strong password")

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str
    last_login: Optional[str] = None
    is_active: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Analysis Schemas
class AnalysisCreate(BaseModel):
    input_text: str = Field(..., max_length=5000, description="Text to analyze, strictly bounded to prevent memory exhaustion")

class AnalysisHistoryResponse(BaseModel):
    id: str
    user_id: str
    input_text: str
    risk_score: float
    threat_level: str
    reasons: Any  # Usually a list of strings
    created_at: str
    
    class Config:
        from_attributes = True
