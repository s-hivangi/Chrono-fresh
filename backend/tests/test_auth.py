"""Authentication, guest behavior, and cross-account data isolation."""

from __future__ import annotations

import io
from datetime import datetime, timedelta, timezone

import jwt

from app.auth import _secret
from app.database import SessionLocal
from app.models import ImageHistory, Product, RefreshSession, User


def register(client, email="person@example.com", password="test-password-123"):
    return client.post("/api/v1/auth/register", json={"email": email, "password": password})


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def test_registration_normalizes_email_and_hashes_password(guest_client):
    response = register(guest_client, "  Person@Example.COM  ")
    assert response.status_code == 201
    tokens = response.json()
    assert tokens["access_token"] and tokens["refresh_token"]
    me = guest_client.get("/api/v1/auth/me", headers=bearer(tokens["access_token"]))
    assert me.json()["email"] == "person@example.com"
    with SessionLocal() as db:
        user = db.query(User).filter(User.normalized_email == "person@example.com").one()
        assert user.password_hash != "test-password-123"
        assert user.password_hash.startswith("$argon2id$")
        session = db.query(RefreshSession).filter(RefreshSession.user_id == user.id).one()
        assert session.refresh_token_hash != tokens["refresh_token"]
        assert len(session.refresh_token_hash) == 64


def test_duplicate_malformed_and_weak_registration(guest_client):
    assert register(guest_client).status_code == 201
    duplicate = register(guest_client, " PERSON@example.com ")
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Unable to create an account with those details."
    assert register(guest_client, "not-an-email").status_code == 422
    assert register(guest_client, "short@example.com", "short").status_code == 422


