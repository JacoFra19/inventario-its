# Inventario ITS - Project Context

## Overview

Inventario ITS e' un gestionale inventario per ITS Turismo Puglia, progettato per supportare la gestione operativa di asset serializzati, stock consumabili, eventi e movimentazioni logistiche tra sedi, persone e attivita' esterne.

Questo documento descrive il contesto architetturale, le convenzioni di sviluppo e le regole strategiche del progetto. Il dettaglio delle funzionalita' implementate e' documentato separatamente in `FEATURES.md`.

## Stack

- Frontend: Next.js + React + Tailwind
- Backend: FastAPI + SQLAlchemy
- Database: relazionale, gestito tramite SQLAlchemy e migrazioni Alembic
- Sviluppo locale: Docker Compose per database e API
- Feedback UI: Sonner per toast notifications

## Architecture

Il progetto e' organizzato in due aree principali:

- `frontend`: applicazione Next.js con App Router, componenti UI condivisi e client API centralizzato.
- `backend`: applicazione FastAPI con modelli SQLAlchemy, endpoint REST e logica business.

Il frontend comunica con il backend tramite funzioni tipizzate in `frontend/src/lib/api.ts`. Le pagine applicative mantengono lo stato locale necessario per filtri, form, selezioni e azioni utente.

Il backend concentra attualmente modelli, endpoint e regole operative in `backend/app`, con seed iniziale di sedi/categorie.

## Database Migrations

Alembic e' configurato in `backend/alembic.ini` con script in `backend/alembic`. Le migrazioni leggono `DATABASE_URL` dall'ambiente e usano `Base.metadata` dai modelli SQLAlchemy esistenti come `target_metadata`.

La prima revisione e' una baseline dello schema attuale. E' idempotente: su database vuoto crea le tabelle correnti, su database dev gia' popolato registra la versione senza ricreare tabelle esistenti.

Comandi principali, da eseguire dalla cartella `backend` oppure nel container API:

```bash
alembic current
alembic revision --autogenerate -m "message"
alembic upgrade head
```

Durante la transizione `Base.metadata.create_all` resta temporaneamente nell'avvio FastAPI per non rompere lo sviluppo locale esistente. Le nuove modifiche di schema dovrebbero essere introdotte tramite revision Alembic; la rimozione di `create_all` va fatta solo dopo aver validato il workflow migrazioni su tutti gli ambienti.

## Frontend UI System

Il frontend utilizza un piccolo design system interno basato su componenti condivisi in `frontend/src/components`.

Principi:

- componenti riutilizzabili per header, sezioni, statistiche, bottoni, badge, dialog e tabelle;
- Tailwind come linguaggio di styling principale;
- layout operativi, compatti e leggibili;
- evitare duplicazioni di markup quando emerge un pattern stabile;
- mantenere le pagine aderenti alle logiche esistenti senza refactor visuali gratuiti.

I dettagli delle componenti disponibili sono elencati in `FEATURES.md`.

## UX Standards

- Usare Sonner per feedback utente non bloccanti.
- Evitare nuovi usi di `alert()`.
- Evitare nuovi usi di `window.confirm()`.
- Usare `ConfirmDialog` per conferme distruttive o irreversibili.
- Mantenere UI coerente, minimale e orientata al lavoro.
- Preferire stati vuoti e loading state chiari.
- Non introdurre librerie esterne se un componente interno e' sufficiente.

## Workflow Di Sviluppo

- Codex puo' eseguire modifiche, refactor e verifiche locali.
- La review manuale umana precede sempre il push.
- Il push Git resta manuale.
- Usare checkpoint Git frequenti dopo milestone funzionanti.
- Per modifiche frontend, verificare almeno TypeScript e lint mirato sui file coinvolti.
- Per modifiche backend Python, verificare sintassi o avvio dove possibile.
- Per modifiche allo schema database, creare una revisione Alembic e verificare almeno `alembic current` / `alembic upgrade head` su database dev quando possibile.
- Non cambiare API, modelli o logiche business durante refactor UI, salvo richiesta esplicita.

## Business Rules

Regole di dominio da preservare durante ogni evoluzione:

- Item serializzati e stock consumabili sono domini distinti.
- Un item non deve essere eliminabile se collegato ad asset o stockcard.
- Backend e frontend devono restare allineati sulle regole di eliminazione e protezione dati.
- Gli asset serializzati hanno uno stato operativo e una sede corrente.
- Gli eventi gestiscono materiale in uscita, rientrato o mancante.
- Lo stock non deve andare sotto zero tramite operazioni ordinarie.
- Le regole di sicurezza dati devono essere applicate backend-side anche quando il frontend le anticipa.

## Documentation Structure

- `PROJECT_CONTEXT.md`: documento architetturale e strategico. Descrive stack, convenzioni, workflow, UX standards e regole di dominio da rispettare nelle evoluzioni.
- `FEATURES.md`: inventario delle funzionalita' effettivamente implementate. Deve essere aggiornato quando vengono aggiunte, rimosse o completate feature applicative.
- `ROADMAP.md` futura: documento di pianificazione. Dovra' contenere priorita', milestone, feature candidate, rischi e decisioni aperte.

## Current Direction

Il progetto sta consolidando il frontend attorno a un design system interno e a pattern UX coerenti. Le prossime evoluzioni dovrebbero privilegiare:

- riduzione della duplicazione UI;
- mantenimento della coerenza tra frontend e backend;
- miglioramento progressivo di reporting, permessi e workflow logistici;
- documentazione aggiornata a ogni milestone significativa.
