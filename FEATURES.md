# Inventario ITS - Implemented Features

## Core

Inventario ITS e' una webapp gestionale per inventario fisico e logistico. Le funzionalita' principali attualmente implementate coprono:

- catalogo item e categorie;
- anagrafica assegnatari per persone, reparti e riferimenti operativi;
- asset serializzati con codici inventariali univoci;
- stock e consumabili non serializzati;
- import Excel per popolamento iniziale inventario;
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
- eventi aperti;
- ricerca globale su asset, item, stock ed eventi;
- panoramica operativa sedi aggregata dal backend;
- alert operativi aggregati dal backend;
- attività recenti aggregate dal backend.

Sono presenti card di navigazione verso:

- Asset;
- Item;
- Assegnatari;
- Import Excel;
- Scanner QR;
- Stock e consumabili;
- Eventi e fiere;
- Stampa QR.

La dashboard mostra anche gli eventi recenti con indicatori su:

- asset ancora fuori;
- stock da rientrare;
- asset mancanti;
- stato evento.

La dashboard include anche la sezione "Alert Operativi", con:

- visualizzazione separata per severita' `critical` e `warning`;
- badge di severita';
- empty state quando non sono presenti alert;
- link rapidi verso asset, eventi o stock quando disponibili.

La dashboard include inoltre la sezione "Attività recenti", con:

- lista delle ultime operazioni ordinate per data decrescente;
- massimo 20 attività nella prima versione;
- visualizzazione compatta iniziale delle ultime 3 attività;
- espansione con pulsante "Mostra tutte" / "Mostra meno";
- badge/categoria per asset, stock, eventi, import e assegnazioni;
- data e ora leggibili;
- empty state quando non sono presenti attività;
- attività cliccabili quando il backend fornisce un riferimento utile;
- link "Visualizza tutto" verso il Registro Attività.

La dashboard include una prima versione di "Ricerca globale", con:

- ricerca trasversale su asset, item, stockcard ed eventi;
- attivazione dopo almeno 2 caratteri;
- debounce client semplice;
- risultati raggruppati per Asset, Item, Stock ed Eventi;
- massimo 5 risultati per categoria;
- stati loading, empty state ed errore;
- risultati cliccabili verso le pagine frontend utili.

La dashboard include la sezione "Panoramica Sedi", con:

- card compatte per ogni sede ITS;
- metriche asset totali, assegnati, in evento e mancanti;
- quantità stock disponibile;
- stock sotto soglia;
- conteggio eventi aperti collegati alla sede quando ricavabile dal testo luogo evento;
- livello sintetico criticità `none`, `warning` o `critical`;
- link rapidi verso asset filtrati per sede, stock filtrati per sede ed eventi;
- visualizzazione iniziale compatta con espansione se le sedi sono molte.

La dashboard include inoltre la sezione "Mappa Sedi", con:

- mappa OpenStreetMap centrata sulla Puglia;
- marker per ogni sede con coordinate disponibili;
- clustering/spiderfy dei marker vicini o sovrapposti, utile per sedi nella stessa citta';
- marker colorati per livello criticità;
- tooltip con codice e nome sede;
- popup con riepilogo asset, stock, mancanti, sotto soglia ed eventi aperti;
- link rapidi da popup verso asset, stock ed eventi;
- caricamento client-only per evitare problemi SSR/hydration.

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
- esportazione Excel completa degli asset;
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
- assegnazione ad assegnatario strutturato tramite `assignee_id`;
- compatibilita' con vecchie assegnazioni testuali `assigned_to`;
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
- `GET /exports/assets.xlsx`

## Assegnatari

La pagina assegnatari (`frontend/src/app/assignees/page.tsx`) introduce una prima anagrafica strutturata per persone, reparti e altri riferimenti a cui assegnare asset.

Funzionalita' presenti:

- lista assegnatari con tabella globale `DataTable`;
- ricerca testuale per nome, tipo, email, telefono e note;
- creazione assegnatario;
- modifica assegnatario;
- badge tipo assegnatario;
- stato attivo/disattivato;
- conteggio asset assegnati;
- dettaglio espandibile con asset attualmente assegnati;
- eliminazione definitiva solo se non ci sono asset collegati;
- disattivazione automatica se l'assegnatario ha asset collegati;
- toast Sonner per feedback operativi;
- conferma con `ConfirmDialog` per eliminazione/disattivazione.

