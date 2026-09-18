from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Existing schemas (unchanged) ──────────────────────────────────────────────

class ProductCreate(BaseModel):
    produce_type: str = Field(..., min_length=1, max_length=50)
    variety: Optional[str] = None
    storage_type: Optional[str] = "room"
    display_name: Optional[str] = None


class ProductOut(BaseModel):
    product_id: int
    produce_type: str
    variety: Optional[str]
    storage_type: Optional[str]
    status: str
    outcome: Optional[str] = None
    display_name: Optional[str]
    date_added: Optional[datetime]
    latest_stage: Optional[str] = None
    latest_days_remaining: Optional[float] = None
    latest_days_display: Optional[str] = None
    latest_thumbnail_url: Optional[str] = None


class PredictionOut(BaseModel):
    prediction_id: int
    image_id: int
    freshness_stage: str
    days_remaining: float
    days_remaining_display: str
    confidence: float
    advice: str
    refrigeration_trigger: bool = False
    fifo_priority: str = "STANDARD"
    action_type: str = "MONITOR"
    predicted_at: Optional[datetime]


class ImageHistoryOut(BaseModel):
    image_id: int
    product_id: int
    image_url: str
    thumbnail_url: Optional[str]
    capture_date: datetime
    original_filename: Optional[str]
    batch_id: Optional[str]
    batch_mode: Optional[str]
    processing_status: str
    error_message: Optional[str]
    prediction: Optional[PredictionOut]


class UploadResult(BaseModel):
    batch_id: str
    product: ProductOut
    image: ImageHistoryOut
    prediction: Optional[PredictionOut]


class TimelinePoint(BaseModel):
    image_id: int
    capture_date: datetime
    freshness_stage: str
    days_remaining: float
    days_remaining_display: str
    confidence: float
    advice: str
    refrigeration_trigger: bool
    fifo_priority: str
    thumbnail_url: Optional[str]
    image_url: Optional[str]


class DashboardStats(BaseModel):
    total_products: int
    fresh_count: int
    high_risk_count: int
    spoiled_count: int
    avg_days_remaining: float


# ── New v1 schemas ─────────────────────────────────────────────────────────────

class AnalyzeResult(BaseModel):
    """Result of image analysis without creating a saved produce item."""
    produce_type: str
    freshness_stage: str
    days_remaining: float
    days_remaining_display: str
    confidence: float
    advice: str
    refrigeration_trigger: bool
    fifo_priority: str
    action_type: str


class ProductUpdate(BaseModel):
    """Editable fields on an existing produce item."""
    display_name: Optional[str] = None
    storage_type: Optional[str] = None


class CompleteRequest(BaseModel):
    """Body for completing a produce item."""
    outcome: str = Field(..., pattern="^(consumed|discarded)$")


class MetaOut(BaseModel):
    """Frontend-safe application configuration."""
    produce_types: List[str]
    freshness_stages: List[str]
    storage_options: List[str]
    use_real_model: bool


class DashboardV1Stats(BaseModel):
    active_count: int
    use_soon_count: int
    fresh_count: int
    spoiled_count: int


class DashboardV1Out(BaseModel):
    """Combined dashboard payload for mobile Home and web Dashboard."""
    stats: DashboardV1Stats
    use_first: List[ProductOut]
    recent_scans: List[ImageHistoryOut]
    all_active: List[ProductOut]


class ScanOverTime(BaseModel):
    date: str
    count: int


class AnalyticsOut(BaseModel):
    """Aggregated analytics for the Analytics page."""
    total_scans: int
    active_count: int
    completed_count: int
    consumed_count: int
    discarded_count: int
    freshness_distribution: Dict[str, int]
    scans_over_time: List[ScanOverTime]
    outcome_distribution: Dict[str, int]


# ── Helper ─────────────────────────────────────────────────────────────────────

def decimal_to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    return float(value)
