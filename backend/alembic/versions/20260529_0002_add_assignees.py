"""add assignees

Revision ID: 20260529_0002
Revises: 20260529_0001
Create Date: 2026-05-29
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260529_0002"
down_revision: Union[str, None] = "20260529_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    if not table_exists("assignees"):
        op.create_table(
            "assignees",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("type", sa.String(length=20), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=True),
            sa.Column("phone", sa.String(length=50), nullable=True),
            sa.Column("notes", sa.String(length=500), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_assignees_id", "assignees", ["id"], unique=False)

    if not column_exists("assets", "assignee_id"):
        op.add_column("assets", sa.Column("assignee_id", sa.Integer(), nullable=True))
        op.create_index("ix_assets_assignee_id", "assets", ["assignee_id"], unique=False)
        op.create_foreign_key(
            "fk_assets_assignee_id_assignees",
            "assets",
            "assignees",
            ["assignee_id"],
            ["id"],
        )


def downgrade() -> None:
    if column_exists("assets", "assignee_id"):
        op.drop_constraint("fk_assets_assignee_id_assignees", "assets", type_="foreignkey")
        op.drop_index("ix_assets_assignee_id", table_name="assets")
        op.drop_column("assets", "assignee_id")

    if table_exists("assignees"):
        op.drop_index("ix_assignees_id", table_name="assignees")
        op.drop_table("assignees")
