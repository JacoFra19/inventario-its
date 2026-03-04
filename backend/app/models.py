from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
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


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
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

from sqlalchemy import DateTime
from datetime import datetime

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