Tipi assegnatario:

- `PERSON`;
- `DEPARTMENT`;
- `OTHER`.

Endpoint backend principali:

- `GET /assignees`
- `GET /assignees/{assignee_id}`
- `POST /assignees`
- `PUT /assignees/{assignee_id}`
- `DELETE /assignees/{assignee_id}`

Integrazione asset:

- tabella `assignees`;
- colonna nullable `assets.assignee_id`;
- relazione asset -> assignee;
- `assigned_to` testuale resta disponibile per compatibilita' legacy;
- l'assegnazione strutturata sincronizza `assigned_to` con il nome dell'assegnatario.

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
- esportazione Excel completa di stockcard e movimenti stock;
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
- `GET /exports/stocks.xlsx`

## Import Excel

Import Excel v1 permette di popolare rapidamente inventario iniziale, dati realistici di test e carichi stock da file `.xlsx`.

Backend:

- endpoint `GET /imports/template.xlsx` per scaricare un template Excel;
- endpoint `POST /imports/preview` per validare un file senza scrivere dati;
- endpoint `POST /imports/commit` per confermare l'import dopo preview valida;
- lettura del foglio principale `Import`;
- limite iniziale di 1000 righe importabili;
- parsing tramite `openpyxl`;
- upload file tramite `python-multipart`.

Colonne template:

- `tipo`: `ASSET` o `STOCK`;
- `sede`: codice sede esistente;
- `categoria`: categoria da riusare o creare;
- `nome`: nome item da riusare o creare;
- `marca`;
- `modello`;
- `serializzato`: `SI` per asset, `NO` per stock;
- `quantita`;
- `soglia_minima`: usata per stock;
- `note`;
- `assegnatario`: usato per asset.

Regole import:

- la preview non scrive dati;
- il commit non parte se ci sono errori bloccanti;
- sedi non valide e righe incomplete bloccano l'import;
- categorie e item coerenti vengono riusati o creati;
- per `ASSET` vengono creati N asset usando il generatore codice inventariale esistente;
- per `STOCK` viene creata o aggiornata la stockcard per coppia item/sede;
- il carico stock viene registrato come movimento `LOAD`;
- assegnatari valorizzati su righe asset vengono riusati o creati come `PERSON`;
- assegnatari su righe stock vengono ignorati con warning;
- nessuna operazione distruttiva viene eseguita.

Frontend:

- pagina `/imports`;
- download template Excel;
- upload file `.xlsx`;
- preview riga per riga con `DataTable`;
- riepilogo numerico di righe valide, warning, errori, asset, item, stockcard e assegnatari;
- pulsante `Conferma import` abilitato solo senza errori;
- conferma tramite `ConfirmDialog`;
- feedback Sonner per preview e commit.

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
- esportazione Excel completa di eventi, asset evento e stock evento;
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
- `GET /exports/events.xlsx`

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

## Alert Operativi

Il sistema Alert Operativi e' implementato in prima fase con aggregazione backend e visualizzazione nella dashboard.

Backend:

- endpoint `GET /alerts`;
- risposta separata in `critical` e `warning`;
- ogni alert include `type`, `message` e `references`;
- riferimenti utili con id, codici e link rapidi quando disponibili.

Alert attualmente implementati:

- asset in stato `MANCANTE` (`critical`);
- eventi `OPEN` con asset ancora fuori (`critical`);
- stock sotto soglia minima (`warning`);
- eventi aperti da oltre 7 giorni (`warning`).

Frontend:

- sezione "Alert Operativi" nella dashboard;
- card rosse per alert `critical`;
- card arancioni per alert `warning`;
- badge severita' coerenti con il design system;
- empty state positivo se non ci sono alert;
- link rapidi verso asset, eventi o stock tramite riferimenti backend.

## Attività Recenti

Il sistema Attività Recenti e' implementato come aggregazione backend dei dati operativi gia' presenti.

Backend:

- endpoint `GET /dashboard/activity`;
- logica condivisa con il Registro Attività completo;
- lista ordinata per data decrescente;
- limite iniziale a 20 attività;
- ogni attività include `id`, `type`, `title`, `description`, `timestamp`, `category`, `severity`, `references` e `href`.

Dati aggregati:

