"""Account authentication and rotating, database-backed refresh sessions."""

from __future__ import annotations

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerificationError, InvalidHashError
from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import get_db
from .models import RefreshSession, User


router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
_bearer = HTTPBearer(auto_error=False)
_hasher = PasswordHasher(type=Type.ID)
_dummy_hash = _hasher.hash("chronofresh-invalid-account")
_access_lifetime = timedelta(minutes=15)
_refresh_lifetime = timedelta(days=30)


def _secret() -> str:
    value = os.getenv("AUTH_TOKEN_SECRET", "")
    if len(value) >= 32:
        return value
    if os.getenv("CHRONOFRESH_TESTING", "false").lower() == "true":
        return "chronofresh-tests-only-fixed-secret-32-chars"
    raise RuntimeError("Set a unique AUTH_TOKEN_SECRET of at least 32 characters in backend/.env")


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _normalized_email(email: str) -> str:
    try:
        return validate_email(email.strip(), check_deliverability=False).normalized.lower()
    except EmailNotValidError as exc:
        raise HTTPException(status_code=422, detail="Enter a valid email address.") from exc


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=1024)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=32, max_length=256)


class UserOut(BaseModel):
    id: int
    email: str
    is_active: bool


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


def _user_out(user: User) -> UserOut:
    return UserOut(id=user.id, email=user.email, is_active=bool(user.is_active))


def _new_tokens(db: Session, user: User) -> TokenPair:
    now = _now()
    refresh_token = secrets.token_urlsafe(48)
    session = RefreshSession(
        id=str(uuid4()),
        user_id=user.id,
        refresh_token_hash=_token_hash(refresh_token),
        expires_at=now + _refresh_lifetime,
    )
    db.add(session)
    db.flush()
    access_token = jwt.encode(
        {
            "sub": str(user.id), "sid": session.id, "typ": "access",
            "iat": now.replace(tzinfo=timezone.utc),
            "exp": (now + _access_lifetime).replace(tzinfo=timezone.utc),
        },
        _secret(),
        algorithm="HS256",
    )
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized()
    try:
        claims = jwt.decode(
            credentials.credentials, _secret(), algorithms=["HS256"],
            options={"require": ["sub", "sid", "typ", "iat", "exp"]},
        )
        if claims.get("typ") != "access":
            raise ValueError("wrong token type")
        user_id = int(claims["sub"])
        session_id = str(claims["sid"])
    except (jwt.PyJWTError, ValueError, TypeError, KeyError) as exc:
        raise _unauthorized() from exc
    session = db.query(RefreshSession).filter(
        RefreshSession.id == session_id,
        RefreshSession.user_id == user_id,
        RefreshSession.revoked_at.is_(None),
        RefreshSession.expires_at > _now(),
    ).first()
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if session is None or user is None:
        raise _unauthorized()
    return user


@router.post("/register", response_model=TokenPair, status_code=201)
def register(payload: Credentials, db: Session = Depends(get_db)):
    email = _normalized_email(payload.email)
    if len(payload.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters.")
    if db.query(User.id).filter(User.normalized_email == email).first():
        raise HTTPException(status_code=409, detail="Unable to create an account with those details.")
    user = User(email=email, normalized_email=email, password_hash=_hasher.hash(payload.password))
    db.add(user)
    try:
        db.flush()
        tokens = _new_tokens(db, user)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Unable to create an account with those details.") from exc
    return tokens


@router.post("/login", response_model=TokenPair)
def login(payload: Credentials, db: Session = Depends(get_db)):
    email = _normalized_email(payload.email)
    user = db.query(User).filter(User.normalized_email == email).first()
    try:
        valid = _hasher.verify(user.password_hash if user else _dummy_hash, payload.password)
    except (VerificationError, InvalidHashError):
        valid = False
    if not user or not user.is_active or not valid:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    tokens = _new_tokens(db, user)
    db.commit()
    return tokens


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    old = db.query(RefreshSession).filter(
        RefreshSession.refresh_token_hash == _token_hash(payload.refresh_token)
    ).with_for_update().first()
    if old is None or old.revoked_at is not None or old.expires_at <= _now():
        raise _unauthorized()
    user = db.query(User).filter(User.id == old.user_id, User.is_active.is_(True)).first()
    if user is None:
        raise _unauthorized()
    old.revoked_at = _now()
    tokens = _new_tokens(db, user)
    new_session = db.query(RefreshSession).filter(
        RefreshSession.refresh_token_hash == _token_hash(tokens.refresh_token)
    ).one()
    old.replaced_by_session_id = new_session.id
    db.commit()
    return tokens


@router.post("/logout", status_code=204)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    session = db.query(RefreshSession).filter(
        RefreshSession.refresh_token_hash == _token_hash(payload.refresh_token),
    ).with_for_update().first()
    if session is not None and session.revoked_at is None:
        session.revoked_at = _now()
        db.commit()
    return None


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return _user_out(user)
