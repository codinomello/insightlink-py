#
# Makefile - InsightLink
# Atalhos para instalar dependências, subir a infra (Postgres + Redis
# via Docker) e rodar o backend (Flask) e o frontend (React/Vite).
#
# Uso rápido:
#   make install     -> instala tudo (backend + frontend)
#   make up          -> sobe Postgres + Redis via Docker (infra local)
#   make dev         -> sobe infra + backend + frontend juntos (Ctrl+C encerra tudo)
#   make backend     -> sobe só o Flask (http://localhost:5000)
#   make frontend    -> sobe só o Vite (http://localhost:5173)
#   make down        -> derruba a infra (Postgres + Redis)
#   make build       -> gera o build de produção do frontend
#   make clean       -> remove venv, node_modules, dist e caches
#
#   make docker-up      -> sobe a stack INTEIRA em containers (infra + backend + frontend)
#   make docker-down    -> derruba a stack inteira
#   make docker-build   -> builda as imagens do backend e do frontend
#   make docker-logs    -> segue os logs de todos os containers
#   make docker-clean   -> derruba a stack e apaga os volumes (zera o banco!)
#

SHELL := /bin/bash

BACKEND_DIR := backend
FRONTEND_DIR := frontend
VENV := $(BACKEND_DIR)/.venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

COMPOSE := docker compose
INFRA_SERVICES := postgres redis

.PHONY: help install install-backend install-frontend \
	up down dev backend frontend build clean \
	docker-up docker-down docker-build docker-logs docker-clean db-shell redis-cli

help:
	@echo "Comandos disponiveis:"
	@echo "  make install      - instala dependencias do backend e do frontend"
	@echo "  make up           - sobe Postgres + Redis via Docker (infra local)"
	@echo "  make down         - derruba a infra (Postgres + Redis)"
	@echo "  make dev          - sobe infra + backend (5000) + frontend (5173) juntos"
	@echo "  make backend      - roda somente o backend Flask (requer infra no ar)"
	@echo "  make frontend     - roda somente o frontend Vite"
	@echo "  make build        - gera build de producao do frontend"
	@echo "  make clean        - remove venv, node_modules, dist e caches"
	@echo ""
	@echo "  make docker-up    - sobe a stack inteira em containers (infra + backend + frontend)"
	@echo "  make docker-down  - derruba a stack inteira"
	@echo "  make docker-build - builda as imagens do backend e do frontend"
	@echo "  make docker-logs  - segue os logs de todos os containers"
	@echo "  make docker-clean - derruba a stack e apaga os volumes (zera o banco!)"
	@echo "  make db-shell     - abre um psql dentro do container do Postgres"
	@echo "  make redis-cli    - abre um redis-cli dentro do container do Redis"

## ---- Instalação (execução local, fora do Docker) ----

$(VENV)/bin/activate:
	python3 -m venv $(VENV)

install-backend: $(VENV)/bin/activate
	$(PIP) install --upgrade pip -q
	$(PIP) install -r $(BACKEND_DIR)/requirements.txt -q

install-frontend:
	cd $(FRONTEND_DIR) && npm install

install: install-backend install-frontend
	@echo "Dependencias instaladas com sucesso."

## ---- Infra local (Postgres + Redis via Docker, backend/frontend rodando fora) ----

up:
	$(COMPOSE) up -d $(INFRA_SERVICES)
	@echo "Postgres (5432) e Redis (6379) no ar."

down:
	$(COMPOSE) stop $(INFRA_SERVICES)

## ---- Execução local ----

backend: install-backend
	cd $(BACKEND_DIR) && \
		DATABASE_URL=$${DATABASE_URL:-postgresql://insightlink:insightlink@localhost:5432/insightlink} \
		REDIS_URL=$${REDIS_URL:-redis://localhost:6379/0} \
		../$(PYTHON) app.py

frontend: install-frontend
	cd $(FRONTEND_DIR) && npm run dev

# Sobe infra (Docker) + backend + frontend juntos no mesmo terminal.
# Ctrl+C mata os dois processos locais (a infra continua no Docker; use `make down` para parar).
dev: install up
	@trap 'kill 0' EXIT INT TERM; \
	( cd $(BACKEND_DIR) && \
		DATABASE_URL=$${DATABASE_URL:-postgresql://insightlink:insightlink@localhost:5432/insightlink} \
		REDIS_URL=$${REDIS_URL:-redis://localhost:6379/0} \
		../$(VENV)/bin/python app.py ) & \
	( cd $(FRONTEND_DIR) && npm run dev ) & \
	wait

## ---- Build / Limpeza ----

build: install-frontend
	cd $(FRONTEND_DIR) && npm run build
	@echo "Build gerado em $(FRONTEND_DIR)/dist"

clean:
	rm -rf $(VENV)
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/dist
	find $(BACKEND_DIR) -type d -name "__pycache__" -exec rm -rf {} +
	@echo "Ambiente limpo."

## ---- Stack completa via Docker (infra + backend + frontend) ----

docker-build:
	$(COMPOSE) build

docker-up:
	$(COMPOSE) up -d --build
	@echo "Stack no ar: frontend http://localhost:5173 | backend http://localhost:5000"

docker-down:
	$(COMPOSE) down

docker-logs:
	$(COMPOSE) logs -f

docker-clean:
	$(COMPOSE) down -v
	@echo "Containers e volumes (Postgres/Redis) removidos."

## ---- Atalhos de inspeção ----

db-shell:
	$(COMPOSE) exec postgres psql -U insightlink -d insightlink

redis-cli:
	$(COMPOSE) exec redis redis-cli