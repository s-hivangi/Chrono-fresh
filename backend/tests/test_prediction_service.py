from __future__ import annotations

import os
import hashlib
import json
import urllib.error
from pathlib import Path

import pytest
from PIL import Image

from app.prediction_service import (
    DisabledVerifier,
    ExternalVisionVerifier,
    KerasPredictionProvider,
    StubPredictionProvider,
    uncertain_result,
    validate_produce_type,
)


def test_supported_produce_validation() -> None:
    validate_produce_type("banana")
    validate_produce_type("guava")
    with pytest.raises(ValueError):
        validate_produce_type("tomato")


def test_disabled_verifier_returns_none(tmp_path: Path) -> None:
    path = tmp_path / "sample.jpg"
    Image.new("RGB", (300, 300), "green").save(path)
    assert DisabledVerifier().verify(path, "guava", "Fresh") is None


def test_external_verifier_failure_returns_none(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    path = tmp_path / "sample.jpg"
    Image.new("RGB", (300, 300), "green").save(path)
    monkeypatch.setenv("AI_VERIFIER_ENDPOINT", "https://verifier.invalid")
    monkeypatch.setenv("AI_VERIFIER_API_KEY", "test-only")
    monkeypatch.setattr("urllib.request.urlopen", lambda *args, **kwargs: (_ for _ in ()).throw(urllib.error.URLError("offline")))
    assert ExternalVisionVerifier().verify(path, "guava", "Fresh") is None


def test_uncertain_contract_does_not_force_a_stage() -> None:
    result = uncertain_result("test reason", "model-v1", "keras", 0.4, "index:2")
    assert result.analysis_status == "uncertain"
    assert result.freshness_stage is None
    assert result.days_remaining is None
    assert result.action_type == "RESCAN"


def test_preprocessing_shape_dtype_and_range(tmp_path: Path) -> None:
    np = pytest.importorskip("numpy")
    path = tmp_path / "sample.jpg"
    Image.new("RGB", (450, 320), (240, 120, 30)).save(path)
    batch = KerasPredictionProvider.preprocess_image(path)
    assert batch.shape == (1, 300, 300, 3)
    assert batch.dtype == np.float32
    assert batch.max() > 1.0  # scaling belongs to the embedded EfficientNet graph


def test_stub_contract(tmp_path: Path) -> None:
    path = tmp_path / "sample.jpg"
    Image.new("RGB", (300, 300), "yellow").save(path)
    result = StubPredictionProvider().predict(path, "banana")
    assert result.analysis_status == "reliable"
    assert result.prediction_source == "stub"
    assert result.freshness_stage is not None


def test_model_artifact_matches_its_metadata() -> None:
    models_dir = Path(__file__).resolve().parents[1] / "models"
    metadata = json.loads((models_dir / "model_metadata.json").read_text(encoding="utf-8"))
    artifact = models_dir / metadata["artifact_filename"]
    assert artifact.is_file()
    assert hashlib.sha256(artifact.read_bytes()).hexdigest() == metadata["artifact_sha256"]


@pytest.mark.skipif(os.getenv("RUN_MODEL_SMOKE") != "1", reason="Set RUN_MODEL_SMOKE=1 for the real model load test")
def test_actual_keras_artifact_loads(tmp_path: Path) -> None:
    provider = KerasPredictionProvider()
    provider.startup()
    assert provider._model.input_shape == (None, 300, 300, 3)
    assert set(provider._model.output_names) == {"freshness_prediction", "days_to_spoilage"}
    image_path = tmp_path / "smoke.jpg"
    Image.new("RGB", (300, 300), "green").save(image_path)
    result = provider.predict(image_path, "guava")
    assert result.prediction_source == "keras"
    assert 0.0 <= result.raw_model_confidence <= 1.0
    assert result.analysis_status in {"reliable", "verified", "uncertain"}
