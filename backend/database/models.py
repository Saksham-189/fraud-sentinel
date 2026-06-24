from sqlalchemy import Column, String, Float, Boolean, Integer, Text
from database.connection import Base
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    created_at = Column(String, default=lambda: datetime.now().isoformat())
    last_login = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    reset_token = Column(String, nullable=True, index=True)
    reset_token_expires = Column(String, nullable=True)
    
    
class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True, nullable=False)
    input_text = Column(Text, nullable=False)
    risk_score = Column(Float, nullable=False)
    threat_level = Column(String, nullable=False)
    reasons = Column(Text, nullable=False) # JSON-encoded list of reasons
    raw_input = Column(Text, nullable=True)   # Preserved JSON for React Insights Panel
    raw_result = Column(Text, nullable=True)  # Preserved JSON for React Insights Panel
    created_at = Column(String, default=lambda: datetime.now().isoformat(), index=True)

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String, index=True)
    user_id = Column(String)
    is_correct = Column(Boolean)
    reason = Column(Text, nullable=True)
    created_at = Column(String, default=lambda: datetime.now().isoformat(), index=True)

class DynamicConfig(Base):
    __tablename__ = "dynamic_config"
    key = Column(String, primary_key=True)
    value = Column(Text)
    updated_at = Column(String, default=lambda: datetime.now().isoformat())

class DynamicWeight(Base):
    __tablename__ = "dynamic_weights"
    key = Column(String, primary_key=True)
    value = Column(Float)
    updated_at = Column(String, default=lambda: datetime.now().isoformat())

class WeightHistory(Base):
    __tablename__ = "weight_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    old_weights = Column(Text)
    new_weights = Column(Text)
    timestamp = Column(String, default=lambda: datetime.now().isoformat())
    reason = Column(Text)
