from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

TESTING = os.getenv("CHRONOFRESH_TESTING", "false").lower() == "true"
DATABASE_URL = os.getenv("DATABASE_URL")

if TESTING:
    DATABASE_URL = DATABASE_URL or "sqlite:///:memory:"
elif not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is required. Configure PostgreSQL in backend/.env; "
        "see backend/.env.example."
    )

engine_options = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
