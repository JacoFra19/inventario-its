COMPOSE = docker compose -f infra/docker-compose.dev.yml
FRONTEND_DIR = frontend

.PHONY: help up rebuild down restart backend logs ps frontend dev

help:
	@echo "Comandi disponibili:"
	@echo "  make up        Avvia i servizi Docker in background"
	@echo "  make rebuild   Avvia e ricostruisce i servizi Docker"
	@echo "  make down      Spegne i servizi Docker"
	@echo "  make restart   Riavvia tutti i servizi Docker"
	@echo "  make backend   Riavvia solo il servizio api"
	@echo "  make logs      Mostra i log live"
	@echo "  make ps        Mostra lo stato dei servizi"
	@echo "  make frontend  Avvia Next dev"
	@echo "  make dev       Avvia Docker in background e poi Next dev"

up:
	$(COMPOSE) up -d

rebuild:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

backend:
	$(COMPOSE) restart api

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

frontend:
	cd $(FRONTEND_DIR) && npm run dev

dev:
	$(COMPOSE) up -d
	cd $(FRONTEND_DIR) && npm run dev
