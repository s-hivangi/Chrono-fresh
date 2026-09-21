from __future__ import annotations

import os
import base64
import hashlib
import hmac
import json
import time
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, selectinload

from . import models  # noqa: F401 -- needed so tables are registered on Base
from .database import get_db
from .image_utils import read_validated_image, save_normalized_image, save_upload_image
from .models import ImageHistory, Prediction, Product
from .prediction_service import ModelInferenceEngine, SUPPORTED_PRODUCE, validate_produce_type
from .schemas import (
    AnalyzeResult,
    AnalyticsOut,
    CompleteRequest,
    DashboardStats,
    DashboardV1Out,
    DashboardV1Stats,
    ImageHistoryOut,
    MetaOut,
    PredictionOut,
    ProductCreate,
    ProductOut,
    ProductUpdate,
    ScanOverTime,
    TimelinePoint,
    UploadResult,
    decimal_to_float,
)


BASE_DIR = Path(__file__).resolve().parents[1]
_upload_setting = Path(os.getenv("UPLOAD_DIRECTORY", "uploads"))
UPLOAD_DIR = _upload_setting if _upload_setting.is_absolute() else BASE_DIR / _upload_setting
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

prediction_service = ModelInferenceEngine()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Load the configured prediction provider before serving requests."""
    prediction_service.startup()
    yield


def utcnow() -> datetime:
    """Return a naive UTC timestamp for the existing TIMESTAMP columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


app = FastAPI(title="Chrono-Fresh API", version="1.0.0", lifespan=lifespan)
_cors_origins_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
)
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins or ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")



