"""baseline current schema

Revision ID: 20260529_0001
Revises:
Create Date: 2026-05-29
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260529_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if not table_exists("locations"):
        op.create_table(
            "locations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("code", sa.String(length=10), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("code"),
        )
        op.create_index("ix_locations_id", "locations", ["id"], unique=False)

    if not table_exists("categories"):
        op.create_table(
            "categories",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=100), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("name"),
        )
        op.create_index("ix_categories_id", "categories", ["id"], unique=False)

    if not table_exists("location_counters"):
        op.create_table(
            "location_counters",
            sa.Column("location_id", sa.Integer(), nullable=False),
            sa.Column("next_number", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["location_id"], ["locations.id"]),
            sa.PrimaryKeyConstraint("location_id"),
        )

    if not table_exists("items"):
        op.create_table(
            "items",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("category_id", sa.Integer(), nullable=False),
            sa.Column("brand", sa.String(length=100), nullable=True),
            sa.Column("model", sa.String(length=100), nullable=True),
            sa.Column("technical_specs", sa.String(length=2000), nullable=True),
            sa.Column("is_serialized", sa.Boolean(), nullable=False),
            sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_items_id", "items", ["id"], unique=False)

    if not table_exists("assets"):
        op.create_table(
            "assets",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("inventory_code", sa.String(length=20), nullable=False),
            sa.Column("item_id", sa.Integer(), nullable=False),
            sa.Column("current_location_id", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("assigned_to", sa.String(length=255), nullable=True),
            sa.Column("notes", sa.String(length=500), nullable=True),
            sa.ForeignKeyConstraint(["current_location_id"], ["locations.id"]),
            sa.ForeignKeyConstraint(["item_id"], ["items.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("inventory_code", name="uq_assets_inventory_code"),
        )
        op.create_index("ix_assets_id", "assets", ["id"], unique=False)

    if not table_exists("asset_movements"):
        op.create_table(
            "asset_movements",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("asset_id", sa.Integer(), nullable=False),
            sa.Column("from_location_id", sa.Integer(), nullable=True),
            sa.Column("to_location_id", sa.Integer(), nullable=False),
            sa.Column("moved_at", sa.DateTime(), nullable=False),
            sa.Column("moved_by", sa.String(length=255), nullable=True),
            sa.Column("notes", sa.String(length=500), nullable=True),
            sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
            sa.ForeignKeyConstraint(["from_location_id"], ["locations.id"]),
            sa.ForeignKeyConstraint(["to_location_id"], ["locations.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_asset_movements_asset_id", "asset_movements", ["asset_id"], unique=False)
        op.create_index("ix_asset_movements_id", "asset_movements", ["id"], unique=False)

    if not table_exists("asset_logs"):
        op.create_table(
            "asset_logs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("asset_id", sa.Integer(), nullable=False),
            sa.Column("action_type", sa.String(length=50), nullable=False),
            sa.Column("description", sa.String(length=500), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("created_by", sa.String(length=255), nullable=True),
            sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_asset_logs_asset_id", "asset_logs", ["asset_id"], unique=False)
        op.create_index("ix_asset_logs_id", "asset_logs", ["id"], unique=False)

    if not table_exists("stock_cards"):
        op.create_table(
            "stock_cards",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("item_id", sa.Integer(), nullable=False),
            sa.Column("location_id", sa.Integer(), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("min_threshold", sa.Integer(), nullable=False),
            sa.Column("notes", sa.String(length=500), nullable=True),
            sa.ForeignKeyConstraint(["item_id"], ["items.id"]),
            sa.ForeignKeyConstraint(["location_id"], ["locations.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("item_id", "location_id", name="uq_stock_item_location"),
        )
        op.create_index("ix_stock_cards_id", "stock_cards", ["id"], unique=False)
        op.create_index("ix_stock_cards_item_id", "stock_cards", ["item_id"], unique=False)
        op.create_index("ix_stock_cards_location_id", "stock_cards", ["location_id"], unique=False)

    if not table_exists("stock_movements"):
        op.create_table(
            "stock_movements",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("stock_card_id", sa.Integer(), nullable=False),
            sa.Column("movement_type", sa.String(length=20), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("notes", sa.String(length=500), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["stock_card_id"], ["stock_cards.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_stock_movements_id", "stock_movements", ["id"], unique=False)
        op.create_index("ix_stock_movements_stock_card_id", "stock_movements", ["stock_card_id"], unique=False)

    if not table_exists("events"):
        op.create_table(
            "events",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("location", sa.String(length=255), nullable=True),
            sa.Column("start_date", sa.String(length=20), nullable=True),
            sa.Column("end_date", sa.String(length=20), nullable=True),
            sa.Column("manager", sa.String(length=255), nullable=True),
            sa.Column("notes", sa.String(length=500), nullable=True),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_events_id", "events", ["id"], unique=False)

    if not table_exists("event_assets"):
        op.create_table(
            "event_assets",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("event_id", sa.Integer(), nullable=False),
            sa.Column("asset_id", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("notes", sa.String(length=500), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("returned_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
            sa.ForeignKeyConstraint(["event_id"], ["events.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("event_id", "asset_id", name="uq_event_asset"),
        )
        op.create_index("ix_event_assets_asset_id", "event_assets", ["asset_id"], unique=False)
        op.create_index("ix_event_assets_event_id", "event_assets", ["event_id"], unique=False)
        op.create_index("ix_event_assets_id", "event_assets", ["id"], unique=False)

    if not table_exists("event_stocks"):
        op.create_table(
            "event_stocks",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("event_id", sa.Integer(), nullable=False),
            sa.Column("stock_card_id", sa.Integer(), nullable=False),
            sa.Column("quantity_out", sa.Integer(), nullable=False),
            sa.Column("quantity_returned", sa.Integer(), nullable=False),
            sa.Column("notes", sa.String(length=500), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["event_id"], ["events.id"]),
            sa.ForeignKeyConstraint(["stock_card_id"], ["stock_cards.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_event_stocks_event_id", "event_stocks", ["event_id"], unique=False)
        op.create_index("ix_event_stocks_id", "event_stocks", ["id"], unique=False)
        op.create_index("ix_event_stocks_stock_card_id", "event_stocks", ["stock_card_id"], unique=False)


def downgrade() -> None:
    for table_name in [
        "event_stocks",
        "event_assets",
        "events",
        "stock_movements",
        "stock_cards",
        "asset_logs",
        "asset_movements",
        "assets",
        "items",
        "location_counters",
        "categories",
        "locations",
    ]:
        if table_exists(table_name):
            op.drop_table(table_name)
