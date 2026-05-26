from datetime import datetime
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from io import BytesIO
import qrcode

from .db import engine, SessionLocal
from .models import Base, Location, LocationCounter, Category, Item, Asset, AssetMovement, StockCard, StockMovement, Event, EventAsset, EventStock
from .seed import seed_categories, seed_locations

app = FastAPI(title="Inventario ITS", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Solo ambiente di sviluppo
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
seed_locations()
seed_categories()



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


# --- HELPER FOR ITEM SERIALIZATION ---
def serialize_item(item: Item, asset_count: int | None = None):
    category = item.category

    return {
        "id": item.id,
        "name": item.name,
        "category_id": item.category_id,
        "category": None if not category else {
            "id": category.id,
            "name": category.name,
        },
        "brand": item.brand,
        "model": item.model,
        "technical_specs": item.technical_specs,
        "is_serialized": item.is_serialized,
        "asset_count": asset_count,
    }

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/locations")
def get_locations():
    db = SessionLocal()
    rows = db.query(Location).all()
    db.close()
    return rows


@app.get("/categories")
def get_categories():
    db = SessionLocal()
    rows = db.query(Category).order_by(Category.name.asc()).all()
    db.close()
    return rows


@app.post("/items")
def create_item(
    name: str = Body(...),
    category_id: int = Body(...),
    brand: str | None = Body(None),
    model: str | None = Body(None),
    technical_specs: str | None = Body(None),
    is_serialized: bool = Body(True),
):
    db = SessionLocal()
    category = db.execute(select(Category).where(Category.id == category_id)).scalar_one_or_none()
    if not category:
        db.close()
        raise HTTPException(status_code=404, detail=f"Categoria non trovata: {category_id}")
    item = Item(
        name=name,
        category_id=category.id,
        brand=brand,
        model=model,
        technical_specs=technical_specs,
        is_serialized=is_serialized,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    item.category = category
    serialized = serialize_item(item, asset_count=0)
    db.close()
    return serialized



@app.get("/items")
def list_items():
    db = SessionLocal()
    items = db.query(Item).all()
    rows = []

    for item in items:
        asset_count = db.query(Asset).filter(Asset.item_id == item.id).count()
        rows.append(serialize_item(item, asset_count=asset_count))
    db.close()
    return rows


# --- GET/UPDATE ITEM ENDPOINTS ---

@app.get("/items/{item_id}")
def get_item(item_id: int):
    db = SessionLocal()
    item = db.execute(select(Item).where(Item.id == item_id)).scalar_one_or_none()

    if not item:
        db.close()
        raise HTTPException(status_code=404, detail=f"Item non trovato: {item_id}")

    asset_count = db.query(Asset).filter(Asset.item_id == item.id).count()
    serialized = serialize_item(item, asset_count=asset_count)
    db.close()
    return serialized



@app.put("/items/{item_id}")
def update_item(
    item_id: int,
    name: str = Body(...),
    category_id: int = Body(...),
    brand: str | None = Body(None),
    model: str | None = Body(None),
    technical_specs: str | None = Body(None),
    is_serialized: bool = Body(True),
):
    db = SessionLocal()

    try:
        item = db.execute(select(Item).where(Item.id == item_id)).scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item non trovato: {item_id}")

        category = db.execute(select(Category).where(Category.id == category_id)).scalar_one_or_none()
        if not category:
            raise HTTPException(status_code=404, detail=f"Categoria non trovata: {category_id}")

        item.name = name
        item.category_id = category.id
        item.brand = brand
        item.model = model
        item.technical_specs = technical_specs
        item.is_serialized = is_serialized

        db.commit()
        db.refresh(item)
        item.category = category
        asset_count = db.query(Asset).filter(Asset.item_id == item.id).count()
        serialized = serialize_item(item, asset_count=asset_count)
        return serialized
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# --- DELETE ITEM ENDPOINT ---

@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    db = SessionLocal()

    try:
        item = db.execute(select(Item).where(Item.id == item_id)).scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item non trovato: {item_id}")

        asset_count = db.query(Asset).filter(Asset.item_id == item.id).count()
        if asset_count > 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Impossibile eliminare item: esistono asset collegati. "
                    f"Asset collegati: {asset_count}."
                ),
            )

        stock_count = db.query(StockCard).filter(StockCard.item_id == item.id).count()
        if stock_count > 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Impossibile eliminare item: esistono schede stock collegate. "
                    f"Stockcard collegate: {stock_count}."
                ),
            )

        db.delete(item)
        db.commit()

        return {"deleted": True, "item_id": item_id}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


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

    try:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()

        if not asset:
            raise HTTPException(status_code=404, detail="Asset non trovato")

        asset.assigned_to = assigned_to.strip()
        asset.status = "ASSEGNATO"

        if notes:
            asset.notes = notes

        db.commit()
        db.refresh(asset)

        return asset
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# Unassign endpoint
@app.post("/assets/{asset_id}/unassign")
def unassign_asset(asset_id: int):
    db = SessionLocal()

    try:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()

        if not asset:
            raise HTTPException(status_code=404, detail="Asset non trovato")

        asset.assigned_to = None
        asset.status = "IN_SEDE"

        db.commit()
        db.refresh(asset)

        return asset
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

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


