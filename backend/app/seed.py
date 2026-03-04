from .db import SessionLocal
from .models import Location

LOCATIONS = [
    ("BA1", "Bari FDL"),
    ("BA2", "Bari Tridente"),
    ("BR1", "Brindisi"),
    ("CO1", "Conversano"),
    ("FA1", "Fasano"),
    ("GR1", "Gravina in Puglia"),
    ("LE1", "Lecce Via Corrado"),
    ("LE2", "Lecce Villa Mellone"),
    ("MA1", "Manduria"),
    ("MF1", "Manfredonia"),
    ("MO1", "Morciano di Leuca"),
    ("PO1", "Poggiardo"),
    ("PU1", "Putignano"),
    ("TA1", "Taranto"),
    ("TR1", "Trani"),
]

def seed_locations():
    db = SessionLocal()
    existing = db.query(Location).count()
    if existing == 0:
        for code, name in LOCATIONS:
            db.add(Location(code=code, name=name))
        db.commit()
    db.close()