@app.get("/")
def root():
    return {"message": "Chrono-Fresh backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/products", response_model=ProductOut)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    _validate_produce_type(payload.produce_type.strip().lower())
    product = Product(
        produce_type=payload.produce_type.strip().lower(),
        variety=payload.variety,
        storage_type=payload.storage_type,
        display_name=payload.display_name,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_to_out(product)


@app.get("/products", response_model=list[ProductOut])
def list_products(
    produce_type: Optional[str] = None,
    status: Optional[str] = None,
    urgent: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Product).options(
        selectinload(Product.images).selectinload(ImageHistory.prediction)
    )
    if produce_type:
        query = query.filter(Product.produce_type == produce_type.lower())
    if status:
        query = query.filter(Product.status == status)

    products = [product_to_out(product) for product in query.order_by(Product.date_added.desc()).all()]
    if urgent:
        products = [
            product
            for product in products
            if product.latest_stage in {"Late Ripening", "Spoiled"}
            or (product.latest_days_remaining is not None and product.latest_days_remaining <= 1)
        ]
    return products


@app.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = load_product(db, product_id)
    return product_to_out(product)


@app.get("/products/{product_id}/history", response_model=list[ImageHistoryOut])
def get_product_history(product_id: int, db: Session = Depends(get_db)):
    load_product(db, product_id)
    rows = (
        db.query(ImageHistory)
        .options(selectinload(ImageHistory.prediction))
        .filter(ImageHistory.product_id == product_id)
        .order_by(ImageHistory.capture_date.desc())
        .all()
    )
    return [image_to_out(row) for row in rows]


@app.get("/products/{product_id}/timeline", response_model=list[TimelinePoint])
def get_product_timeline(product_id: int, db: Session = Depends(get_db)):
    load_product(db, product_id)
    rows = (
        db.query(ImageHistory)
        .options(selectinload(ImageHistory.prediction))
        .filter(ImageHistory.product_id == product_id, ImageHistory.processing_status == "SUCCESS")
        .order_by(ImageHistory.capture_date.asc())
        .all()
    )
    timeline = []
    for row in rows:
        if row.prediction:
            pred = row.prediction
            timeline.append(
                TimelinePoint(
                    image_id=row.image_id,
                    capture_date=row.capture_date,
                    freshness_stage=pred.freshness_stage,
                    days_remaining=decimal_to_float(pred.days_remaining) or 0.0,
                    days_remaining_display=pred.days_remaining_display,
                    confidence=decimal_to_float(pred.confidence) or 0.0,
                    advice=pred.advice or "",
                    refrigeration_trigger=bool(pred.refrigeration_trigger),
                    fifo_priority=pred.fifo_priority or "STANDARD",
                    thumbnail_url=path_to_url(row.thumbnail_path),
                    image_url=path_to_url(row.image_path),
                )
            )
    return timeline


@app.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    products = (
        db.query(Product)
        .options(selectinload(Product.images).selectinload(ImageHistory.prediction))
        .all()
    )
    total_products = len(products)
    fresh_count = 0
    high_risk_count = 0
    spoiled_count = 0
    days_list = []

    for p in products:
        out = product_to_out(p)
        if out.latest_stage == "Fresh":
            fresh_count += 1
        elif out.latest_stage in {"Late Ripening", "Spoiled"} or (out.latest_days_remaining is not None and out.latest_days_remaining <= 1.5):
            high_risk_count += 1
        if out.latest_stage == "Spoiled":
            spoiled_count += 1
        if out.latest_days_remaining is not None:
            days_list.append(out.latest_days_remaining)

    avg_days = sum(days_list) / len(days_list) if days_list else 0.0

    return DashboardStats(
        total_products=total_products,
        fresh_count=fresh_count,
        high_risk_count=high_risk_count,
        spoiled_count=spoiled_count,
        avg_days_remaining=round(avg_days, 1),
    )


@app.get("/dashboard", response_model=list[ProductOut])
def dashboard(db: Session = Depends(get_db)):
    products = (
        db.query(Product)
        .options(selectinload(Product.images).selectinload(ImageHistory.prediction))
        .order_by(Product.date_added.desc())
        .all()
    )
    return sorted(
        (product_to_out(product) for product in products),
        key=lambda product: (
            product.latest_days_remaining is None,
            product.latest_days_remaining if product.latest_days_remaining is not None else 999,
        ),
    )


@app.get("/history", response_model=list[ImageHistoryOut])
def global_history(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ImageHistory).options(
        selectinload(ImageHistory.prediction),
        selectinload(ImageHistory.product),
    )
    if search:
        pattern = f"%{search.lower()}%"
        query = query.join(Product).filter(Product.produce_type.ilike(pattern))
    return [image_to_out(row) for row in query.order_by(ImageHistory.capture_date.desc()).all()]


@app.post("/predict", response_model=UploadResult)
async def predict_single(
    file: Annotated[UploadFile, File()],
    produce_type: Annotated[str, Form()],
    product_id: Annotated[Optional[int], Form()] = None,
    storage_type: Annotated[Optional[str], Form()] = "room",
    db: Session = Depends(get_db),
):
    results = await upload_images(
        files=[file],
        batch_mode="single",
        product_id=product_id,
        produce_type=produce_type,
        storage_type=storage_type,
        db=db,
    )
    return results[0]


@app.post("/upload", response_model=list[UploadResult])
@app.post("/uploads", response_model=list[UploadResult])
async def upload_images(
    files: Annotated[list[UploadFile], File()],
    batch_mode: Annotated[str, Form()] = "single",
    product_id: Annotated[Optional[int], Form()] = None,
    produce_type: Annotated[Optional[str], Form()] = None,
    storage_type: Annotated[Optional[str], Form()] = "room",
    db: Session = Depends(get_db),
):
    if batch_mode not in {"single", "same_fruit", "different_fruits"}:
        raise HTTPException(status_code=400, detail="batch_mode must be single, same_fruit, or different_fruits")
    if not files:
        raise HTTPException(status_code=400, detail="At least one image is required")
    if product_id is None and not produce_type:
        raise HTTPException(status_code=400, detail="produce_type is required when creating new products")
    if product_id is None:
        _validate_produce_type(produce_type or "")

    batch_id = uuid4().hex
    shared_product = load_product(db, product_id) if product_id else None
    results: list[UploadResult] = []

    for index, upload in enumerate(files, start=1):
        product = shared_product
        if product is None:
            product = Product(
                produce_type=(produce_type or "unknown").strip().lower(),
                storage_type=storage_type,
                display_name=None if batch_mode == "same_fruit" else f"{produce_type.title()} #{index}",
            )
            db.add(product)
            db.flush()
            if batch_mode == "same_fruit":
                shared_product = product

        image_row = ImageHistory(
            product_id=product.product_id,
            image_path="pending",
            capture_date=utcnow(),
            original_filename=upload.filename,
            batch_id=batch_id,
            batch_mode=batch_mode,
            processing_status="PENDING",
        )
        db.add(image_row)
        db.flush()

        try:
            image_path, thumbnail_path = await save_upload_image(upload, UPLOAD_DIR)
            image_row.image_path = str(image_path)
            image_row.thumbnail_path = str(thumbnail_path)

            prediction_result = prediction_service.predict(image_path, product.produce_type)
            if prediction_result.analysis_status == "uncertain":
                image_row.processing_status = "UNCERTAIN"
                image_row.error_message = prediction_result.uncertainty_reason
                db.commit()
                db.refresh(product)
                db.refresh(image_row)
                results.append(
                    UploadResult(
                        batch_id=batch_id,
                        product=product_to_out(product),
                        image=image_to_out(image_row),
                        prediction=None,
                    )
                )
                continue
            prediction = Prediction(
                image_id=image_row.image_id,
                freshness_stage=prediction_result.freshness_stage,
                days_remaining=prediction_result.days_remaining,
                days_remaining_display=prediction_result.days_remaining_display,
                confidence=prediction_result.confidence,
                raw_model_confidence=prediction_result.raw_model_confidence,
                advice=prediction_result.advice,
                refrigeration_trigger=prediction_result.refrigeration_trigger,
                fifo_priority=prediction_result.fifo_priority,
                action_type=prediction_result.action_type,
                analysis_status=prediction_result.analysis_status,
                prediction_source=prediction_result.prediction_source,
                model_version=prediction_result.model_version,
                verification_status=prediction_result.verification_status,
                model_class=prediction_result.model_class,
            )
            image_row.processing_status = "SUCCESS"
            product.status = "spoiled" if prediction_result.freshness_stage == "Spoiled" else "active"
            db.add(prediction)
            db.commit()
            db.refresh(product)
            db.refresh(image_row)
            db.refresh(prediction)
        except HTTPException as exc:
            image_row.processing_status = "FAILED"
            image_row.error_message = str(exc.detail)
            db.commit()
            raise
        except Exception as exc:
            image_row.processing_status = "FAILED"
            image_row.error_message = str(exc)
            db.commit()
            raise HTTPException(status_code=500, detail="Prediction failed") from exc

        results.append(
            UploadResult(
                batch_id=batch_id,
                product=product_to_out(product),
                image=image_to_out(image_row),
                prediction=prediction_to_out(prediction),
            )
        )

    return results


def load_product(db: Session, product_id: int) -> Product:
    product = (
        db.query(Product)
        .options(selectinload(Product.images).selectinload(ImageHistory.prediction))
        .filter(Product.product_id == product_id)
        .first()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def product_to_out(product: Product) -> ProductOut:
    latest_image = max(product.images, key=lambda image: image.capture_date, default=None)
    latest_prediction = latest_image.prediction if latest_image else None
    return ProductOut(
        product_id=product.product_id,
        produce_type=product.produce_type,
        variety=product.variety,
        storage_type=product.storage_type,
        status=product.status,
        outcome=product.outcome,
        completed_at=product.completed_at,
        display_name=product.display_name or f"{product.produce_type.title()} #{product.product_id:03d}",
        date_added=product.date_added,
        latest_stage=latest_prediction.freshness_stage if latest_prediction else None,
        latest_days_remaining=decimal_to_float(latest_prediction.days_remaining) if latest_prediction else None,
        latest_days_display=latest_prediction.days_remaining_display if latest_prediction else None,
        latest_thumbnail_url=path_to_url(latest_image.thumbnail_path) if latest_image else None,
    )


def image_to_out(image: ImageHistory) -> ImageHistoryOut:
    return ImageHistoryOut(
        image_id=image.image_id,
        product_id=image.product_id,
        produce_type=image.product.produce_type if image.product else None,
        display_name=image.product.display_name if image.product else None,
        image_url=path_to_url(image.image_path),
        thumbnail_url=path_to_url(image.thumbnail_path),
        capture_date=image.capture_date,
        original_filename=image.original_filename,
        batch_id=image.batch_id,
        batch_mode=image.batch_mode,
        processing_status=image.processing_status,
        error_message=image.error_message,
        prediction=prediction_to_out(image.prediction) if image.prediction else None,
    )


def prediction_to_out(prediction: Prediction) -> PredictionOut:
    return PredictionOut(
        prediction_id=prediction.prediction_id,
        image_id=prediction.image_id,
        freshness_stage=prediction.freshness_stage,
        days_remaining=decimal_to_float(prediction.days_remaining) or 0,
        days_remaining_display=prediction.days_remaining_display,
        confidence=decimal_to_float(prediction.confidence),
        raw_model_confidence=decimal_to_float(prediction.raw_model_confidence),
        advice=prediction.advice,
        refrigeration_trigger=bool(prediction.refrigeration_trigger),
        fifo_priority=prediction.fifo_priority or "STANDARD",
        action_type=prediction.action_type or "MONITOR",
        analysis_status=prediction.analysis_status or "reliable",
        prediction_source=prediction.prediction_source or "legacy",
        model_version=prediction.model_version,
        verification_status=prediction.verification_status or "not_requested",
        model_class=prediction.model_class,
        predicted_at=prediction.predicted_at,
    )


def path_to_url(path: Optional[str]) -> Optional[str]:
    if not path or path == "pending":
        return None
    name = Path(path).name
    return f"/uploads/{name}"


# ═══════════════════════════════════════════════════════════════════════════════
# API v1 routes — additive only, existing routes above are untouched
# ═══════════════════════════════════════════════════════════════════════════════

_PRODUCE_TYPES = list(SUPPORTED_PRODUCE)
_FRESHNESS_STAGES = ["Fresh", "Early Ripening", "Mid-Ripening", "Late Ripening", "Spoiled"]
_STORAGE_OPTIONS = ["room", "fridge", "container"]
_MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
_ANALYSIS_SECRET = os.getenv("ANALYSIS_TOKEN_SECRET", "chronofresh-local-development-secret").encode()


def _urgency_key(product: ProductOut) -> tuple[bool, float]:
    days = product.latest_days_remaining
    return (days is None, days if days is not None else 999.0)


def _prediction_payload(result, produce_type: str) -> dict:
    return {
        "produce_type": produce_type,
        "freshness_stage": result.freshness_stage,
        "days_remaining": result.days_remaining,
        "days_remaining_display": result.days_remaining_display,
        "confidence": result.confidence,
        "raw_model_confidence": result.raw_model_confidence,
        "advice": result.advice,
        "refrigeration_trigger": result.refrigeration_trigger,
        "fifo_priority": result.fifo_priority,
        "action_type": result.action_type,
        "analysis_status": result.analysis_status,
        "prediction_source": result.prediction_source,
        "model_version": result.model_version,
        "verification_status": result.verification_status,
        "uncertainty_reason": result.uncertainty_reason,
        "model_class": result.model_class,
    }


def _validate_produce_type(produce_type: str) -> None:
    try:
        validate_produce_type(produce_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _issue_analysis_token(payload: dict) -> str:
    data = {**payload, "expires_at": int(time.time()) + 3600}
    body = base64.urlsafe_b64encode(
        json.dumps(data, separators=(",", ":"), sort_keys=True).encode()
    ).decode().rstrip("=")
    signature = hmac.new(_ANALYSIS_SECRET, body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{signature}"


def _read_analysis_token(token: str, produce_type: str, image_sha256: str) -> dict:
    try:
        body, signature = token.rsplit(".", 1)
        expected = hmac.new(_ANALYSIS_SECRET, body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("signature")
        padded = body + "=" * (-len(body) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded).decode())
        if payload["expires_at"] < int(time.time()):
            raise ValueError("expired")
        if payload["produce_type"] != produce_type:
            raise ValueError("produce type")
        if payload.get("image_sha256") and payload["image_sha256"] != image_sha256:
            raise ValueError("image")
        return payload
    except (ValueError, KeyError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Analysis token is invalid or expired. Analyze the image again.") from exc


def _is_use_soon(p: ProductOut) -> bool:
    return (
        p.latest_stage in {"Late Ripening", "Spoiled"}
        or (p.latest_days_remaining is not None and p.latest_days_remaining <= 1.5)
    )


# ── API 1: Health ──────────────────────────────────────────────────────────────

@app.get("/api/v1/health", tags=["v1"])
def v1_health():
    return {
        "status": "ok", "version": "1.0.0",
        "prediction_provider": prediction_service.provider_name,
        "model_version": prediction_service.model_version,
    }


# ── API 2: Meta/configuration ──────────────────────────────────────────────────

@app.get("/api/v1/meta", response_model=MetaOut, tags=["v1"])
def v1_meta():
    return MetaOut(
        produce_types=_PRODUCE_TYPES,
        freshness_stages=_FRESHNESS_STAGES,
        storage_options=_STORAGE_OPTIONS,
        use_real_model=prediction_service.provider_name == "keras",
        prediction_provider=prediction_service.provider_name,
        model_version=prediction_service.model_version,
    )


# ── API 3: Analyze (no save) ───────────────────────────────────────────────────

@app.post("/api/v1/analyze", response_model=AnalyzeResult, tags=["v1"])
async def v1_analyze(
    file: Annotated[UploadFile, File()],
    produce_type: Annotated[str, Form()],
):
    """Analyze a produce image and return freshness prediction without saving anything."""
    ptype = produce_type.strip().lower()
    _validate_produce_type(ptype)
    normalized = await read_validated_image(file, _MAX_UPLOAD_MB)
    temp_path = UPLOAD_DIR / f"analysis_{uuid4().hex}.jpg"
    try:
        temp_path.write_bytes(normalized)
        payload = _prediction_payload(prediction_service.predict(temp_path, ptype), ptype)
        token_payload = {**payload, "image_sha256": hashlib.sha256(normalized).hexdigest()}
        return AnalyzeResult(**payload, analysis_token=_issue_analysis_token(token_payload))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Analysis failed. Please try another image.") from exc
    finally:
        temp_path.unlink(missing_ok=True)


# ── API 4: Save / Create produce ───────────────────────────────────────────────

@app.post("/api/v1/produce", response_model=ProductOut, status_code=201, tags=["v1"])
async def v1_create_produce(
    file: Annotated[UploadFile, File()],
    produce_type: Annotated[str, Form()],
    storage_type: Annotated[Optional[str], Form()] = "room",
    display_name: Annotated[Optional[str], Form()] = None,
    analysis_token: Annotated[Optional[str], Form()] = None,
    db: Session = Depends(get_db),
):
    """Save a produce item with its first scan and prediction."""
    ptype = produce_type.strip().lower()
    _validate_produce_type(ptype)
    normalized = await read_validated_image(file, _MAX_UPLOAD_MB)
    image_path: Optional[Path] = None
    thumbnail_path: Optional[Path] = None
    try:
        image_path, thumbnail_path = save_normalized_image(normalized, UPLOAD_DIR)
        payload = (
            _read_analysis_token(analysis_token, ptype, hashlib.sha256(normalized).hexdigest())
            if analysis_token
            else _prediction_payload(prediction_service.predict(image_path, ptype), ptype)
        )
        if payload.get("analysis_status", "reliable") == "uncertain":
            raise HTTPException(status_code=422, detail="Uncertain analyses cannot be saved as a definite result. Scan again.")
        product = Product(
            produce_type=ptype,
            storage_type=storage_type or "room",
            display_name=display_name or f"{produce_type.strip().title()} #{uuid4().hex[:4].upper()}",
            status="active",
        )
        db.add(product)
        db.flush()
        image_row = ImageHistory(
            product_id=product.product_id,
            image_path=str(image_path),
            thumbnail_path=str(thumbnail_path),
            capture_date=utcnow(),
            original_filename=file.filename,
            batch_id=uuid4().hex,
            batch_mode="single",
            processing_status="SUCCESS",
        )
        db.add(image_row)
        db.flush()
        pred = Prediction(
            image_id=image_row.image_id,
            freshness_stage=payload["freshness_stage"],
            days_remaining=payload["days_remaining"],
            days_remaining_display=payload["days_remaining_display"],
            confidence=payload["confidence"],
            raw_model_confidence=payload.get("raw_model_confidence", payload.get("confidence")),
            advice=payload["advice"],
            refrigeration_trigger=payload["refrigeration_trigger"],
            fifo_priority=payload["fifo_priority"],
            action_type=payload["action_type"],
            analysis_status=payload.get("analysis_status", "reliable"),
            prediction_source=payload.get("prediction_source", "legacy-token"),
            model_version=payload.get("model_version"),
            verification_status=payload.get("verification_status", "not_requested"),
            model_class=payload.get("model_class"),
        )
        db.add(pred)
        db.commit()
        db.refresh(product)
    except HTTPException:
        db.rollback()
        if image_path:
            image_path.unlink(missing_ok=True)
        if thumbnail_path:
            thumbnail_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        db.rollback()
        if image_path:
            image_path.unlink(missing_ok=True)
        if thumbnail_path:
            thumbnail_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Could not save produce item.") from exc

    return product_to_out(product)


# ── API 5: List produce ────────────────────────────────────────────────────────

@app.get("/api/v1/produce", response_model=list[ProductOut], tags=["v1"])
def v1_list_produce(
    status: Optional[str] = "active",
    produce_type: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "urgency",
    db: Session = Depends(get_db),
):
    """List produce. status: active (default) | completed | all."""
    query = db.query(Product).options(
        selectinload(Product.images).selectinload(ImageHistory.prediction)
    )
    if status and status != "all":
        if status == "completed":
            query = query.filter(Product.status == "completed")
        else:  # active
            query = query.filter(Product.status != "completed")
    if produce_type:
        query = query.filter(Product.produce_type == produce_type.strip().lower())

    items = [product_to_out(p) for p in query.all()]

    if search:
        q = search.strip().lower()
        items = [p for p in items if q in (p.display_name or "").lower() or q in p.produce_type.lower()]

    if sort == "urgency":
        items.sort(key=_urgency_key)
    else:
        items.sort(key=lambda p: p.date_added or datetime.min, reverse=True)

    return items


# ── API 6: Produce detail ──────────────────────────────────────────────────────

@app.get("/api/v1/produce/{product_id}", response_model=ProductOut, tags=["v1"])
def v1_get_produce(product_id: int, db: Session = Depends(get_db)):
    return product_to_out(load_product(db, product_id))


# ── API 7: Update produce ──────────────────────────────────────────────────────

@app.patch("/api/v1/produce/{product_id}", response_model=ProductOut, tags=["v1"])
def v1_update_produce(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = load_product(db, product_id)
    if payload.display_name is not None:
        product.display_name = payload.display_name.strip() or product.display_name
    if payload.storage_type is not None:
        product.storage_type = payload.storage_type
    db.commit()
    db.refresh(product)
    return product_to_out(product)


# ── API 8: Rescan produce ──────────────────────────────────────────────────────

@app.post("/api/v1/produce/{product_id}/rescan", response_model=ProductOut, tags=["v1"])
async def v1_rescan_produce(
    product_id: int,
    file: Annotated[UploadFile, File()],
    db: Session = Depends(get_db),
):
    """Upload a new image for an existing produce item. Adds a new scan without replacing history."""
    product = load_product(db, product_id)
    normalized = await read_validated_image(file, _MAX_UPLOAD_MB)
    image_path: Optional[Path] = None
    thumbnail_path: Optional[Path] = None
    try:
        image_path, thumbnail_path = save_normalized_image(normalized, UPLOAD_DIR)
        image_row = ImageHistory(
            product_id=product.product_id,
            image_path=str(image_path),
            thumbnail_path=str(thumbnail_path),
            capture_date=utcnow(),
            original_filename=file.filename,
            batch_id=uuid4().hex,
            batch_mode="single",
            processing_status="SUCCESS",
        )
        db.add(image_row)
        db.flush()
        result = prediction_service.predict(image_path, product.produce_type)
        if result.analysis_status == "uncertain":
            image_row.processing_status = "UNCERTAIN"
            image_row.error_message = result.uncertainty_reason
            db.commit()
            db.refresh(product)
            return product_to_out(product)
        pred = Prediction(
            image_id=image_row.image_id,
            freshness_stage=result.freshness_stage,
            days_remaining=result.days_remaining,
            days_remaining_display=result.days_remaining_display,
            confidence=result.confidence,
            raw_model_confidence=result.raw_model_confidence,
            advice=result.advice,
            refrigeration_trigger=result.refrigeration_trigger,
            fifo_priority=result.fifo_priority,
            action_type=result.action_type,
            analysis_status=result.analysis_status,
            prediction_source=result.prediction_source,
            model_version=result.model_version,
            verification_status=result.verification_status,
            model_class=result.model_class,
        )
        db.add(pred)
        db.commit()
        db.refresh(product)
    except HTTPException:
        db.rollback()
        if image_path:
            image_path.unlink(missing_ok=True)
        if thumbnail_path:
            thumbnail_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        db.rollback()
        if image_path:
            image_path.unlink(missing_ok=True)
        if thumbnail_path:
            thumbnail_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Rescan failed.") from exc

    return product_to_out(product)


# ── API 9: Scan history ────────────────────────────────────────────────────────

@app.get("/api/v1/produce/{product_id}/history", response_model=list[ImageHistoryOut], tags=["v1"])
def v1_produce_history(product_id: int, db: Session = Depends(get_db)):
    load_product(db, product_id)
    rows = (
        db.query(ImageHistory)
        .options(selectinload(ImageHistory.prediction))
        .filter(ImageHistory.product_id == product_id)
        .order_by(ImageHistory.capture_date.desc())
        .all()
    )
    return [image_to_out(r) for r in rows]


# ── API 10: Timeline ───────────────────────────────────────────────────────────

@app.get("/api/v1/produce/{product_id}/timeline", response_model=list[TimelinePoint], tags=["v1"])
def v1_produce_timeline(product_id: int, db: Session = Depends(get_db)):
    load_product(db, product_id)
    rows = (
        db.query(ImageHistory)
        .options(selectinload(ImageHistory.prediction))
        .filter(ImageHistory.product_id == product_id, ImageHistory.processing_status == "SUCCESS")
        .order_by(ImageHistory.capture_date.asc())
        .all()
    )
    return [
        TimelinePoint(
            image_id=r.image_id,
            capture_date=r.capture_date,
            freshness_stage=r.prediction.freshness_stage,
            days_remaining=decimal_to_float(r.prediction.days_remaining) or 0.0,
            days_remaining_display=r.prediction.days_remaining_display,
            confidence=decimal_to_float(r.prediction.confidence) or 0.0,
            advice=r.prediction.advice or "",
            refrigeration_trigger=bool(r.prediction.refrigeration_trigger),
            fifo_priority=r.prediction.fifo_priority or "STANDARD",
            thumbnail_url=path_to_url(r.thumbnail_path),
            image_url=path_to_url(r.image_path),
        )
        for r in rows
        if r.prediction
    ]


# ── API 11: Complete produce ───────────────────────────────────────────────────

@app.post("/api/v1/produce/{product_id}/complete", response_model=ProductOut, tags=["v1"])
def v1_complete_produce(product_id: int, payload: CompleteRequest, db: Session = Depends(get_db)):
    """Mark a produce item as consumed or discarded. Preserves all history."""
    product = load_product(db, product_id)
    if product.status == "completed":
        raise HTTPException(status_code=409, detail="This produce item is already completed.")
    product.status = "completed"
    product.outcome = payload.outcome
    product.completed_at = utcnow()
    db.commit()
    db.refresh(product)
    return product_to_out(product)


# ── API 12: Dashboard v1 ──────────────────────────────────────────────────────

@app.get("/api/v1/dashboard", response_model=DashboardV1Out, tags=["v1"])
def v1_dashboard(db: Session = Depends(get_db)):
    """Combined dashboard: stats + priority items + recent scans."""
    all_products = (
        db.query(Product)
        .options(selectinload(Product.images).selectinload(ImageHistory.prediction))
        .all()
    )
    active = [product_to_out(p) for p in all_products if p.status != "completed"]
    active.sort(key=_urgency_key)

    use_soon = [p for p in active if _is_use_soon(p)]
    fresh = [p for p in active if p.latest_stage == "Fresh"]
    spoiled = [p for p in active if p.latest_stage == "Spoiled"]

    recent_images = (
        db.query(ImageHistory)
        .options(
            selectinload(ImageHistory.prediction),
            selectinload(ImageHistory.product),
        )
        .order_by(ImageHistory.capture_date.desc())
        .limit(5)
        .all()
    )

    return DashboardV1Out(
        stats=DashboardV1Stats(
            active_count=len(active),
            use_soon_count=len(use_soon),
            fresh_count=len(fresh),
            spoiled_count=len(spoiled),
        ),
        use_first=use_soon[:5],
        recent_scans=[image_to_out(img) for img in recent_images],
        all_active=active,
    )


# ── API 13: Analytics ─────────────────────────────────────────────────────────

@app.get("/api/v1/analytics", response_model=AnalyticsOut, tags=["v1"])
def v1_analytics(db: Session = Depends(get_db)):
    """Aggregated analytics for the Analytics page."""
    all_products = (
        db.query(Product)
        .options(selectinload(Product.images).selectinload(ImageHistory.prediction))
        .all()
    )
    active = [p for p in all_products if p.status != "completed"]
    completed = [p for p in all_products if p.status == "completed"]
    consumed = [p for p in all_products if p.outcome == "consumed"]
    discarded = [p for p in all_products if p.outcome == "discarded"]

    all_images = (
        db.query(ImageHistory)
        .filter(ImageHistory.processing_status == "SUCCESS")
        .all()
    )

    # Freshness distribution across active items
    distribution: dict[str, int] = {}
    for p in active:
        out = product_to_out(p)
        if out.latest_stage:
            distribution[out.latest_stage] = distribution.get(out.latest_stage, 0) + 1

    # Scans per day — last 14 days
    today = date.today()
    scans_by_date: dict[str, int] = {}
    for img in all_images:
        d = img.capture_date.date().isoformat()
        scans_by_date[d] = scans_by_date.get(d, 0) + 1

    scans_over_time = [
        ScanOverTime(
            date=(today - timedelta(days=i)).isoformat(),
            count=scans_by_date.get((today - timedelta(days=i)).isoformat(), 0),
        )
        for i in range(13, -1, -1)
    ]

    return AnalyticsOut(
        total_scans=len(all_images),
        active_count=len(active),
        completed_count=len(completed),
        consumed_count=len(consumed),
        discarded_count=len(discarded),
        freshness_distribution=distribution,
        scans_over_time=scans_over_time,
        outcome_distribution={"consumed": len(consumed), "discarded": len(discarded)},
    )
