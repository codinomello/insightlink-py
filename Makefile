#
# Makefile - InsightLink
# Atalhos para instalar dependências e rodar o backend (Flask) e o
# frontend (React/Vite) do projeto.
#
# Uso rápido:
#   make install   -> instala tudo (backend + frontend)
#   make dev       -> sobe backend e frontend juntos (Ctrl+C encerra os dois)
#   make backend   -> sobe só o Flask (http://localhost:5000)
#   make frontend  -> sobe só o Vite (http://localhost:5173)
#   make build     -> gera o build de produção do frontend
#   make clean     -> remove venv, node_modules, dist e caches
#

SHELL := /bin/bash

BACKEND_DIR := backend
FRONTEND_DIR := frontend
VENV := $(BACKEND_DIR)/.venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

.PHONY: help install install-backend install-frontend dev backend frontend build clean

help:
	@echo "Comandos disponiveis:"
	@echo "  make install    - instala dependencias do backend e do frontend"
	@echo "  make dev        - roda backend (5000) e frontend (5173) juntos"
	@echo "  make backend    - roda somente o backend Flask"
	@echo "  make frontend   - roda somente o frontend Vite"
	@echo "  make build      - gera build de producao do frontend"
	@echo "  make clean      - remove venv, node_modules, dist e caches"

## ---- Instalação ----

$(VENV)/bin/activate:
	python3 -m venv $(VENV)

install-backend: $(VENV)/bin/activate
	$(PIP) install --upgrade pip -q
	$(PIP) install -r $(BACKEND_DIR)/requirements.txt -q

install-frontend:
	cd $(FRONTEND_DIR) && npm install

install: install-backend install-frontend
	@echo "Dependencias instaladas com sucesso."

## ---- Execução ----

backend: install-backend
	cd $(BACKEND_DIR) && ../$(PYTHON) app.py

frontend: install-frontend
	cd $(FRONTEND_DIR) && npm run dev

# Sobe backend e frontend juntos no mesmo terminal.
# Ctrl+C mata os dois processos.
dev: install
	@trap 'kill 0' EXIT INT TERM; \
	( cd $(BACKEND_DIR) && ../$(VENV)/bin/python app.py ) & \
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
