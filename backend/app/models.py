from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from .db import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(255), nullable=False)


class LocationCounter(Base):
    __tablename__ = "location_counters"

    location_id = Column(Integer, ForeignKey("locations.id"), primary_key=True)
    next_number = Column(Integer, nullable=False, default=1)

    location = relationship("Location")


# Category model
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    technical_specs = Column(String(2000), nullable=True)

    category = relationship("Category")
    is_serialized = Column(Boolean, nullable=False, default=True)


class Asset(Base):
    __tablename__ = "assets"

    __table_args__ = (
        UniqueConstraint("inventory_code", name="uq_assets_inventory_code"),
    )

    id = Column(Integer, primary_key=True, index=True)
    inventory_code = Column(String(20), nullable=False)

    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    current_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)

    status = Column(String(20), nullable=False, default="IN_SEDE")
    assigned_to = Column(String(255), nullable=True)
    notes = Column(String(500), nullable=True)

    item = relationship("Item")
    current_location = relationship("Location")

class AssetMovement(Base):
    __tablename__ = "asset_movements"

    id = Column(Integer, primary_key=True, index=True)

    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)

    from_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    to_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)

    moved_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    moved_by = Column(String(255), nullable=True)   # es: "tutor aula", "segreteria", etc.
    notes = Column(String(500), nullable=True)

    asset = relationship("Asset")
    from_location = relationship("Location", foreign_keys=[from_location_id])
    to_location = relationship("Location", foreign_keys=[to_location_id])

class StockCard(Base):
    __tablename__ = "stock_cards"

    __table_args__ = (
        UniqueConstraint("item_id", "location_id", name="uq_stock_item_location"),
    )

    id = Column(Integer, primary_key=True, index=True)

    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)

    quantity = Column(Integer, nullable=False, default=0)
    min_threshold = Column(Integer, nullable=False, default=0)
    notes = Column(String(500), nullable=True)

    item = relationship("Item")
    location = relationship("Location")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)

    stock_card_id = Column(Integer, ForeignKey("stock_cards.id"), nullable=False, index=True)
    movement_type = Column(String(20), nullable=False)  # LOAD, UNLOAD, RETURN, ADJUST
    quantity = Column(Integer, nullable=False)

    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    stock_card = relationship("StockCard")


# Event-related models
class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    manager = Column(String(255), nullable=True)
    notes = Column(String(500), nullable=True)

    status = Column(String(20), nullable=False, default="OPEN")  # OPEN, CLOSED
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class EventAsset(Base):
    __tablename__ = "event_assets"

    __table_args__ = (
        UniqueConstraint("event_id", "asset_id", name="uq_event_asset"),
    )

    id = Column(Integer, primary_key=True, index=True)

    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)

    status = Column(String(20), nullable=False, default="OUT")  # OUT, RETURNED, MISSING
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    returned_at = Column(DateTime, nullable=True)

    event = relationship("Event")
    asset = relationship("Asset")


class EventStock(Base):
    __tablename__ = "event_stocks"

    id = Column(Integer, primary_key=True, index=True)

    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    stock_card_id = Column(Integer, ForeignKey("stock_cards.id"), nullable=False, index=True)

    quantity_out = Column(Integer, nullable=False)
    quantity_returned = Column(Integer, nullable=False, default=0)

    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    event = relationship("Event")
    stock_card = relationship("StockCard")