@app.get("/assets/{inventory_code}/detail")
def get_asset_detail_by_code(inventory_code: str):
    db = SessionLocal()
    asset = db.execute(
        select(Asset).where(Asset.inventory_code == inventory_code)
    ).scalar_one_or_none()

    if not asset:
        db.close()
        raise HTTPException(status_code=404, detail="Asset non trovato")

    item = db.execute(select(Item).where(Item.id == asset.item_id)).scalar_one_or_none()
    location = db.execute(
        select(Location).where(Location.id == asset.current_location_id)
    ).scalar_one_or_none()

    serialized_item = None if not item else serialize_item(
        item,
        asset_count=db.query(Asset).filter(Asset.item_id == item.id).count(),
    )

    result = {
        "asset": asset,
        "item": serialized_item,
        "location": location,
    }

    db.close()
    return result

@app.get("/assets/{inventory_code}/qr")
def get_asset_qr(inventory_code: str):
    db = SessionLocal()

    asset = db.query(Asset).filter(Asset.inventory_code == inventory_code).first()
    db.close()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset non trovato")

    url = f"http://localhost:8000/assets/{inventory_code}"

    qr = qrcode.make(url)

    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="image/png")

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


# --- STOCKS ENDPOINTS ---

@app.get("/stocks")
def list_stocks():
    db = SessionLocal()
    rows = db.query(StockCard).all()
    db.close()
    return rows


@app.post("/stocks")
def create_stock_card(
    item_id: int = Body(...),
    location_code: str = Body(...),
    quantity: int = Body(0),
    min_threshold: int = Body(0),
    notes: str | None = Body(None),
):
    db = SessionLocal()

    try:
        item = db.execute(select(Item).where(Item.id == item_id)).scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item non trovato: {item_id}")

        if item.is_serialized:
            raise HTTPException(
                status_code=400,
                detail="Questo item è serializzato: usa /assets per creare beni inventariati singolarmente."
            )

        location = db.execute(select(Location).where(Location.code == location_code)).scalar_one_or_none()
        if not location:
            raise HTTPException(status_code=404, detail=f"Sede non trovata: {location_code}")

        existing = db.execute(
            select(StockCard).where(
                StockCard.item_id == item.id,
                StockCard.location_id == location.id,
            )
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Esiste già una scheda stock per questo item in questa sede."
            )

        if quantity < 0:
            raise HTTPException(status_code=400, detail="La quantità iniziale non può essere negativa.")

        if min_threshold < 0:
            raise HTTPException(status_code=400, detail="La soglia minima non può essere negativa.")

        stock = StockCard(
            item_id=item.id,
            location_id=location.id,
            quantity=quantity,
            min_threshold=min_threshold,
            notes=notes,
        )
        db.add(stock)
        db.flush()

        if quantity > 0:
            movement = StockMovement(
                stock_card_id=stock.id,
                movement_type="LOAD",
                quantity=quantity,
                notes="Carico iniziale",
            )
            db.add(movement)

        db.commit()
        db.refresh(stock)
        return stock
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.post("/stocks/{stock_id}/movement")
def create_stock_movement(
    stock_id: int,
    movement_type: str = Body(...),
    quantity: int = Body(...),
    notes: str | None = Body(None),
):
    db = SessionLocal()

    try:
        stock = db.execute(select(StockCard).where(StockCard.id == stock_id)).scalar_one_or_none()
        if not stock:
            raise HTTPException(status_code=404, detail=f"Scheda stock non trovata: {stock_id}")

        movement_type = movement_type.upper().strip()
        allowed = {"LOAD", "UNLOAD", "RETURN", "ADJUST"}
        if movement_type not in allowed:
            raise HTTPException(
                status_code=400,
                detail="Tipo movimento non valido. Usa LOAD, UNLOAD, RETURN o ADJUST."
            )

        if quantity < 0:
            raise HTTPException(status_code=400, detail="La quantità non può essere negativa.")

        if movement_type in {"LOAD", "RETURN"}:
            stock.quantity += quantity
        elif movement_type == "UNLOAD":
            if quantity > stock.quantity:
                raise HTTPException(
                    status_code=400,
                    detail="Quantità insufficiente per lo scarico."
                )
            stock.quantity -= quantity
        elif movement_type == "ADJUST":
            stock.quantity = quantity

        movement = StockMovement(
            stock_card_id=stock.id,
            movement_type=movement_type,
            quantity=quantity,
            notes=notes,
        )
        db.add(movement)

        db.commit()
        db.refresh(stock)
        return stock
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.get("/stocks/{stock_id}/history")
def stock_history(stock_id: int):
    db = SessionLocal()
    rows = (
        db.query(StockMovement)
        .filter(StockMovement.stock_card_id == stock_id)
        .order_by(StockMovement.created_at.desc())
        .all()
    )
    db.close()
    return rows