def test_login_generic_failure_and_success(guest_client):
    register(guest_client)
    wrong = guest_client.post("/api/v1/auth/login", json={"email": "person@example.com", "password": "wrong-pass"})
    unknown = guest_client.post("/api/v1/auth/login", json={"email": "missing@example.com", "password": "wrong-pass"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json() == {"detail": "Invalid email or password."}
    good = guest_client.post("/api/v1/auth/login", json={"email": "PERSON@EXAMPLE.COM", "password": "test-password-123"})
    assert good.status_code == 200
    assert guest_client.get("/api/v1/auth/me", headers=bearer(good.json()["access_token"])).status_code == 200


def test_missing_and_expired_access_tokens(guest_client):
    assert guest_client.get("/api/v1/auth/me").status_code == 401
    tokens = register(guest_client).json()
    claims = jwt.decode(tokens["access_token"], _secret(), algorithms=["HS256"])
    claims["exp"] = datetime.now(timezone.utc) - timedelta(seconds=1)
    expired = jwt.encode(claims, _secret(), algorithm="HS256")
    assert guest_client.get("/api/v1/auth/me", headers=bearer(expired)).status_code == 401


def test_refresh_rotation_reuse_and_logout(guest_client):
    first = register(guest_client).json()
    refreshed = guest_client.post("/api/v1/auth/refresh", json={"refresh_token": first["refresh_token"]})
    assert refreshed.status_code == 200
    second = refreshed.json()
    assert second["refresh_token"] != first["refresh_token"]
    assert guest_client.post("/api/v1/auth/refresh", json={"refresh_token": first["refresh_token"]}).status_code == 401
    assert guest_client.get("/api/v1/auth/me", headers=bearer(first["access_token"])).status_code == 401
    assert guest_client.get("/api/v1/auth/me", headers=bearer(second["access_token"])).status_code == 200
    logout = guest_client.post(
        "/api/v1/auth/logout", json={"refresh_token": second["refresh_token"]},
        headers=bearer(second["access_token"]),
    )
    assert logout.status_code == 204
    assert guest_client.post("/api/v1/auth/refresh", json={"refresh_token": second["refresh_token"]}).status_code == 401
    assert guest_client.get("/api/v1/auth/me", headers=bearer(second["access_token"])).status_code == 401


def test_guest_can_analyze_but_cannot_save_or_read_history(guest_client, tiny_jpeg):
    response = guest_client.post(
        "/api/v1/analyze",
        files=[("file", ("banana.jpg", io.BytesIO(tiny_jpeg), "image/jpeg"))],
        data={"produce_type": "banana"},
    )
    assert response.status_code == 200
    assert response.json()["analysis_token"]
    assert guest_client.get("/history").status_code == 401
    assert guest_client.get("/api/v1/produce").status_code == 401
    assert guest_client.get("/api/v1/dashboard").status_code == 401
    assert guest_client.post(
        "/api/v1/produce",
        files=[("file", ("banana.jpg", io.BytesIO(tiny_jpeg), "image/jpeg"))],
        data={"produce_type": "banana", "analysis_token": response.json()["analysis_token"]},
    ).status_code == 401
    with SessionLocal() as db:
        assert db.query(Product).count() == 0
        assert db.query(ImageHistory).count() == 0


def test_cross_account_queries_mutations_and_signed_media(client, guest_client, tiny_jpeg):
    created = client.post(
        "/api/v1/produce",
        files=[("file", ("banana.jpg", io.BytesIO(tiny_jpeg), "image/jpeg"))],
        data={"produce_type": "banana"},
    )
    assert created.status_code == 201
    product_id = created.json()["product_id"]
    own_history = client.get(f"/api/v1/produce/{product_id}/history").json()
    media_url = own_history[0]["thumbnail_url"]
    assert client.get(media_url).status_code == 200
    assert guest_client.get(media_url.split("?")[0]).status_code in (404, 422)
    b = register(guest_client, "other@example.com").json()
    headers = bearer(b["access_token"])
    assert guest_client.get("/api/v1/produce", headers=headers).json() == []
    assert guest_client.get("/history", headers=headers).json() == []
    assert guest_client.get("/api/v1/dashboard", headers=headers).json()["stats"]["active_count"] == 0
    assert guest_client.get("/api/v1/analytics", headers=headers).json()["total_scans"] == 0
    for path in (
        f"/api/v1/produce/{product_id}",
        f"/api/v1/produce/{product_id}/history",
        f"/api/v1/produce/{product_id}/timeline",
        f"/products/{product_id}",
    ):
        assert guest_client.get(path, headers=headers).status_code == 404
    assert guest_client.patch(f"/api/v1/produce/{product_id}", json={"display_name": "stolen"}, headers=headers).status_code == 404
    assert guest_client.post(f"/api/v1/produce/{product_id}/complete", json={"outcome": "consumed"}, headers=headers).status_code == 404
    assert guest_client.post(
        f"/api/v1/produce/{product_id}/rescan",
        files=[("file", ("b.jpg", io.BytesIO(tiny_jpeg), "image/jpeg"))],
        headers=headers,
    ).status_code == 404
    assert guest_client.post(
        "/upload", files=[("files", ("b.jpg", io.BytesIO(tiny_jpeg), "image/jpeg"))],
        data={"product_id": product_id}, headers=headers,
    ).status_code == 404


def test_login_again_restores_only_own_database_history(client, guest_client, tiny_jpeg):
    saved = client.post(
        "/api/v1/produce",
        files=[("file", ("a.jpg", io.BytesIO(tiny_jpeg), "image/jpeg"))],
        data={"produce_type": "guava"},
    )
    assert saved.status_code == 201
    first_user_history = client.get("/history").json()
    assert len(first_user_history) == 1
    b = register(guest_client, "second@example.com").json()
    assert guest_client.get("/history", headers=bearer(b["access_token"])).json() == []
    again = guest_client.post("/api/v1/auth/login", json={
        "email": "existing-tests@example.com", "password": "test-password-123",
    }).json()
    assert guest_client.get("/history", headers=bearer(again["access_token"])).json() == first_user_history


def test_legacy_unowned_rows_are_invisible(client):
    with SessionLocal() as db:
        db.add(Product(produce_type="banana", user_id=None, status="active"))
        db.commit()
    assert client.get("/api/v1/produce?status=all").json() == []
    assert client.get("/api/v1/dashboard").json()["stats"]["active_count"] == 0
