from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Tuple


STAGES = ["Fresh", "Early Ripening", "Mid-Ripening", "Late Ripening", "Spoiled"]


def format_days_remaining(days_remaining: float) -> str:
    """Format the model regression consistently everywhere in the API."""
    return f"{max(0.0, days_remaining):.1f} days"


@dataclass(frozen=True)
class PredictionResult:
    freshness_stage: str
    days_remaining: float
    confidence: float
    advice: str
    refrigeration_trigger: bool
    fifo_priority: str
    action_type: str

    @property
    def days_remaining_display(self) -> str:
        return format_days_remaining(self.days_remaining)


class StubPredictionService:
    """Deterministic dual-backbone placeholder matching model output schema."""

    def predict(self, image_path: Path, produce_type: str) -> PredictionResult:
        digest = hashlib.sha256(f"{produce_type}:{image_path.name}".encode("utf-8")).digest()
        stage_index = digest[0] % len(STAGES)
        stage = STAGES[stage_index]

        produce_max_days = {
            "tomato": 7.0,
            "banana": 6.0,
            "guava": 5.0,
            "apple": 12.0,
            "mango": 8.0,
        }
        max_days = produce_max_days.get(produce_type.lower(), 6.0)
        raw_days = max(0.0, max_days - (stage_index * (max_days / 4.0)))
        confidence = round(0.78 + ((digest[1] % 18) / 100.0), 3)

        refrig, priority, action, advice = run_dss_engine(stage, raw_days, produce_type)

        return PredictionResult(
            freshness_stage=stage,
            days_remaining=round(raw_days, 1),
            confidence=min(confidence, 0.96),
            advice=advice,
            refrigeration_trigger=refrig,
            fifo_priority=priority,
            action_type=action,
        )


def run_dss_engine(stage: str, days_remaining: float, produce_type: str) -> Tuple[bool, str, str, str]:
    """Translate model outputs into consumer-facing guidance."""
    days = format_days_remaining(days_remaining)

    if stage == "Spoiled" or days_remaining <= 0:
        return (
            False,
            "DISCARD",
            "DISCARD",
            "Spoiled — this item should be discarded.",
        )

    if stage == "Late Ripening" or days_remaining <= 1.5:
        return (
            True,
            "USE_SOON",
            "USE_SOON",
            f"Overripe — {days} remaining. Use soon or it will spoil.",
        )

    if stage == "Mid-Ripening" or days_remaining <= 3.5:
        return (
            True,
            "EAT_NOW",
            "EAT_NOW",
            f"Ripe — {days} remaining. Great to eat now.",
        )

    if stage == "Early Ripening":
        return (
            False,
            "ENJOY_SOON",
            "MONITOR",
            f"Ripening — {days} remaining. Best enjoyed soon.",
        )

    return (
        False,
        "FRESH",
        "MONITOR",
        f"Fresh — {days} remaining. Store in the fridge to keep it fresh longer.",
    )


class ModelInferenceEngine:
    """
    Wrapper for teammate's exported PyTorch (.pt) or ONNX (.onnx) model.
    Checks for exported weights in backend/models directory.
    """

    def __init__(self):
        self.stub = StubPredictionService()
        self.model_path = Path(__file__).resolve().parents[1] / "models" / "best_model.onnx"
        self.use_real_model = os.getenv("USE_REAL_MODEL", "false").lower() == "true" and self.model_path.exists()

    def predict(self, image_path: Path, produce_type: str) -> PredictionResult:
        if self.use_real_model:
            try:
                # Real model inference hook
                # e.g., session = onnxruntime.InferenceSession(str(self.model_path))
                # outputs = session.run(...)
                pass
            except Exception as err:
                print(f"Real model inference failed ({err}), falling back to stub prediction.")
        
        return self.stub.predict(image_path, produce_type)

