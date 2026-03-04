from fastapi import FastAPI, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import select

from .db import engine, SessionLocal
from .models import Base, Location, LocationCounter, Item, Asset, AssetMovement
from .seed import seed_locations

app = FastAPI(title="Inventario ITS", version="0.2.0")

Base.metadata.create_all(bind=engine)
seed_locations()


def generate_inventory_code(db: Session, location_code: str) -> str:
    # Trova la location
    loc = db.execute(select(Location).where(Location.code == location_code)).scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Sede non trovata: {location_code}")

    # Prendi o crea counter della sede
    counter = db.execute(select(LocationCounter).where(LocationCounter.location_id == loc.id)).scalar_one_or_none()
    if not counter:
        counter = LocationCounter(location_id=loc.id, next_number=1)
        db.add(counter)
        db.flush()  # assegna

    n = counter.next_number
    if n > 9999:
        raise HTTPException(status_code=400, detail=f"Progressivo esaurito per sede {location_code}")

    code = f"ITST-{loc.code}-{n:04d}"

    # incrementa per il prossimo
    counter.next_number = n + 1
    return code

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/locations")
def get_locations():
    db = SessionLocal()
    rows = db.query(Location).all()
    db.close()
    return rows


@app.post("/items")
def create_item(
    name: str = Body(...),
    category: str = Body(...),
    is_serialized: bool = Body(True),
):
    db = SessionLocal()
    item = Item(name=name, category=category, is_serialized=is_serialized)
    db.add(item)
    db.commit()
    db.refresh(item)
    db.close()
    return item


@app.get("/items")
def list_items():
    db = SessionLocal()
    items = db.query(Item).all()
    db.close()
    return items


@app.post("/assets")
def create_asset(item_id: int, location_code: str, notes: str | None = None):
    db = SessionLocal()

    item = db.execute(select(Item).where(Item.id == item_id)).scalar_one_or_none()
    if not item:
        db.close()
        raise HTTPException(status_code=404, detail=f"Item non trovato: {item_id}")
    if not item.is_serialized:
        db.close()
        raise HTTPException(status_code=400, detail="Questo item non è serializzato (usa StockCard in futuro).")

    # Transazione semplice: se qualcosa va male, rollback
    try:
        inv_code = generate_inventory_code(db, location_code)
        loc = db.execute(select(Location).where(Location.code == location_code)).scalar_one()

        asset = Asset(
            inventory_code=inv_code,
            item_id=item.id,
            current_location_id=loc.id,
            status="IN_SEDE",
            notes=notes
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

from fastapi import Body
from sqlalchemy import select

@app.post("/assets/{asset_id}/transfer")
def transfer_asset(
    asset_id: int,
    to_location_code: str = Body(...),
    moved_by: str | None = Body(None),
    notes: str | None = Body(None),
):
    db = SessionLocal()
    try:
        asset = db.execute(select(Asset).where(Asset.id == asset_id)).scalar_one_or_none()
        if not asset:
            raise HTTPException(status_code=404, detail=f"Asset non trovato: {asset_id}")

        to_loc = db.execute(select(Location).where(Location.code == to_location_code)).scalar_one_or_none()
        if not to_loc:
            raise HTTPException(status_code=404, detail=f"Sede non trovata: {to_location_code}")

        from_loc_id = asset.current_location_id

        # Se vuoi evitare trasferimenti "uguali"
        if from_loc_id == to_loc.id:
            raise HTTPException(status_code=400, detail="L'asset è già in questa sede.")

        movement = AssetMovement(
            asset_id=asset.id,
            from_location_id=from_loc_id,
            to_location_id=to_loc.id,
            moved_by=moved_by,
            notes=notes
        )
        db.add(movement)

        # aggiorna la sede attuale dell'asset
        asset.current_location_id = to_loc.id
        asset.status = "IN_SEDE"

        db.commit()
        db.refresh(asset)
        return asset
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

@app.post("/assets/{asset_id}/assign")
def assign_asset(
    asset_id: int,
    assigned_to: str = Body(...),
    notes: str | None = Body(None)
):
    db = SessionLocal()

    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset non trovato")

    asset.assigned_to = assigned_to
    asset.status = "ASSEGNATO"

    if notes:
        asset.notes = notes

    db.commit()
    db.refresh(asset)

    db.close()

    return asset

@app.get("/assets")
def list_assets():
    db = SessionLocal()
    rows = db.query(Asset).all()
    db.close()
    return rows

@app.get("/assets/{inventory_code}")
def get_asset_by_code(inventory_code: str):
    db = SessionLocal()
    asset = db.execute(
        select(Asset).where(Asset.inventory_code == inventory_code)
    ).scalar_one_or_none()
    db.close()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset non trovato")
    return asset

@app.get("/assets/{asset_id}/history")
def asset_history(asset_id: int):
    db = SessionLocal()
    rows = (
        db.query(AssetMovement)
        .filter(AssetMovement.asset_id == asset_id)
        .order_by(AssetMovement.moved_at.desc())
        .all()
    )
    db.close()
    return rows

@app.get("/debug/routes")
def debug_routes():
    return [r.path for r in app.routes]

@app.get("/ping")
def ping():
    return {"pong": True}

from sqlalchemy import or_

@app.get("/assets-search")
def search_assets(q: str):
    q = q.strip()
    db = SessionLocal()
    rows = db.execute(
        select(Asset).where(
            or_(
                Asset.inventory_code.ilike(f"%{q}%"),
                Asset.assigned_to.ilike(f"%{q}%"),
                Asset.notes.ilike(f"%{q}%"),
            )
        )
    ).scalars().all()
    db.close()
    return rows