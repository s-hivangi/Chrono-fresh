from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, TIMESTAMP, Boolean, true
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True, index=True)
    produce_type = Column(String(50), nullable=False)      # active scans: banana or guava
    variety = Column(String(100))
    date_added = Column(TIMESTAMP, server_default=func.now())
    storage_type = Column(String(50))                        # room, fridge, container
    status = Column(String(20), default="active")            # active, completed
    outcome = Column(String(20), nullable=True)               # consumed | discarded | None
    completed_at = Column(TIMESTAMP, nullable=True)
    display_name = Column(String(100))

    images = relationship("ImageHistory", back_populates="product", cascade="all, delete")
    owner = relationship("User", back_populates="products")


class ImageHistory(Base):
    __tablename__ = "image_history"

    image_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String, nullable=False)
    thumbnail_path = Column(String)
    original_filename = Column(String)
    capture_date = Column(TIMESTAMP, nullable=False)
    day_number = Column(Integer)
    lighting_condition = Column(String(50))
    angle = Column(String(20))
    remarks = Column(String)
    batch_id = Column(String(64), index=True)
    batch_mode = Column(String(30))                          # same_fruit, different_fruits, single
    processing_status = Column(String(20), default="PENDING") # PENDING, SUCCESS, FAILED
    error_message = Column(String)

    product = relationship("Product", back_populates="images")
    prediction = relationship("Prediction", back_populates="image", uselist=False, cascade="all, delete")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(320), nullable=False)
    normalized_email = Column(String(320), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, server_default=true())
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now())

    products = relationship("Product", back_populates="owner")
    refresh_sessions = relationship("RefreshSession", back_populates="user")


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"

    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    refresh_token_hash = Column(String(64), nullable=False, unique=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    expires_at = Column(TIMESTAMP, nullable=False)
    revoked_at = Column(TIMESTAMP)
    replaced_by_session_id = Column(String(36))

    user = relationship("User", back_populates="refresh_sessions")


class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("image_history.image_id", ondelete="CASCADE"), nullable=False, unique=True)
    freshness_stage = Column(String(30))
    days_remaining = Column(Numeric(4, 1))
    days_remaining_display = Column(String(30))
    confidence = Column(Numeric(4, 3))
    raw_model_confidence = Column(Numeric(4, 3))
    advice = Column(String)
    refrigeration_trigger = Column(Boolean, default=False)
    fifo_priority = Column(String(40))
    action_type = Column(String(40))
    analysis_status = Column(String(20), default="reliable")
    prediction_source = Column(String(40), default="legacy")
    model_version = Column(String(100))
    verification_status = Column(String(30), default="not_requested")
    model_class = Column(String(100))
    predicted_at = Column(TIMESTAMP, server_default=func.now())

    image = relationship("ImageHistory", back_populates="prediction")
    
