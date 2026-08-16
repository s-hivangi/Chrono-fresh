from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Tuple


STAGES = ["Fresh", "Early Ripe", "Mid Ripe", "Late Ripe", "Spoiled"]


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
        if self.days_remaining <= 0:
            return "0 days"
        if self.days_remaining < 1:
            return "<1 day"
        lower = max(0, int(self.days_remaining))
        upper = lower + 1
        return f"{lower}-{upper} days"


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
    """
    Decision Support Engine (DSS):
    Translates dual-backbone latent predictions into actionable logistics directives.
    """
    produce = produce_type.title()

    if stage == "Spoiled" or days_remaining <= 0:
        return (
            False,
            "QUARANTINE_RECYCLE",
            "QUARANTINE",
            f"ALERT: {produce} is spoiled. Quarantine batch immediately to prevent ethylene cross-contamination. Route to compost/bio-recycling."
        )
    
    if stage == "Late Ripe" or days_remaining <= 1.5:
        return (
            True,
            "PRIORITY_1_IMMEDIATE",
            "MARKDOWN_PROCESSING",
            f"CRITICAL (FIFO Priority 1): {produce} has <=1.5 days shelf life. Trigger cold-storage refrigeration (4°C) and dispatch immediately to local retail or route to purée/juice processing."
        )

    if stage == "Mid Ripe" or days_remaining <= 3.5:
        return (
            True,
            "PRIORITY_2_RETAIL",
            "COLD_STORAGE",
            f"LOGISTICS NOTICE (FIFO Priority 2): {produce} is mid-ripe with ~{days_remaining:.1f} days left. Activate cold-chain storage (6°C) and prioritize for regional store delivery within 48h."
        )

    if stage == "Early Ripe":
        return (
            False,
            "PRIORITY_3_BUFFER",
            "MONITOR",
            f"OPTIMAL (FIFO Priority 3): {produce} is early ripe ({days_remaining:.1f} days remaining). Suitable for standard ambient/chilled distribution buffer."
        )

    # Fresh stage
    return (
        False,
        "STANDARD_BUFFER",
        "MONITOR",
        f"PRISTINE: {produce} is in fresh stage with {days_remaining:.1f} days remaining shelf life. Standard warehouse handling."
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

