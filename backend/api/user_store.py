import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from api.database import db
import os
from dotenv import load_dotenv
load_dotenv()
SECRET_KEY = os.environ.get("SECRET_KEY", "fraud-sentinel-super-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
def create_user(username: str, password: str):
    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    try:
        with db() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)", (
                user_id,
                username,
                password_hash.decode(),
                datetime.now().isoformat()
            ))
        return {"status": "user_created", "user_id": user_id}
    except Exception:
        return {"error": "username already exists"}
def verify_user(username: str, password: str):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, password_hash FROM users WHERE username = ?",
            (username,)
        )
        row = cursor.fetchone()
    if not row:
        return None
    stored_hash = row["password_hash"]
    if bcrypt.checkpw(password.encode(), stored_hash.encode()):
        return {"user_id": row["id"]}
    return None
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