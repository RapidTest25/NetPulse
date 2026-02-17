.PHONY: help dev dev-api dev-web build up down logs migrate seed test lint clean

# ── Defaults ──────────────────────────────────────────
SHELL := /bin/bash
COMPOSE := docker compose

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ── Development ───────────────────────────────────────
dev: ## Start all services (docker compose)
	$(COMPOSE) up --build

dev-api: ## Run Go API locally (hot-reload with air)
	cd apps/api && air

dev-web: ## Run Next.js dev server
	cd apps/web && npm run dev

# ── Docker ────────────────────────────────────────────
up: ## Start containers in background
	$(COMPOSE) up -d --build

down: ## Stop containers
	$(COMPOSE) down

logs: ## Tail logs
	$(COMPOSE) logs -f

# ── Database ──────────────────────────────────────────
migrate: ## Run database migrations
	./scripts/migrate.sh up

migrate-down: ## Rollback last migration
	./scripts/migrate.sh down 1

seed: ## Seed database with sample data
	./scripts/seed.sh

# ── Testing ───────────────────────────────────────────
test: ## Run all tests
	cd apps/api && go test ./...
	cd apps/web && npm test

test-api: ## Run Go API tests
	cd apps/api && go test ./... -v

test-web: ## Run Next.js tests
	cd apps/web && npm test

# ── Lint ──────────────────────────────────────────────
lint: ## Lint all code
	cd apps/api && golangci-lint run ./...
	cd apps/web && npm run lint

# ── Cleanup ───────────────────────────────────────────
clean: ## Remove containers, volumes, build cache
	$(COMPOSE) down -v --remove-orphans
	cd apps/api && go clean -cache
	cd apps/web && rm -rf .next node_modules
