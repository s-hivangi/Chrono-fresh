from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

import socket
from urllib.parse import urlparse

DATABASE_URL = os.getenv("DATABASE_URL")
SQLITE_FALLBACK_URL = "sqlite:///./chronofresh.db"

def is_postgres_available(url_str: str) -> bool:
    try:
        parsed = urlparse(url_str)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1.0)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False

def init_engine():
    if DATABASE_URL and is_postgres_available(DATABASE_URL):
        try:
            temp_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
            with temp_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"Connected to PostgreSQL database at {DATABASE_URL}")
            return temp_engine
        except Exception as err:
            print(f"PostgreSQL connection failed ({err}). Falling back to SQLite.")
    
    print(f"PostgreSQL not reachable. Using local SQLite database: {SQLITE_FALLBACK_URL}")
    return create_engine(
        SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )


engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_mvp_columns() -> None:
    """Add MVP columns when the older development schema already exists."""
    if engine.dialect.name != "postgresql":
        return

    statements = [
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS display_name VARCHAR(100)",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS outcome VARCHAR(20)",
        "ALTER TABLE image_history ADD COLUMN IF NOT EXISTS thumbnail_path VARCHAR",
        "ALTER TABLE image_history ADD COLUMN IF NOT EXISTS original_filename VARCHAR",
        "ALTER TABLE image_history ADD COLUMN IF NOT EXISTS batch_id VARCHAR(64)",
        "ALTER TABLE image_history ADD COLUMN IF NOT EXISTS batch_mode VARCHAR(30)",
        "ALTER TABLE image_history ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'PENDING'",
        "ALTER TABLE image_history ADD COLUMN IF NOT EXISTS error_message VARCHAR",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS days_remaining_display VARCHAR(30)",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS advice VARCHAR",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS refrigeration_trigger BOOLEAN DEFAULT FALSE",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS fifo_priority VARCHAR(40)",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS action_type VARCHAR(40)",
    ]

    with engine.begin() as connection:
        for statement in statements:
            try:
                connection.execute(text(statement))
            except Exception:
                pass


# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
