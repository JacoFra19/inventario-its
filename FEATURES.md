# Inventario ITS - Implemented Features

## Core

Inventario ITS e' una webapp gestionale per inventario fisico e logistico. Le funzionalita' principali attualmente implementate coprono:

- catalogo item e categorie;
- asset serializzati con codici inventariali univoci;
- stock e consumabili non serializzati;
- eventi e fiere con materiali in uscita e rientro;
- QR code per asset inventariali;
- dashboard operativa con metriche, alert e scorciatoie.

Il frontend comunica con una API FastAPI locale tramite `frontend/src/lib/api.ts`, con `API_BASE` impostato a `http://localhost:8000`.

## Dashboard

La dashboard principale (`frontend/src/app/page.tsx`) mostra una vista sintetica dello stato operativo:

- conteggio item a catalogo;
- conteggio asset fisici;
- conteggio eventi totali, aperti, chiusi e annullati;
- conteggio stock monitorati;
- percentuale di asset in sede;
- stock sotto soglia minima;
- asset in evento;
- asset mancanti;
- eventi aperti.

Sono presenti card di navigazione verso:

- Asset;
- Item;
- Scanner QR;
- Stock e consumabili;
- Eventi e fiere;
- Stampa QR.

La dashboard mostra anche gli eventi recenti con indicatori su:

- asset ancora fuori;
- stock da rientrare;
- asset mancanti;
- stato evento.

## Items

La pagina item (`frontend/src/app/items/page.tsx`) implementa il catalogo tecnico delle tipologie bene.

Funzionalita' presenti:

- lista item filtrabile per testo;
- creazione nuovo item;
- modifica inline di item esistenti;
- eliminazione item con `ConfirmDialog`;
- toast di successo/errore con Sonner;
- gestione categoria, marca, modello, specifiche tecniche;
- flag `is_serialized` per distinguere item serializzati da consumabili;
- visualizzazione conteggio asset collegati;
- blocco eliminazione frontend se l'item ha asset o stockcard collegate.

Il backend espone per gli item:

- `GET /items`
- `GET /items/{item_id}`
- `POST /items`
- `PUT /items/{item_id}`
- `DELETE /items/{item_id}`

La serializzazione item include:

- dati anagrafici item;
- categoria;
- `asset_count`;
- `stock_card_count`.

## Assets

La pagina asset (`frontend/src/app/assets/page.tsx`) gestisce i beni fisici serializzati.

Funzionalita' presenti:

- lista asset con tabella globale `DataTable`;
- filtri per stato, sede e ricerca testuale;
- contatori per asset totali, in sede, assegnati, in evento e mancanti;
- creazione asset partendo da item serializzato e sede;
- generazione codice inventariale automatico per sede;
- navigazione al dettaglio asset tramite riga tabella;
- toast Sonner per feedback creazione;
- link verso catalogo item e scanner QR.

Il dettaglio asset (`frontend/src/app/assets/[code]/page.tsx`) include:

- dati asset e stato corrente;
- dati item collegato;
- sede corrente;
- assegnatario;
- QR code asset;
- storico operativo/log;
- storico movimenti sede;
- trasferimento asset tra sedi;
- assegnazione a persona/reparto;
- rimozione assegnazione;
- segnalazione asset mancante con `ConfirmDialog`;
- ripristino asset mancante con `ConfirmDialog`;
- toast Sonner per feedback operativi.

Stati asset gestiti:

- `IN_SEDE`;
- `ASSEGNATO`;
- `IN_EVENTO`;
- `MANCANTE`.

Endpoint backend principali:

- `GET /assets`
- `POST /assets`
- `GET /assets/{inventory_code}`
- `GET /assets/{inventory_code}/detail`
- `POST /assets/{asset_id}/transfer`
- `POST /assets/{asset_id}/assign`
- `POST /assets/{asset_id}/unassign`
- `POST /assets/{asset_id}/missing`
- `POST /assets/{asset_id}/restore`
- `GET /assets/{asset_id}/history`
- `GET /assets/{asset_id}/logs`

## Stock / Consumabili

La pagina stock (`frontend/src/app/stocks/page.tsx`) gestisce item non serializzati e quantita' per sede.

Funzionalita' presenti:

- lista stockcard selezionabile;
- filtro per ricerca testuale;
- filtro per sede;
- filtro per categoria;
- filtro "solo sotto soglia";
- contatori per schede stock, pezzi disponibili e sotto soglia;
- creazione stockcard per item non serializzato;
- registrazione movimenti stock;
- visualizzazione storico movimenti della stockcard selezionata;
- toast Sonner per creazione stockcard e movimenti.

Tipi movimento supportati:

- `LOAD` - carico;
- `UNLOAD` - scarico/consumo;
- `RETURN` - rientro;
- `ADJUST` - correzione inventario.

Regole backend implementate:

- uno stock per coppia item/sede;
- quantita' iniziale e soglia minima non negative;
- blocco scarico se quantita' insufficiente;
- item serializzati non possono essere usati per stockcard.

Endpoint backend principali:

- `GET /stocks`
- `POST /stocks`
- `POST /stocks/{stock_id}/movement`
- `GET /stocks/{stock_id}/history`

## Eventi

La pagina eventi (`frontend/src/app/events/page.tsx`) gestisce materiali in uscita per eventi, fiere e attivita' esterne.

Funzionalita' presenti:

- creazione evento;
- selezione evento da elenco;
- dettaglio evento selezionato;
- stato evento con badge;
- aggiunta asset serializzati a evento;
- aggiunta stock/consumabili a evento;
- scarico automatico stock quando collegato a evento;
- rientro asset;
- asset segnato come mancante durante evento;
- rientro parziale o totale stock;
- chiusura evento;
- annullamento evento con `ConfirmDialog`;
- stampa report evento;
- tabelle report evento migrate su `DataTable`.

