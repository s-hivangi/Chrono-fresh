from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
import threading
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol, Tuple

from PIL import Image, ImageStat


LOGGER = logging.getLogger("chronofresh.prediction")
BASE_DIR = Path(__file__).resolve().parents[1]
SUPPORTED_PRODUCE = ("banana", "guava")
STAGES = ["Fresh", "Early Ripening", "Mid-Ripening", "Late Ripening", "Spoiled"]


class PredictionConfigurationError(RuntimeError):
    """Raised when a configured provider cannot be used safely."""


def format_days_remaining(days_remaining: float | None) -> str | None:
    if days_remaining is None:
        return None
    return f"{max(0.0, days_remaining):.1f} days"


@dataclass(frozen=True)
class PredictionResult:
    freshness_stage: str | None
    days_remaining: float | None
    raw_model_confidence: float | None
    advice: str
    refrigeration_trigger: bool
    fifo_priority: str
    action_type: str
    analysis_status: str = "reliable"
    prediction_source: str = "stub"
    model_version: str = "stub-v1"
    verification_status: str = "not_requested"
    uncertainty_reason: str | None = None
    model_class: str | None = None

    @property
    def confidence(self) -> float | None:
        """Compatibility alias for older API/database consumers."""
        return self.raw_model_confidence

    @property
    def days_remaining_display(self) -> str | None:
        return format_days_remaining(self.days_remaining)


class PredictionProvider(Protocol):
    provider_name: str
    model_version: str

    def startup(self) -> None: ...
    def predict(self, image_path: Path, produce_type: str) -> PredictionResult: ...


class PredictionVerifier(Protocol):
    enabled: bool

    def verify(self, image_path: Path, produce_type: str, condition: str) -> dict[str, Any] | None: ...


class DisabledVerifier:
    enabled = False

    def verify(self, image_path: Path, produce_type: str, condition: str) -> None:
        return None


