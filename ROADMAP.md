# Inventario ITS - Roadmap

> Documento di pianificazione strategica del progetto.
>
> Questo file descrive la direzione del prodotto, le milestone di sviluppo e le priorità future.
>
> Per evitare duplicazioni:
>
> - **FEATURES.md** documenta ciò che è già implementato.
> - **PROJECT_CONTEXT.md** documenta architettura, workflow e decisioni tecniche.
> - **ROADMAP.md** descrive dove il progetto vuole arrivare.

---

# Visione del Prodotto

Inventario ITS nasce con l'obiettivo di diventare la piattaforma operativa per la gestione del patrimonio dell'ITS Academy.

L'obiettivo non è semplicemente catalogare beni e consumabili, ma offrire uno strumento che permetta di:

- conoscere in ogni momento dove si trovano gli asset;
- monitorare lo stato operativo delle sedi;
- gestire eventi, movimentazioni e assegnazioni;
- velocizzare censimento e aggiornamento tramite QR Code e import massivi;
- offrire uno storico completo delle attività;
- crescere nel tempo fino a diventare una piattaforma multiutente moderna, affidabile e scalabile.

Ogni nuova funzionalità deve contribuire a rendere il lavoro degli operatori più semplice, veloce e sicuro.

---

# Stato Attuale

La piattaforma ha superato la fase di prototipo.

Attualmente dispone di:

- backend FastAPI;
- frontend Next.js;
- database SQLite con Alembic;
- design system condiviso;
- dashboard operativa;
- gestione completa di asset, stock, eventi e assegnatari;
- strumenti di import/export;
- QR Code e scanner;
- monitoraggio delle sedi;
- Registro Attività.

Il progetto è ormai strutturato come un vero gestionale e viene sviluppato seguendo milestone incrementali con documentazione costantemente aggiornata.

---

# Milestone Completate

## Fondamenta

- [x] Backend FastAPI
- [x] Frontend Next.js
- [x] Database SQLite
- [x] Alembic
- [x] Design System condiviso
- [x] Makefile sviluppo locale

---

## Gestione Inventario

- [x] Catalogo Item
- [x] Asset serializzati
- [x] Stock consumabili
- [x] Gestione sedi
- [x] Anagrafica assegnatari

---

## Operatività

- [x] Dashboard operativa
- [x] Alert operativi
- [x] Registro Attività
- [x] Ricerca globale
- [x] QR Code
- [x] Scanner QR
- [x] Import Excel
- [x] Export Excel

---

## Monitoraggio

- [x] Panoramica sedi
- [x] Mappa interattiva della Puglia
- [x] Marker clustering
- [x] Attività recenti
- [x] Dashboard evoluta

---

# Roadmap

## Milestone Corrente — UX 2.0

- [x] Avvio App Shell gestionale globale
- [x] Sidebar desktop con gruppi di navigazione
- [x] Sidebar collassabile con persistenza locale
- [x] Drawer mobile per navigazione responsive
- [x] Route attiva evidenziata

## Milestone Corrente — UX 2.1 Workspace Pattern

- [x] Pagina Asset migrata come pagina pilota
- [x] Header operativo con azione primaria unica
- [x] Form creazione asset aperto su richiesta
- [x] Metriche asset compatte
- [x] Filtri asset in toolbar operativa
- [ ] Migrazione pagina Stock al Workspace Pattern
- [ ] Migrazione pagina Eventi al Workspace Pattern
- [ ] Migrazione pagina Assegnatari al Workspace Pattern
- [ ] Razionalizzazione successiva della dashboard
- [ ] Rifinitura progressiva dei layout pagina dentro il nuovo shell

## Versione 1.0 — Uso Operativo Reale

### Obiettivo

Portare il sistema in produzione per l'utilizzo quotidiano da parte degli operatori ITS.

### Priorità