Stati evento gestiti:

- `OPEN`;
- `CLOSED`;
- `CANCELLED`.

Stati materiali evento:

- asset evento: `OUT`, `RETURNED`, `MISSING`;
- stock evento: quantita' uscita e quantita' rientrata.

Regole backend implementate:

- asset non duplicabile nello stesso evento;
- aggiunta asset imposta asset a `IN_EVENTO`;
- rientro asset riporta asset a `IN_SEDE`;
- asset mancante durante evento imposta asset a `MANCANTE`;
- stock in uscita decrementa quantita' disponibile;
- rientro stock incrementa quantita' disponibile;
- chiusura evento consentita solo se non restano asset fuori o stock da rientrare;
- annullamento evento consentito solo se non ci sono materiali collegati.

Endpoint backend principali:

- `GET /events`
- `POST /events`
- `GET /events/{event_id}`
- `POST /events/{event_id}/assets`
- `POST /events/{event_id}/stocks`
- `POST /events/{event_id}/assets/{event_asset_id}/return`
- `POST /events/{event_id}/assets/{event_asset_id}/missing`
- `POST /events/{event_id}/stocks/{event_stock_id}/return`
- `POST /events/{event_id}/close`
- `POST /events/{event_id}/cancel`

## QR Code

Il sistema QR code e' implementato sia lato backend sia lato frontend.

Backend:

- endpoint `GET /assets/{inventory_code}/qr`;
- generazione PNG tramite libreria `qrcode`;
- QR basato su URL asset;
- risposta `StreamingResponse` con media type `image/png`.

Frontend:

- visualizzazione QR nel dettaglio asset;
- pagina `labels` per selezionare asset e stampare etichette QR;
- pagina `scan` con scanner QR via `BarcodeDetector` quando supportato;
- fallback/manual input nella pagina scanner;
- estrazione codice asset da testo o URL scansionato;
- navigazione automatica a `/assets/{inventory_code}`.

## UI / UX

Sistema UI attualmente implementato:

- layout responsive basato su Tailwind;
- palette neutra e moderna;
- card, badge e sezioni operative;
- toast globali Sonner configurati in `frontend/src/app/layout.tsx`;
- rimozione degli usi residui di `alert()` e `window.confirm()` dal frontend;
- `ConfirmDialog` globale per azioni di conferma;
- `DataTable` globale per tabelle riutilizzabili;
- stati vuoti e stati loading dove previsti;
- report evento stampabile con classi `print`.

Feedback utente:

- toast di successo/errore per creazione, modifica, eliminazione e movimentazioni;
- messaggi backend leggibili quando disponibili;
- badge colorati per stati asset, evento e materiali.

## Backend / API

Backend FastAPI con SQLAlchemy.

Funzionalita' backend principali:

- creazione automatica tabelle tramite `Base.metadata.create_all`;
- seed iniziale di sedi e categorie;
- CORS aperto per sviluppo locale;
- healthcheck `GET /health`;
- endpoint debug `GET /debug/routes`;
- endpoint `GET /ping`;
- ricerca asset base con `GET /assets-search`.

Modelli principali:

- `Location`;
- `LocationCounter`;
- `Category`;
- `Item`;
- `Asset`;
- `AssetMovement`;
- `AssetLog`;
- `StockCard`;
- `StockMovement`;
- `Event`;
- `EventAsset`;
- `EventStock`.

Database:

- database relazionale gestito via SQLAlchemy;
- configurazione `DATABASE_URL` da variabile ambiente;
- Docker Compose di sviluppo con Postgres 16 e API Python.

## Regole Di Business

Regole implementate nel codice:

- un item serializzato puo' generare asset fisici;
- un item non serializzato puo' generare stockcard;
- asset e stock sono domini separati;
- codice inventariale asset generato per sede con formato `ITST-{SEDE}-{0000}`;
- progressivo asset gestito con `LocationCounter`;
- item non eliminabile se ha asset collegati;
- item non eliminabile se ha stockcard collegate;
- stockcard unica per coppia item/sede;
- stock non puo' andare sotto zero tramite scarico;
- evento non chiudibile finche' resta materiale da rientrare;
- evento non annullabile se sono gia' presenti materiali collegati;
- asset mancante puo' essere ripristinato solo se in stato `MANCANTE`;
- trasferimento asset verso la stessa sede non consentito.

## Componenti Condivisi

Componenti frontend condivisi presenti:

- `PageHeader` - header pagina con back link e azioni;
- `StatCard` - card metrica con varianti e click/href opzionali;
- `SectionCard` - contenitore sezione coerente;
- `PrimaryButton` - pulsante primario;
- `SecondaryButton` - pulsante secondario;
- `DangerButton` - pulsante distruttivo;
- `StatusBadge` - badge stato con varianti colore;
- `ConfirmDialog` - dialog globale di conferma;
- `DataTable` - tabella generica con colonne, righe, stato vuoto/loading e azioni opzionali.

## Note Tecniche

- Frontend basato su Next.js App Router.
- Alcune pagine sono client component per stato locale e interazioni.
- La dashboard e' server component e aggrega dati via API.
- Il client API e' centralizzato in `frontend/src/lib/api.ts`.
- Il backend attualmente concentra gli endpoint in `backend/app/main.py`.
- Alembic e' presente tra le dipendenze, ma le tabelle vengono create direttamente con SQLAlchemy all'avvio.
- Autenticazione, permessi utente, PDF avanzati e alert automatici sono indicati come evoluzioni, ma non risultano implementati come moduli completi.
