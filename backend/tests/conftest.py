"""
Shared test fixtures.
Key: use StaticPool for in-memory SQLite so all connections share the same DB.
"""
from __future__ import annotations

import io
import os

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "")
os.environ.setdefault("USE_REAL_MODEL", "false")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

import app.database as _db_module  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

# StaticPool makes every SQLAlchemy connection reuse the SAME in-memory DB.
_TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSession = sessionmaker(autocommit=False, autoflush=False, bind=_TEST_ENGINE)

# Patch module-level references so create_all/drop_all use test engine
_db_module.engine = _TEST_ENGINE
_db_module.SessionLocal = _TestSession


def _override_get_db():
    db = _TestSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=_TEST_ENGINE)
    Base.metadata.create_all(bind=_TEST_ENGINE)
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def tiny_jpeg() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (4, 4), color=(200, 80, 60)).save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture()
def single_file(tiny_jpeg):
    return ("file", ("test.jpg", io.BytesIO(tiny_jpeg), "image/jpeg"))
