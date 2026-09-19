"""Create the complete ChronoFresh PostgreSQL schema."""
from alembic import op
import sqlalchemy as sa

revision = "20260919_0001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("product_id", sa.Integer(), primary_key=True),
        sa.Column("produce_type", sa.String(50), nullable=False),
        sa.Column("variety", sa.String(100)),
        sa.Column("date_added", sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column("storage_type", sa.String(50)),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("outcome", sa.String(20)),
        sa.Column("completed_at", sa.TIMESTAMP()),
        sa.Column("display_name", sa.String(100)),
    )
    op.create_index("ix_products_product_id", "products", ["product_id"])
    op.create_table(
        "image_history",
        sa.Column("image_id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.product_id", ondelete="CASCADE")),
        sa.Column("image_path", sa.String(), nullable=False),
        sa.Column("thumbnail_path", sa.String()),
        sa.Column("original_filename", sa.String()),
        sa.Column("capture_date", sa.TIMESTAMP(), nullable=False),
        sa.Column("day_number", sa.Integer()),
        sa.Column("lighting_condition", sa.String(50)),
        sa.Column("angle", sa.String(20)),
        sa.Column("remarks", sa.String()),
        sa.Column("batch_id", sa.String(64)),
        sa.Column("batch_mode", sa.String(30)),
        sa.Column("processing_status", sa.String(20), server_default="PENDING"),
        sa.Column("error_message", sa.String()),
    )
    op.create_index("ix_image_history_image_id", "image_history", ["image_id"])
    op.create_index("ix_image_history_batch_id", "image_history", ["batch_id"])
    op.create_table(
        "predictions",
        sa.Column("prediction_id", sa.Integer(), primary_key=True),
        sa.Column("image_id", sa.Integer(), sa.ForeignKey("image_history.image_id", ondelete="CASCADE")),
        sa.Column("freshness_stage", sa.String(30)),
        sa.Column("days_remaining", sa.Numeric(4, 1)),
        sa.Column("days_remaining_display", sa.String(30)),
        sa.Column("confidence", sa.Numeric(4, 3)),
        sa.Column("advice", sa.String()),
        sa.Column("refrigeration_trigger", sa.Boolean(), server_default=sa.false()),
        sa.Column("fifo_priority", sa.String(40)),
        sa.Column("action_type", sa.String(40)),
        sa.Column("predicted_at", sa.TIMESTAMP(), server_default=sa.func.now()),
    )
    op.create_index("ix_predictions_prediction_id", "predictions", ["prediction_id"])

def downgrade() -> None:
    op.drop_table("predictions")
    op.drop_table("image_history")
    op.drop_table("products")
