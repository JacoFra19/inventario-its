# Inventario ITS - Project Context

## Overview

Inventario ITS e' un gestionale inventario per ITS Turismo Puglia, pensato per amministrare asset serializzati, stock consumabili, eventi e movimentazioni logistiche tra sedi, persone e attivita' esterne.

## Stack

- Frontend: Next.js + React + Tailwind
- Backend: FastAPI + SQLAlchemy
- Database relazionale
- Docker per sviluppo locale

## Frontend UI System

Componenti globali gia' creati:

- PageHeader
- StatCard
- SectionCard
- PrimaryButton
- SecondaryButton
- DangerButton
- StatusBadge
- ConfirmDialog

## UX Standards

- Sonner configurato globalmente per toast notifications
- Eliminazione progressiva di `alert()`
- Eliminazione progressiva di `window.confirm()`
- UI coerente e minimal
- Palette neutra moderna

## Refactor Completati

Pagine gia' migrate al nuovo design system:

- dashboard
- items
- assets
- stocks
- events

## Workflow Di Sviluppo

- Codex esegue modifiche e refactor
- Review manuale umana prima del push
- Push Git manuale
- Checkpoint Git frequenti dopo milestone funzionanti

## Business Rules

- Item non eliminabile se collegato ad asset o stockcard
- Backend e frontend devono restare allineati sulle regole di eliminazione
- Asset serializzati separati dagli stock consumabili
- Eventi gestiscono materiale OUT / RETURNED / MISSING

## Stato Attuale Progetto

- Design system frontend stabile
- Toast system globale completato
- ConfirmDialog globale introdotto
- Refactor UI principale completato

## Prossimi Step Candidati

- Migrazione completa dei confirm dialog
- Table component globale
- Sistema permessi/login
- Report PDF evento
- QR code system avanzato
- Alert incongruenze e ritardi
