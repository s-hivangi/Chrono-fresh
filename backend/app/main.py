from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Annotated, Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, selectinload

from . import models  # noqa: F401 -- needed so tables are registered on Base
from .database import Base, engine, ensure_mvp_columns, get_db
from .image_utils import save_upload_image
from .models import ImageHistory, Prediction, Product
from .prediction_service import ModelInferenceEngine
from .schemas import (
    DashboardStats,
    ImageHistoryOut,
    PredictionOut,
    ProductCreate,
    ProductOut,
    TimelinePoint,
    UploadResult,
    decimal_to_float,
)


BASE_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Chrono-Fresh API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Creates tables in Postgres/SQLite if they don't already exist.
Base.metadata.create_all(bind=engine)
ensure_mvp_columns()
prediction_service = ModelInferenceEngine()



@app.get("/")
def root():
    return {"message": "Chrono-Fresh backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/products", response_model=ProductOut)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
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
        elif out.latest_stage in {"Late Ripe", "Spoiled"} or (out.latest_days_remaining is not None and out.latest_days_remaining <= 1.5):
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
            capture_date=datetime.utcnow(),
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
            prediction = Prediction(
                image_id=image_row.image_id,
                freshness_stage=prediction_result.freshness_stage,
                days_remaining=prediction_result.days_remaining,
                days_remaining_display=prediction_result.days_remaining_display,
                confidence=prediction_result.confidence,
                advice=prediction_result.advice,
                refrigeration_trigger=prediction_result.refrigeration_trigger,
                fifo_priority=prediction_result.fifo_priority,
                action_type=prediction_result.action_type,
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
        confidence=decimal_to_float(prediction.confidence) or 0,
        advice=prediction.advice,
        refrigeration_trigger=bool(prediction.refrigeration_trigger),
        fifo_priority=prediction.fifo_priority or "STANDARD",
        action_type=prediction.action_type or "MONITOR",
        predicted_at=prediction.predicted_at,
    )


def path_to_url(path: Optional[str]) -> Optional[str]:
    if not path or path == "pending":
        return None
    name = Path(path).name
    return f"/uploads/{name}"