- [ ] Autenticazione utenti
- [ ] Ruoli e permessi
- [ ] Permessi per sede
- [ ] Backup e ripristino documentati
- [ ] Deployment documentato
- [ ] Hardening del backend
- [ ] Inventario fisico tramite scanner
- [ ] Workflow completo di verifica inventario
- [ ] Report PDF operativi
- [ ] Test di regressione documentati
- [ ] Pulizia definitiva delle configurazioni di sviluppo

---

## Versione 1.5 — Esperienza Avanzata

### Obiettivo

Ridurre il numero di operazioni richieste agli utenti e migliorare la consultazione delle informazioni.

### Possibili sviluppi

- [ ] Timeline del Registro Attività
- [ ] Centro Notifiche
- [ ] Storico Import
- [ ] Dashboard personalizzabile
- [ ] Statistiche avanzate
- [ ] Heatmap delle sedi
- [ ] Evoluzione della mappa interattiva
- [ ] Filtri avanzati
- [ ] Audit avanzato
- [ ] Reportistica evoluta
- [ ] UX mobile ottimizzata

---

## Versione 2.0 — Piattaforma

### Obiettivo

Trasformare Inventario ITS in una piattaforma completa, moderna e scalabile.

### Evoluzioni possibili

- [ ] Progressive Web App (PWA)
- [ ] Modalità Offline
- [ ] Sincronizzazione differita
- [ ] Multiutente realtime
- [ ] Notifiche Push
- [ ] Analytics avanzate
- [ ] API pubbliche
- [ ] Integrazione con sistemi esterni
- [ ] Gestione documentale
- [ ] Workflow approvativi
- [ ] Integrazione calendario eventi

---

# Backlog Idee

Questa sezione raccoglie idee interessanti ma non ancora prioritarie.

Ogni nuova idea emersa durante lo sviluppo può essere aggiunta qui per essere rivalutata nelle milestone successive.

Esempi:

- Timeline verticale del Registro Attività.
- Modalità Inventario con scanner massivo.
- Firma digitale per consegne.
- Prenotazione asset.
- Dashboard live.
- Heatmap dinamica delle sedi.
- KPI storici.
- Report fotografici.
- Modalità kiosk.
- Integrazione AI per ricerca e assistenza operativa.
- Suggerimenti automatici basati sullo storico.

---

# Decisioni Aperte

Argomenti che richiederanno una scelta progettuale nelle prossime fasi.

- Quando introdurre l'autenticazione.
- Gestione ruoli globali o per sede.
- Strategia backup.
- Deployment definitivo.
- Evoluzione PWA.
- Coordinate sedi statiche o archiviate nel database.
- Evoluzione dell'audit log.
- Priorità PDF rispetto alla stampa browser.
- Workflow definitivo dell'inventario fisico.
- Gestione dello storico a lungo termine.

---

# Principi del Progetto

Durante lo sviluppo vengono seguite le seguenti regole.

## Documentazione

- Aggiornare **FEATURES.md** quando una funzionalità viene implementata.
- Aggiornare **PROJECT_CONTEXT.md** solo quando cambiano architettura, workflow o regole di dominio.
- Aggiornare **ROADMAP.md** solo quando cambiano priorità, milestone o visione del prodotto.

---

## Workflow di sviluppo

Ogni milestone segue il seguente processo:

1. Analisi e progettazione.
2. Implementazione.
3. Verifica funzionale.
4. Aggiornamento documentazione.
5. Checkpoint Git:
   - `git add`
   - `git commit`
   - `git push`

---

## Filosofia

Ogni nuova funzionalità deve:

- integrarsi con il design system esistente;
- evitare duplicazione di logica;
- essere documentata;
- mantenere coerenza architetturale;
- migliorare concretamente l'esperienza dell'utente.

L'obiettivo è costruire un gestionale solido, elegante e facilmente estendibile nel tempo, privilegiando qualità, manutenibilità e semplicità d'uso rispetto alla sola quantità di funzionalità.
