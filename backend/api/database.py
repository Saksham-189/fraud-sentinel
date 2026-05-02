import os
import sqlite3
from contextlib import contextmanager
from dotenv import load_dotenv
load_dotenv()
_db_url = os.environ.get("DATABASE_URL", "sqlite:///fraud.db")
if _db_url.startswith("sqlite:///"):
    _db_path = _db_url.replace("sqlite:///", "")
    DB_PATH = os.path.join(os.path.dirname(__file__), _db_path)
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "fraud.db")
def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn
@contextmanager
def db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
def init_db():
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT, created_at TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, timestamp TEXT, input TEXT, result TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS feedback (conversation_id TEXT, user_id TEXT, is_correct BOOLEAN, reason TEXT, created_at TEXT)")
        try:
            cursor.execute("ALTER TABLE conversations ADD COLUMN user_id TEXT")
        except sqlite3.OperationalError:
            pass
        cursor.execute("CREATE TABLE IF NOT EXISTS dynamic_config (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS dynamic_weights (key TEXT PRIMARY KEY, value REAL, updated_at TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS weight_history (id INTEGER PRIMARY KEY AUTOINCREMENT, old_weights TEXT, new_weights TEXT, timestamp TEXT, reason TEXT)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_conv_timestamp ON conversations(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback(created_at)")