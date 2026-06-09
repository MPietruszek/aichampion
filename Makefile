# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  Czat Umowy — Makefile                                                   ║
# ║  Użycie: make <komenda>                                                  ║
# ╚══════════════════════════════════════════════════════════════════════════╝

# Wczytaj .env jeśli istnieje (nie przerywa gdy brak)
-include .env
export

.DEFAULT_GOAL := help

# ──────────────────────────────────────────────────────────────────────────────
.PHONY: help
help: ## Pokaż dostępne komendy
	@echo ""
	@echo "  Czat Umowy — dostępne komendy:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ──────────────────────────────────────────────────────────────────────────────
.PHONY: sandbox
sandbox: ## Uruchom w trybie SANDBOX (mock, bez GPU) — idealne do dev/demo
	@echo "🟡  Uruchamianie trybu SANDBOX..."
	@cp .env.sandbox .env
	@docker compose up -d --build
	@echo ""
	@echo "✅  Sandbox gotowy → http://localhost:3000"
	@echo "    Konta demo:"
	@echo "      aichampion / krzysiek12"
	@echo "      admin      / krzysiek12"

# ──────────────────────────────────────────────────────────────────────────────
.PHONY: prod
prod: ## Uruchom w trybie PROD (model PLLuM 70B, wymaga 2× GPU A100 + pobranego modelu)
	@test -f .env.prod \
		|| (echo "❌  Brak .env.prod — uzupełnij HF_TOKEN i hasła, wzorując się na .env.prod" && exit 1)
	@test -n "$(shell grep -v '^#' .env.prod | grep HF_TOKEN | cut -d= -f2 | tr -d ' ')" \
		|| (echo "❌  HF_TOKEN jest pusty w .env.prod — uzupełnij go!" && exit 1)
	@test -d ./models/CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512 \
		|| (echo "❌  Model nie został pobrany. Uruchom najpierw: make download-model" && exit 1)
	@echo "🟢  Uruchamianie trybu PROD..."
	@cp .env.prod .env
	@docker compose --profile prod up -d --build
	@echo ""
	@echo "✅  Produkcja gotowa → http://localhost:3000"

# ──────────────────────────────────────────────────────────────────────────────
.PHONY: down
down: ## Zatrzymaj wszystkie serwisy (sandbox i prod)
	docker compose --profile prod down

.PHONY: restart
restart: ## Restart wszystkich serwisów bez przebudowy
	docker compose --profile prod restart

.PHONY: logs
logs: ## Pokaż logi na żywo (wszystkie serwisy)
	docker compose --profile prod logs -f

.PHONY: logs-backend
logs-backend: ## Pokaż logi tylko backendu
	docker compose logs -f backend

.PHONY: logs-vllm
logs-vllm: ## Pokaż logi vLLM (tylko prod)
	docker compose --profile prod logs -f vllm

# ──────────────────────────────────────────────────────────────────────────────
.PHONY: download-model
download-model: ## ⬇️  Pobierz model PLLuM 70B (~70 GB) — wymagany tylko w trybie prod
	@echo ""
	@echo "⬇️   Pobieranie modelu: CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512"
	@echo "    Rozmiar: ~70 GB (Q8 kwantyzacja)"
	@echo "    Cel:     ./models/CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512"
	@echo ""
	@test -n "$(HF_TOKEN)" \
		|| (echo "❌  Brak HF_TOKEN. Ustaw go w .env.prod lub: export HF_TOKEN=hf_..." && exit 1)
	@mkdir -p ./models
	@pip install -q "huggingface_hub[cli]>=0.23" 2>/dev/null || pip3 install -q "huggingface_hub[cli]>=0.23"
	huggingface-cli download CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512 \
		--local-dir ./models/CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512 \
		--token $(HF_TOKEN) \
		--resume-download
	@echo ""
	@echo "✅  Model pobrany. Możesz teraz uruchomić: make prod"

# ──────────────────────────────────────────────────────────────────────────────
.PHONY: migrate
migrate: ## Uruchom migracje Alembic (wymaga działającego postgresa)
	docker compose exec backend alembic upgrade head

.PHONY: shell-backend
shell-backend: ## Otwórz shell w kontenerze backendu
	docker compose exec backend /bin/bash

.PHONY: ps
ps: ## Pokaż status kontenerów
	docker compose --profile prod ps