class ExternalVisionVerifier:
    """Provider-neutral JSON-over-HTTP verifier used only for uncertain scans."""

    enabled = True

    def __init__(self) -> None:
        self.endpoint = os.getenv("AI_VERIFIER_ENDPOINT", "").strip()
        self.api_key = os.getenv("AI_VERIFIER_API_KEY", "").strip()
        self.timeout = float(os.getenv("AI_VERIFIER_TIMEOUT_SECONDS", "15"))
        if not self.endpoint or not self.api_key:
            raise PredictionConfigurationError(
                "AI_VERIFIER_ENABLED=true requires AI_VERIFIER_ENDPOINT and AI_VERIFIER_API_KEY."
            )

    def verify(self, image_path: Path, produce_type: str, condition: str) -> dict[str, Any] | None:
        payload = {
            "task": "verify_visible_fruit_and_condition",
            "image_base64": base64.b64encode(image_path.read_bytes()).decode("ascii"),
            "allowed_fruits": list(SUPPORTED_PRODUCE),
            "allowed_conditions": STAGES,
            "primary_prediction": {"fruit": produce_type, "condition": condition},
            "response_format": {"fruit": "string", "condition": "string", "confidence": "number"},
        }
        request = urllib.request.Request(
            self.endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                data = json.loads(response.read().decode("utf-8"))
        except (OSError, urllib.error.URLError, json.JSONDecodeError) as exc:
            LOGGER.warning("External verifier unavailable: %s", exc)
            return None
        fruit = str(data.get("fruit", "")).strip().lower()
        verified_condition = str(data.get("condition", "")).strip()
        if fruit not in SUPPORTED_PRODUCE or verified_condition not in STAGES:
            LOGGER.warning("External verifier returned an out-of-contract response.")
            return None
        return {"fruit": fruit, "condition": verified_condition, "confidence": data.get("confidence")}


def build_verifier() -> PredictionVerifier:
    if os.getenv("AI_VERIFIER_ENABLED", "false").lower() != "true":
        return DisabledVerifier()
    provider = os.getenv("AI_VERIFIER_PROVIDER", "http").lower()
    if provider != "http":
        raise PredictionConfigurationError(f"Unsupported AI_VERIFIER_PROVIDER: {provider}")
    return ExternalVisionVerifier()


class StubPredictionProvider:
    """Deterministic provider for tests and lightweight local UI development."""

    provider_name = "stub"
    model_version = "stub-v1"

    def startup(self) -> None:
        LOGGER.info("ChronoFresh prediction provider: stub")

    def predict(self, image_path: Path, produce_type: str) -> PredictionResult:
        validate_produce_type(produce_type)
        digest = hashlib.sha256(f"{produce_type}:{image_path.name}".encode()).digest()
        stage = STAGES[digest[0] % len(STAGES)]
        max_days = {"banana": 6.0, "guava": 5.0}[produce_type]
        days = round(max(0.0, max_days - STAGES.index(stage) * (max_days / 4.0)), 1)
        confidence = min(round(0.78 + ((digest[1] % 18) / 100.0), 3), 0.96)
        refrig, priority, action, advice = run_dss_engine(stage, days, produce_type)
        return PredictionResult(stage, days, confidence, advice, refrig, priority, action)


class KerasPredictionProvider:
    provider_name = "keras"

    def __init__(self, verifier: PredictionVerifier | None = None) -> None:
        configured = Path(os.getenv("MODEL_PATH", "models/efficientnetb3_final.keras"))
        self.model_path = configured if configured.is_absolute() else BASE_DIR / configured
        metadata_path = Path(os.getenv("MODEL_METADATA_PATH", "models/model_metadata.json"))
        self.metadata_path = metadata_path if metadata_path.is_absolute() else BASE_DIR / metadata_path
        self.threshold = float(os.getenv("MODEL_CONFIDENCE_THRESHOLD", "0.75"))
        self.verifier = verifier or build_verifier()
        self._model: Any = None
        self._lock = threading.Lock()
        self._metadata = self._load_metadata()
        self.class_names = list(self._metadata["class_names"])
        self.mapping_verified = bool(self._metadata.get("class_mapping_verified", False))
        digest = hashlib.sha256(self.model_path.read_bytes()).hexdigest()[:12] if self.model_path.exists() else "missing"
        self.model_version = os.getenv("MODEL_VERSION", f"efficientnetb3-banana-guava-{digest}")

    def _load_metadata(self) -> dict[str, Any]:
        if not self.metadata_path.exists():
            raise PredictionConfigurationError(f"Model metadata not found: {self.metadata_path}")
        data = json.loads(self.metadata_path.read_text(encoding="utf-8"))
        if len(data.get("class_names", [])) != 5:
            raise PredictionConfigurationError("Model metadata must define exactly five class_names.")
        return data

    def startup(self) -> None:
        if self._model is not None:
            return
        if not self.model_path.exists():
            raise PredictionConfigurationError(f"Keras model not found: {self.model_path}")
        os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
        try:
            import keras
        except ImportError as exc:
            raise PredictionConfigurationError(
                "Keras provider selected but Keras/TensorFlow is not installed. Install backend requirements."
            ) from exc
        try:
            self._model = keras.saving.load_model(self.model_path, compile=False)
        except Exception as exc:
            raise PredictionConfigurationError(f"Could not load Keras model {self.model_path}: {exc}") from exc
        LOGGER.info("ChronoFresh prediction provider: keras")
        LOGGER.info("Model: %s", self.model_version)
        LOGGER.info("Input shape: %s; outputs: %s", self._model.input_shape, self._model.output_shape)
        LOGGER.info("Class mapping verified from training artifacts: %s", self.mapping_verified)
        LOGGER.info("Model loaded successfully.")

    @staticmethod
    def preprocess_image(image_path: Path) -> Any:
        """Return 0..255 RGB float32; EfficientNet rescaling is embedded in the model."""
        import numpy as np

        with Image.open(image_path) as source:
            rgb = source.convert("RGB").resize((300, 300), Image.Resampling.BILINEAR)
            return np.expand_dims(np.asarray(rgb, dtype=np.float32), axis=0)

    @staticmethod
    def image_quality_issue(image_path: Path) -> str | None:
        with Image.open(image_path) as source:
            gray = source.convert("L").resize((160, 160))
            stats = ImageStat.Stat(gray)
            mean, stddev = stats.mean[0], stats.stddev[0]
        if mean < 22:
            return "The image is too dark. Retake it in brighter, even lighting."
        if mean > 242:
            return "The image is overexposed. Retake it without glare."
        if stddev < 7:
            return "The image has too little visible detail. Retake it closer and in focus."
        return None

    def predict(self, image_path: Path, produce_type: str) -> PredictionResult:
        validate_produce_type(produce_type)
        self.startup()
        issue = self.image_quality_issue(image_path)
        if issue:
            return uncertain_result(issue, self.model_version, "quality_gate")

        batch = self.preprocess_image(image_path)
        with self._lock:
            outputs = self._model.predict(batch, verbose=0)
        if isinstance(outputs, dict):
            probabilities = outputs["freshness_prediction"]
            day_values = outputs["days_to_spoilage"]
        else:
            by_name = dict(zip(self._model.output_names, outputs))
            probabilities = by_name["freshness_prediction"]
            day_values = by_name["days_to_spoilage"]

        probs = probabilities[0]
        class_index = int(probs.argmax())
        confidence = float(probs[class_index])
        days = round(max(0.0, float(day_values[0][0])), 1)

        # ── Diagnostic logging (always present, backend logs only) ────────────
        LOGGER.info(
            "[PREDICT] selected_fruit=%s  raw_output=%s  argmax=%d  confidence=%.4f  "
            "output_shape=%s  mapping_verified=%s",
            produce_type,
            [round(float(p), 4) for p in probs],
            class_index,
            confidence,
            list(probs.shape),
            self.mapping_verified,
        )
        # ─────────────────────────────────────────────────────────────────────

        if not self.mapping_verified:
            _internal_reason = (
                "class_mapping_unresolved: five-class index ordering not confirmed "
                f"from training artifacts (argmax={class_index}, confidence={confidence:.4f})"
            )
            LOGGER.warning("[PREDICT] mapping unresolved — returning uncertain. reason=%s", _internal_reason)
            # uncertainty_reason=None: the internal technical cause must not reach the user.
            return uncertain_result(
                None,
                self.model_version,
                "keras",
                confidence,
                f"index:{class_index}",
            )

        stage = self.class_names[class_index]
        refrig, priority, action, advice = run_dss_engine(stage, days, produce_type)

        reason = None
        if confidence < self.threshold:
            reason = f"Raw model confidence {confidence:.3f} is below the heuristic threshold {self.threshold:.3f}."
        if reason:
            if self.verifier.enabled:
                verified = self.verifier.verify(image_path, produce_type, stage)
                if verified and verified["fruit"] == produce_type and verified["condition"] == stage:
                    return PredictionResult(
                        stage, days, confidence, advice, refrig, priority, action,
                        analysis_status="verified", prediction_source="keras+external_verifier",
                        model_version=self.model_version, verification_status="agreed",
                        uncertainty_reason=reason, model_class=f"{class_index}:{stage}",
                    )
                reason = f"{reason} External verification was unavailable or did not agree."
            return uncertain_result(reason, self.model_version, "keras", confidence, f"{class_index}:{stage}")

        return PredictionResult(
            stage, days, confidence, advice, refrig, priority, action,
            analysis_status="reliable", prediction_source="keras", model_version=self.model_version,
            model_class=f"{class_index}:{stage}",
        )


def uncertain_result(
    reason: str,
    model_version: str,
    source: str,
    confidence: float | None = None,
    model_class: str | None = None,
) -> PredictionResult:
    return PredictionResult(
        None, None, confidence,
        "We couldn't assess this fruit confidently. Retake the photo in good lighting with the full fruit visible.",
        False, "VERIFY", "RESCAN", analysis_status="uncertain", prediction_source=source,
        model_version=model_version, verification_status="not_verified", uncertainty_reason=reason,
        model_class=model_class,
    )


def validate_produce_type(produce_type: str) -> None:
    if produce_type not in SUPPORTED_PRODUCE:
        raise ValueError(f"Unsupported produce type '{produce_type}'. Choose banana or guava.")


def run_dss_engine(stage: str, days_remaining: float, produce_type: str) -> Tuple[bool, str, str, str]:
    """Translate model outputs into rule-based consumer guidance."""
    days = format_days_remaining(days_remaining)
    if stage == "Spoiled" or days_remaining <= 0:
        return False, "DISCARD", "DISCARD", "Spoiled appearance — discard if normal food-safety checks agree."
    if stage == "Late Ripening" or days_remaining <= 1.5:
        return True, "USE_SOON", "USE_SOON", f"Overripe appearance — estimated {days} remaining. Use soon."
    if stage == "Mid-Ripening" or days_remaining <= 3.5:
        return True, "EAT_NOW", "EAT_NOW", f"Ripe appearance — estimated {days} remaining. Good time to use it."
    if stage == "Early Ripening":
        return False, "ENJOY_SOON", "MONITOR", f"Ripening appearance — estimated {days} remaining. Monitor it."
    return False, "FRESH", "MONITOR", f"Fresh appearance — estimated {days} remaining. Store appropriately."


class ModelInferenceEngine:
    """Compatibility facade selecting exactly one configured provider."""

    def __init__(self) -> None:
        provider = os.getenv("PREDICTION_PROVIDER", "stub").strip().lower()
        if provider == "stub":
            self.provider: PredictionProvider = StubPredictionProvider()
        elif provider == "keras":
            self.provider = KerasPredictionProvider()
        else:
            raise PredictionConfigurationError(f"Unsupported PREDICTION_PROVIDER: {provider}")

    @property
    def provider_name(self) -> str:
        return self.provider.provider_name

    @property
    def model_version(self) -> str:
        return self.provider.model_version

    def startup(self) -> None:
        self.provider.startup()

    def predict(self, image_path: Path, produce_type: str) -> PredictionResult:
        return self.provider.predict(image_path, produce_type)