# --- EVENTS ENDPOINTS ---

@app.get("/events")
def list_events():
    db = SessionLocal()
    rows = db.query(Event).order_by(Event.created_at.desc()).all()
    db.close()
    return rows


@app.post("/events")
def create_event(
    name: str = Body(...),
    location: str | None = Body(None),
    start_date: str | None = Body(None),
    end_date: str | None = Body(None),
    manager: str | None = Body(None),
    notes: str | None = Body(None),
):
    db = SessionLocal()

    try:
        event = Event(
            name=name,
            location=location,
            start_date=start_date,
            end_date=end_date,
            manager=manager,
            notes=notes,
            status="OPEN",
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.get("/events/{event_id}")
def get_event(event_id: int):
    db = SessionLocal()

    event = db.execute(select(Event).where(Event.id == event_id)).scalar_one_or_none()
    if not event:
        db.close()
        raise HTTPException(status_code=404, detail="Evento non trovato")

    assets = db.query(EventAsset).filter(EventAsset.event_id == event_id).all()
    stocks = db.query(EventStock).filter(EventStock.event_id == event_id).all()

    db.close()

    return {
        "event": event,
        "assets": assets,
        "stocks": stocks,
    }


@app.post("/events/{event_id}/assets")
def add_asset_to_event(
    event_id: int,
    asset_id: int = Body(...),
    notes: str | None = Body(None),
):
    db = SessionLocal()

    try:
        event = db.execute(select(Event).where(Event.id == event_id)).scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Evento non trovato")

        asset = db.execute(select(Asset).where(Asset.id == asset_id)).scalar_one_or_none()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset non trovato")

        existing = db.execute(
            select(EventAsset).where(
                EventAsset.event_id == event_id,
                EventAsset.asset_id == asset_id,
            )
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(status_code=400, detail="Asset già collegato a questo evento")

        event_asset = EventAsset(
            event_id=event.id,
            asset_id=asset.id,
            status="OUT",
            notes=notes,
        )
        db.add(event_asset)

        asset.status = "IN_EVENTO"

        db.commit()
        db.refresh(event_asset)
        return event_asset
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.post("/events/{event_id}/stocks")
def add_stock_to_event(
    event_id: int,
    stock_card_id: int = Body(...),
    quantity_out: int = Body(...),
    notes: str | None = Body(None),
):
    db = SessionLocal()

    try:
        event = db.execute(select(Event).where(Event.id == event_id)).scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Evento non trovato")

        stock = db.execute(select(StockCard).where(StockCard.id == stock_card_id)).scalar_one_or_none()
        if not stock:
            raise HTTPException(status_code=404, detail="Scheda stock non trovata")

        if quantity_out <= 0:
            raise HTTPException(status_code=400, detail="La quantità in uscita deve essere maggiore di zero")

        if quantity_out > stock.quantity:
            raise HTTPException(status_code=400, detail="Quantità stock insufficiente")

        stock.quantity -= quantity_out

        event_stock = EventStock(
            event_id=event.id,
            stock_card_id=stock.id,
            quantity_out=quantity_out,
            quantity_returned=0,
            notes=notes,
        )
        db.add(event_stock)

        movement = StockMovement(
            stock_card_id=stock.id,
            movement_type="UNLOAD",
            quantity=quantity_out,
            notes=f"Uscita per evento: {event.name}" if not notes else f"Uscita per evento: {event.name} - {notes}",
        )
        db.add(movement)

        db.commit()
        db.refresh(event_stock)
        return event_stock
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# --- EVENT ASSET RETURN/MISSING & EVENT STOCK RETURN ENDPOINTS ---

@app.post("/events/{event_id}/assets/{event_asset_id}/return")
def return_event_asset(event_id: int, event_asset_id: int):
    db = SessionLocal()

    try:
        event_asset = db.execute(
            select(EventAsset).where(
                EventAsset.id == event_asset_id,
                EventAsset.event_id == event_id,
            )
        ).scalar_one_or_none()

        if not event_asset:
            raise HTTPException(status_code=404, detail="Asset evento non trovato")

        asset = db.execute(select(Asset).where(Asset.id == event_asset.asset_id)).scalar_one_or_none()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset non trovato")

        event_asset.status = "RETURNED"
        event_asset.returned_at = datetime.utcnow()
        asset.status = "IN_SEDE"

        db.commit()
        db.refresh(event_asset)
        return event_asset
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.post("/events/{event_id}/assets/{event_asset_id}/missing")
def mark_event_asset_missing(event_id: int, event_asset_id: int):
    db = SessionLocal()

    try:
        event_asset = db.execute(
            select(EventAsset).where(
                EventAsset.id == event_asset_id,
                EventAsset.event_id == event_id,
            )
        ).scalar_one_or_none()

        if not event_asset:
            raise HTTPException(status_code=404, detail="Asset evento non trovato")

        asset = db.execute(select(Asset).where(Asset.id == event_asset.asset_id)).scalar_one_or_none()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset non trovato")

        event_asset.status = "MISSING"
        event_asset.returned_at = None
        asset.status = "MANCANTE"

        db.commit()
        db.refresh(event_asset)
        return event_asset
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.post("/events/{event_id}/stocks/{event_stock_id}/return")
def return_event_stock(
    event_id: int,
    event_stock_id: int,
    quantity_returned: int = Body(...),
    notes: str | None = Body(None),
):
    db = SessionLocal()

    try:
        event = db.execute(select(Event).where(Event.id == event_id)).scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Evento non trovato")

        event_stock = db.execute(
            select(EventStock).where(
                EventStock.id == event_stock_id,
                EventStock.event_id == event_id,
            )
        ).scalar_one_or_none()

        if not event_stock:
            raise HTTPException(status_code=404, detail="Stock evento non trovato")

        if quantity_returned <= 0:
            raise HTTPException(status_code=400, detail="La quantità rientrata deve essere maggiore di zero")

        remaining_returnable = event_stock.quantity_out - event_stock.quantity_returned
        if quantity_returned > remaining_returnable:
            raise HTTPException(
                status_code=400,
                detail="La quantità rientrata supera quella ancora da registrare come rientrata."
            )

        stock = db.execute(select(StockCard).where(StockCard.id == event_stock.stock_card_id)).scalar_one_or_none()
        if not stock:
            raise HTTPException(status_code=404, detail="Scheda stock non trovata")

        event_stock.quantity_returned += quantity_returned
        stock.quantity += quantity_returned

        movement = StockMovement(
            stock_card_id=stock.id,
            movement_type="RETURN",
            quantity=quantity_returned,
            notes=f"Rientro da evento: {event.name}" if not notes else f"Rientro da evento: {event.name} - {notes}",
        )
        db.add(movement)

        db.commit()
        db.refresh(event_stock)
        return event_stock
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# --- EVENT CLOSE/CANCEL ENDPOINTS ---

@app.post("/events/{event_id}/close")
def close_event(event_id: int):
    db = SessionLocal()

    try:
        event = db.execute(select(Event).where(Event.id == event_id)).scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Evento non trovato")

        if event.status == "CLOSED":
            raise HTTPException(status_code=400, detail="Evento già chiuso")

        if event.status == "CANCELLED":
            raise HTTPException(status_code=400, detail="Evento annullato: non può essere chiuso")

        open_assets = db.query(EventAsset).filter(
            EventAsset.event_id == event_id,
            EventAsset.status == "OUT",
        ).count()

        event_stocks = db.query(EventStock).filter(EventStock.event_id == event_id).all()
        open_stock_returns = sum(
            max(0, event_stock.quantity_out - event_stock.quantity_returned)
            for event_stock in event_stocks
        )

        if open_assets > 0 or open_stock_returns > 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Impossibile chiudere evento: materiale ancora da rientrare. "
                    f"Asset fuori: {open_assets}. Consumabili da rientrare: {open_stock_returns}."
                ),
            )

        event.status = "CLOSED"

        db.commit()
        db.refresh(event)
        return event
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.post("/events/{event_id}/cancel")
def cancel_event(event_id: int):
    db = SessionLocal()

    try:
        event = db.execute(select(Event).where(Event.id == event_id)).scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Evento non trovato")

        if event.status == "CLOSED":
            raise HTTPException(status_code=400, detail="Evento già chiuso: non può essere annullato")

        if event.status == "CANCELLED":
            raise HTTPException(status_code=400, detail="Evento già annullato")

        linked_assets = db.query(EventAsset).filter(EventAsset.event_id == event_id).count()
        linked_stocks = db.query(EventStock).filter(EventStock.event_id == event_id).count()

        if linked_assets > 0 or linked_stocks > 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Impossibile annullare evento: sono già presenti materiali collegati. "
                    "Prima registra i rientri o usa la chiusura evento."
                ),
            )

        event.status = "CANCELLED"

        db.commit()
        db.refresh(event)
        return event
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()