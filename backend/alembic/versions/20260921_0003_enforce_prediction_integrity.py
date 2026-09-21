"""Enforce required parent links and one prediction per image."""

from alembic import op
import sqlalchemy as sa


revision = "20260921_0003"
down_revision = "20260921_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("image_history", "product_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("predictions", "image_id", existing_type=sa.Integer(), nullable=False)
    op.create_unique_constraint("uq_predictions_image_id", "predictions", ["image_id"])


def downgrade() -> None:
    op.drop_constraint("uq_predictions_image_id", "predictions", type_="unique")
    op.alter_column("predictions", "image_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("image_history", "product_id", existing_type=sa.Integer(), nullable=True)