- `AssetLog` per creazione asset, assegnazioni, mancanze, ripristini e log operativi asset;
- `AssetMovement` per trasferimenti asset;
- `StockMovement` per carichi, scarichi, rientri e correzioni stock;
- `EventAsset` per asset aggiunti, rientrati o mancanti in evento;
- `EventStock` per stock usciti per evento;
- `Event` per eventi creati.

Frontend:

- sezione "Attività recenti" nella dashboard;
- visualizzazione iniziale compatta limitata alle ultime 3 attività;
- pulsante espandibile "Mostra tutte" / "Mostra meno" quando sono presenti piu' di 3 attività;
- link "Visualizza tutto" verso `/activity`;
- layout responsive coerente con il design system;
- icone categoria per distinguere asset, stock, eventi, import, assegnazioni e trasferimenti;
- timestamp formattato in italiano;
- link verso asset, eventi o stock quando disponibili;
- empty state se non sono presenti attività.

## Registro Attività

Il Registro Attività v1 estende le attività recenti in una pagina dedicata per consultare lo storico operativo.

Backend:

- endpoint `GET /activity`;
- riuso della stessa aggregazione interna usata da `GET /dashboard/activity`;
- parametri query supportati:
  - `q` per ricerca testuale;
  - `category` per filtrare per categoria;
  - `severity` per filtrare per severita';
  - `limit` con default 50 e massimo 100;
  - `offset` con default 0;
- risposta paginata con `items`, `total`, `limit`, `offset` e `has_more`;
- id sintetico stabile per ogni attività;
- categorie operative `asset`, `stock`, `event`, `import`, `assignee`, `transfer` e `system`;
- severita' `info`, `success`, `warning` e `critical`;
- la severita' indica il livello di attenzione richiesto, non il tipo di operazione:
  - `success` per operazioni completate correttamente;
  - `warning` per situazioni che richiedono verifica;
  - `critical` per mancanze, errori o interventi immediati;
- `href` e `references` per collegamenti rapidi quando disponibili.

Frontend:

- pagina `/activity` con titolo "Registro Attività";
- link dalla sezione "Attività recenti" della dashboard;
- ricerca testuale con debounce leggero;
- filtri categoria e severita';
- lista ordinata per data decrescente;
- raggruppamento semplice per giorno;
- pulsante "Carica altro" basato su `offset` e `has_more`;
- icone SVG categoria con ingombro uniforme;
- loading, empty ed error state;
- attività cliccabili quando `href` e' disponibile;
- layout responsive coerente con il design system.

## Ricerca Globale

La prima versione della Ricerca Globale permette di cercare rapidamente dati operativi trasversali dalla dashboard.

Backend:

- endpoint `GET /search?q=...`;
- risposta raggruppata in `assets`, `items`, `stocks` ed `events`;
- ogni risultato include `type`, `title`, `description`, `href` e `metadata`;
- limite iniziale di 5 risultati per categoria;
- query sotto 2 caratteri restituiscono gruppi vuoti.

Campi cercati:

- asset: codice inventariale, note, stato, assegnatario e item collegato;
- item: nome, categoria, marca e modello;
- stockcard: item collegato, sede, categoria e note;
- eventi: nome, note, luogo/sede, referente e stato.

Frontend:

- sezione "Ricerca globale" nella dashboard;
- chiamata API solo dopo almeno 2 caratteri;
- debounce client di base;
- risultati raggruppati per Asset, Item, Stock ed Eventi;
- gestione di stato neutro, loading, empty state ed errore;
- link diretti verso dettaglio asset, catalogo item, stock ed evento selezionato.

## Panoramica Sedi

La Panoramica Sedi e' una prima mini mappa operativa delle sedi ITS nella dashboard.

Backend:

- endpoint `GET /dashboard/locations`;
- aggregazione stabile ordinata per nome sede;
- conteggio asset totali per sede;
- conteggio asset `IN_SEDE`, `ASSEGNATO`, `IN_EVENTO`, `MANCANTE`;
- conteggio stockcard per sede;
- somma quantità stock disponibile;
- conteggio stock sotto soglia;
- conteggio eventi aperti collegati alla sede quando `event.location` contiene codice o nome sede;
- livello criticità sintetico `none`, `warning` o `critical`.

Frontend:

- sezione "Panoramica Sedi" nella dashboard;
- card responsive e compatte per ogni sede;
- badge criticità per sedi con asset mancanti, stock sotto soglia o eventi aperti collegati;
- link rapidi a `/assets?locationId=...`, `/stocks?locationId=...` ed eventi;
- supporto ai filtri `locationId` nelle pagine asset e stock;
- sezione espandibile quando le sedi superano la visualizzazione compatta iniziale.

## Mappa Sedi Puglia

La Mappa Sedi Puglia evolve la panoramica sedi in una visualizzazione geografica interattiva.

Backend:

- riusa `GET /dashboard/locations`;
- aggiunge coordinate statiche approssimative `lat`/`lng` per le sedi ITS note;
- non modifica schema database;
- mantiene le metriche operative gia' presenti nella panoramica sedi.

Frontend:

- sezione "Mappa Sedi" nella dashboard;
- implementazione con `leaflet` e `react-leaflet`;
- CSS Leaflet importato globalmente in `frontend/src/app/layout.tsx`;
- componente mappa caricato solo lato client tramite dynamic import;
- mappa centrata sulla Puglia;
- marker circolari colorati per `none`, `warning`, `critical`;
- cluster interattivi con conteggio e separazione/spiderfy dei marker sovrapposti o molto vicini;
- popup con nome sede, codice sede, asset totali, stock disponibile, asset mancanti, stock sotto soglia, eventi aperti e criticita';
- link rapidi a `/assets?locationId=...`, `/stocks?locationId=...` ed eventi.

Dipendenze frontend:

- `leaflet`;
- `leaflet.markercluster`;
- `react-leaflet`;
- `@types/leaflet`;
- `@types/leaflet.markercluster`.

## Export Excel

Il primo sistema export Excel e' implementato per esportazioni complete, senza filtri avanzati.

Backend:

- generazione file `.xlsx` tramite endpoint dedicati;
- risposta come download file;
- formattazione base dei fogli con intestazioni, freeze pane, autofilter e larghezze colonne.

Endpoint disponibili:

- `GET /exports/assets.xlsx`;
- `GET /exports/stocks.xlsx`;
- `GET /exports/events.xlsx`.

Contenuto export:

- asset: fogli `Asset`, `Movimenti asset`, `Log asset`;
- stock: fogli `Stockcard`, `Movimenti stock`;
- eventi: fogli `Eventi`, `Asset eventi`, `Stock eventi`.

Frontend:

- pulsante `Esporta Excel` nella pagina asset;
- pulsante `Esporta Excel` nella pagina stock;
- pulsante `Esporta Excel` nella pagina eventi;
- comportamento di download diretto tramite URL backend.

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
- endpoint alert operativi `GET /alerts`;
- endpoint attività recenti `GET /dashboard/activity`;
- endpoint registro attività `GET /activity`;
- endpoint panoramica sedi `GET /dashboard/locations`;
- endpoint export Excel `GET /exports/assets.xlsx`, `GET /exports/stocks.xlsx`, `GET /exports/events.xlsx`;
- endpoint import Excel `GET /imports/template.xlsx`, `POST /imports/preview`, `POST /imports/commit`;
- endpoint ricerca globale `GET /search?q=...`;
- endpoint assegnatari `GET /assignees`, `GET /assignees/{assignee_id}`, `POST /assignees`, `PUT /assignees/{assignee_id}`, `DELETE /assignees/{assignee_id}`;
- ricerca asset base con `GET /assets-search`.

Modelli principali:

- `Location`;
- `LocationCounter`;
- `Category`;
- `Item`;
- `Assignee`;
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
- migrazioni database gestite con Alembic in `backend/alembic`;
- baseline Alembic dello schema attuale;
- migration Alembic `20260529_0002_add_assignees` per tabella assegnatari e `assets.assignee_id`;
- Docker Compose di sviluppo con Postgres 16 e API Python.

## Regole Di Business

Regole implementate nel codice:

- un item serializzato puo' generare asset fisici;
- un item non serializzato puo' generare stockcard;
- asset e stock sono domini separati;
- assegnatari strutturati collegano asset tramite `assignee_id`;
- assegnatari con asset collegati vengono disattivati invece di essere eliminati definitivamente;
- import Excel non distruttivo: preview obbligatoria lato UI e commit bloccato in presenza di errori;
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
