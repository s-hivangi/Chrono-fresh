"""Add model provenance and reliability fields to predictions."""

from alembic import op
import sqlalchemy as sa


revision = "20260921_0002"
down_revision = "20260919_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("predictions", sa.Column("raw_model_confidence", sa.Numeric(4, 3)))
    op.add_column("predictions", sa.Column("analysis_status", sa.String(20), server_default="reliable", nullable=False))
    op.add_column("predictions", sa.Column("prediction_source", sa.String(40), server_default="legacy", nullable=False))
    op.add_column("predictions", sa.Column("model_version", sa.String(100)))
    op.add_column("predictions", sa.Column("verification_status", sa.String(30), server_default="not_requested", nullable=False))
    op.add_column("predictions", sa.Column("model_class", sa.String(100)))


def downgrade() -> None:
    op.drop_column("predictions", "model_class")
    op.drop_column("predictions", "verification_status")
    op.drop_column("predictions", "model_version")
    op.drop_column("predictions", "prediction_source")
    op.drop_column("predictions", "analysis_status")
    op.drop_column("predictions", "raw_model_confidence")
