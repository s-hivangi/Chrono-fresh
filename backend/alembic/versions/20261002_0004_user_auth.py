"""Add account ownership and rotating refresh sessions without altering legacy rows."""

from alembic import op
import sqlalchemy as sa


revision = "20261002_0004"
down_revision = "20260921_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("normalized_email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_normalized_email", "users", ["normalized_email"], unique=True)
    op.create_table(
        "refresh_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("refresh_token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", sa.TIMESTAMP(), nullable=False),
        sa.Column("revoked_at", sa.TIMESTAMP()),
        sa.Column("replaced_by_session_id", sa.String(36)),
    )
    op.create_index("ix_refresh_sessions_user_id", "refresh_sessions", ["user_id"])
    op.add_column("products", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_index("ix_products_user_id", "products", ["user_id"])
    op.create_foreign_key("fk_products_user_id", "products", "users", ["user_id"], ["id"], ondelete="RESTRICT")
    op.add_column("image_history", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_index("ix_image_history_user_id", "image_history", ["user_id"])
    op.create_foreign_key("fk_image_history_user_id", "image_history", "users", ["user_id"], ["id"], ondelete="RESTRICT")
    # Existing rows remain NULL-owned. No account receives them automatically.


def downgrade() -> None:
    op.drop_constraint("fk_image_history_user_id", "image_history", type_="foreignkey")
    op.drop_index("ix_image_history_user_id", table_name="image_history")
    op.drop_column("image_history", "user_id")
    op.drop_constraint("fk_products_user_id", "products", type_="foreignkey")
    op.drop_index("ix_products_user_id", table_name="products")
    op.drop_column("products", "user_id")
    op.drop_index("ix_refresh_sessions_user_id", table_name="refresh_sessions")
    op.drop_table("refresh_sessions")
    op.drop_index("ix_users_normalized_email", table_name="users")
    op.drop_table("users")
