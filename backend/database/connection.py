import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)
load_dotenv()

DB_URL = os.environ.get("DATABASE_URL", "sqlite:///fraud.db")

# SQLAlchemy requires the dialect to be 'postgresql://' instead of 'postgres://'
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

# SQLite specific connection arguments
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

# Connection pooling is built into create_engine natively
engine = create_engine(DB_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
