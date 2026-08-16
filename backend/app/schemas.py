from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


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


def decimal_to_float(value: Decimal | float | int | None) -> float | None:
    if value is None:
        return None
    return float(value)

