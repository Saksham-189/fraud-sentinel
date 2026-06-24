import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from database.connection import SessionLocal
from database.models import User
import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.environ.get("SECRET_KEY", "fraud-sentinel-super-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def create_user(username: str, password: str):
    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    
    db = SessionLocal()
    try:
        new_user = User(
            id=user_id,
            username=username,
            password_hash=password_hash.decode(),
            created_at=datetime.now().isoformat()
        )
        db.add(new_user)
        db.commit()
        return {"status": "user_created", "user_id": user_id}
    except Exception:
        db.rollback()
        return {"error": "username already exists"}
    finally:
        db.close()

def verify_user(username: str, password: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
        stored_hash = user.password_hash
        if bcrypt.checkpw(password.encode(), stored_hash.encode()):
            return {"user_id": user.id}
        return None
    finally:
        db.close()

def create_session(user_id: str):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"user_id": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_from_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        return user_id
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None