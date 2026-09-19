"""
ChronoFresh API test suite.
All tests run against an in-memory SQLite database (see conftest.py).
"""
from __future__ import annotations

import io

from app.main import _issue_analysis_token
from app.prediction_service import format_days_remaining, run_dss_engine


def _token(days: float, stage: str = "Late Ripening") -> str:
    return _issue_analysis_token({
        "produce_type": "tomato", "freshness_stage": stage,
        "days_remaining": days, "days_remaining_display": f"{days:.1f} days",
        "confidence": 0.91, "advice": "Test advice",
        "refrigeration_trigger": days <= 1, "fifo_priority": "PRIORITY_1",
        "action_type": "USE_SOON",
    })


# ── Health & Meta ──────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_meta(client):
    r = client.get("/api/v1/meta")
    assert r.status_code == 200
    data = r.json()
    assert "produce_types" in data
    assert "tomato" in data["produce_types"]
    assert "freshness_stages" in data
    assert len(data["freshness_stages"]) == 5
    assert data["use_real_model"] is False


# ── Analyze (no save) ──────────────────────────────────────────────────────────

def test_analyze_valid_image(client, single_file, tiny_jpeg):
    r = client.post(
        "/api/v1/analyze",
        files=[single_file],
        data={"produce_type": "tomato"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "freshness_stage" in data
    assert data["freshness_stage"] in ["Fresh", "Early Ripening", "Mid-Ripening", "Late Ripening", "Spoiled"]
    assert data["days_remaining_display"] == f"{data['days_remaining']:.1f} days"
    assert "PRISTINE" not in data["advice"]
    assert "warehouse" not in data["advice"].lower()
    assert "days_remaining" in data
    assert isinstance(data["confidence"], float)
    assert "advice" in data
    assert data["analysis_token"]


def test_analyze_result_is_exactly_the_saved_initial_prediction(client, tiny_jpeg):
    analyzed = client.post(
        "/api/v1/analyze",
        files=[("file", ("same.jpg", io.BytesIO(tiny_jpeg), "image/jpeg"))],
        data={"produce_type": "tomato"},
    ).json()
    saved = client.post(
        "/api/v1/produce",
        files=[("file", ("same.jpg", io.BytesIO(tiny_jpeg), "image/jpeg"))],
        data={"produce_type": "tomato", "analysis_token": analyzed["analysis_token"]},
    )
    assert saved.status_code == 201
    prediction = client.get(f"/api/v1/produce/{saved.json()['product_id']}/history").json()[0]["prediction"]
    for field in ("freshness_stage", "days_remaining", "days_remaining_display", "confidence", "advice", "refrigeration_trigger", "fifo_priority", "action_type"):
        assert prediction[field] == analyzed[field]


def test_analyze_no_file(client):
    r = client.post("/api/v1/analyze", data={"produce_type": "tomato"})
    assert r.status_code == 422


def test_dss_uses_canonical_stages_and_exact_days():
    assert format_days_remaining(7.04) == "7.0 days"
    cases = {
        "Fresh": "Fresh — 7.0 days remaining.",
        "Early Ripening": "Ripening — 4.2 days remaining.",
        "Mid-Ripening": "Ripe — 3.0 days remaining.",
        "Late Ripening": "Overripe — 0.9 days remaining.",
        "Spoiled": "Spoiled — this item should be discarded.",
    }
    for stage, expected_start in cases.items():
        advice = run_dss_engine(stage, {"Fresh": 7.0, "Early Ripening": 4.2, "Mid-Ripening": 3.0, "Late Ripening": 0.9, "Spoiled": 0.0}[stage], "tomato")[3]
        assert advice.startswith(expected_start)
        assert "PRISTINE" not in advice
        assert "warehouse" not in advice.lower()


def test_analyze_text_file(client):
    r = client.post(
        "/api/v1/analyze",
        files=[("file", ("bad.txt", io.BytesIO(b"not an image"), "text/plain"))],
        data={"produce_type": "tomato"},
    )
    assert r.status_code == 400


# ── Create produce ─────────────────────────────────────────────────────────────

def test_create_produce(client, single_file):
    r = client.post(
        "/api/v1/produce",
        files=[single_file],
        data={"produce_type": "tomato"},
    )
    assert r.status_code == 201
    data = r.json()
    assert "product_id" in data
    assert data["produce_type"] == "tomato"
    assert data["status"] == "active"
    assert data["outcome"] is None


def test_corrupt_image_leaves_no_ghost_product(client):
    response = client.post(
        "/api/v1/produce",
        files=[("file", ("fake.jpg", io.BytesIO(b"not really a jpeg"), "image/jpeg"))],
        data={"produce_type": "tomato"},
    )
    assert response.status_code == 400
    assert client.get("/api/v1/produce?status=all").json() == []


# ── List produce ───────────────────────────────────────────────────────────────

def _create_tomato(client, single_file, tiny_jpeg):
    """Helper: create a saved tomato, return product_id."""
    import io as _io
    r = client.post(
        "/api/v1/produce",
        files=[("file", ("t.jpg", _io.BytesIO(tiny_jpeg), "image/jpeg"))],
        data={"produce_type": "tomato"},
    )
    assert r.status_code == 201
    return r.json()["product_id"]


def test_list_active_produce(client, tiny_jpeg):
    import io as _io
    client.post(
        "/api/v1/produce",
        files=[("file", ("t.jpg", _io.BytesIO(tiny_jpeg), "image/jpeg"))],
        data={"produce_type": "tomato"},
    )
    r = client.get("/api/v1/produce")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["status"] == "active"


def test_list_completed_initially_empty(client):
    r = client.get("/api/v1/produce?status=completed")
    assert r.status_code == 200
    assert r.json() == []


# ── Produce detail ─────────────────────────────────────────────────────────────

def test_get_produce_detail(client, tiny_jpeg):
    import io as _io
    pid = _create_tomato(client, None, tiny_jpeg)
    r = client.get(f"/api/v1/produce/{pid}")
    assert r.status_code == 200
    assert r.json()["product_id"] == pid


def test_get_produce_not_found(client):
    r = client.get("/api/v1/produce/99999")
    assert r.status_code == 404


# ── Rescan ─────────────────────────────────────────────────────────────────────

def test_rescan_creates_additional_history(client, tiny_jpeg):
    import io as _io
    pid = _create_tomato(client, None, tiny_jpeg)

    # Rescan
    r2 = client.post(
        f"/api/v1/produce/{pid}/rescan",
        files=[("file", ("r.jpg", _io.BytesIO(tiny_jpeg), "image/jpeg"))],
    )
    assert r2.status_code == 200

    # History should have 2 entries
    rh = client.get(f"/api/v1/produce/{pid}/history")
    assert rh.status_code == 200
    assert len(rh.json()) == 2


# ── Timeline ───────────────────────────────────────────────────────────────────

def test_timeline_chronological_order(client, tiny_jpeg):
    import io as _io
    pid = _create_tomato(client, None, tiny_jpeg)
    client.post(
        f"/api/v1/produce/{pid}/rescan",
        files=[("file", ("r.jpg", _io.BytesIO(tiny_jpeg), "image/jpeg"))],
    )
    rt = client.get(f"/api/v1/produce/{pid}/timeline")
    assert rt.status_code == 200
    points = rt.json()
    assert len(points) == 2
    # Chronological: first scan date <= second scan date
    assert points[0]["capture_date"] <= points[1]["capture_date"]


# ── Complete workflow ──────────────────────────────────────────────────────────

def test_complete_consumed_removes_from_active(client, tiny_jpeg):
    import io as _io
    pid = _create_tomato(client, None, tiny_jpeg)

    rc = client.post(f"/api/v1/produce/{pid}/complete", json={"outcome": "consumed"})
    assert rc.status_code == 200
    assert rc.json()["status"] == "completed"
    assert rc.json()["outcome"] == "consumed"
    assert rc.json()["completed_at"] is not None

    # No longer in active list
    ra = client.get("/api/v1/produce")
    assert all(p["product_id"] != pid for p in ra.json())

    # Appears in completed list
    rcomp = client.get("/api/v1/produce?status=completed")
    assert any(p["product_id"] == pid for p in rcomp.json())


def test_complete_invalid_outcome(client, tiny_jpeg):
    import io as _io
    pid = _create_tomato(client, None, tiny_jpeg)
    r = client.post(f"/api/v1/produce/{pid}/complete", json={"outcome": "thrown_away"})
    assert r.status_code == 422


def test_complete_already_completed(client, tiny_jpeg):
    import io as _io
    pid = _create_tomato(client, None, tiny_jpeg)
    client.post(f"/api/v1/produce/{pid}/complete", json={"outcome": "discarded"})
    r2 = client.post(f"/api/v1/produce/{pid}/complete", json={"outcome": "consumed"})
    assert r2.status_code == 409


# ── Dashboard ──────────────────────────────────────────────────────────────────

def test_dashboard_aggregates_correctly(client, tiny_jpeg):
    import io as _io
    _create_tomato(client, None, tiny_jpeg)
    r = client.get("/api/v1/dashboard")
    assert r.status_code == 200
    data = r.json()
    assert data["stats"]["active_count"] == 1
    assert isinstance(data["use_first"], list)
    assert isinstance(data["recent_scans"], list)
    assert isinstance(data["all_active"], list)


def test_zero_days_sorts_first_and_use_first_excludes_fresh(client, tiny_jpeg):
    ids = []
    for days, stage in ((2.0, "Mid-Ripening"), (0.0, "Spoiled"), (8.0, "Fresh")):
        response = client.post(
            "/api/v1/produce",
            files=[("file", (f"{days}.jpg", io.BytesIO(tiny_jpeg), "image/jpeg"))],
            data={"produce_type": "tomato", "analysis_token": _token(days, stage)},
        )
        ids.append(response.json()["product_id"])
    listed = client.get("/api/v1/produce?sort=urgency").json()
    assert [item["latest_days_remaining"] for item in listed] == [0.0, 2.0, 8.0]
    use_first = client.get("/api/v1/dashboard").json()["use_first"]
    assert [item["product_id"] for item in use_first] == [ids[1]]


# ── Analytics ─────────────────────────────────────────────────────────────────

def test_analytics_counts_update_after_lifecycle(client, tiny_jpeg):
    import io as _io
    pid = _create_tomato(client, None, tiny_jpeg)

    r1 = client.get("/api/v1/analytics")
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["total_scans"] == 1
    assert d1["active_count"] == 1
    assert d1["consumed_count"] == 0

    client.post(f"/api/v1/produce/{pid}/complete", json={"outcome": "consumed"})

    r2 = client.get("/api/v1/analytics")
    d2 = r2.json()
    assert d2["active_count"] == 0
    assert d2["consumed_count"] == 1
    assert d2["outcome_distribution"]["consumed"] == 1


# ── Prediction stub contract ───────────────────────────────────────────────────

def test_prediction_stub_produces_valid_output(client, tiny_jpeg):
    import io as _io
    r = client.post(
        "/api/v1/analyze",
        files=[("file", ("stub.jpg", _io.BytesIO(tiny_jpeg), "image/jpeg"))],
        data={"produce_type": "banana"},
    )
    assert r.status_code == 200
    d = r.json()
    # Validate all required API fields are present and correctly typed
    assert d["freshness_stage"] in ["Fresh", "Early Ripening", "Mid-Ripening", "Late Ripening", "Spoiled"]
    assert isinstance(d["days_remaining"], (int, float))
    assert d["days_remaining"] >= 0
    assert 0.0 <= d["confidence"] <= 1.0
    assert isinstance(d["advice"], str) and len(d["advice"]) > 0
    assert isinstance(d["refrigeration_trigger"], bool)
    assert isinstance(d["fifo_priority"], str)
    assert isinstance(d["action_type"], str)
