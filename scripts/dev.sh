#!/usr/bin/env bash
set -euo pipefail

# Start development environment

echo "🚀 Starting RapidWire Development Environment..."

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is required. Install it first."
  exit 1
fi

# Copy .env if needed
if [ ! -f .env ]; then
  echo "📋 Copying .env.example → .env"
  cp .env.example .env
fi

# Start services
echo "🐳 Starting Docker services (Postgres + Redis)..."
docker compose up postgres redis -d

# Wait for Postgres
echo "⏳ Waiting for PostgreSQL..."
sleep 3

# Run migrations
echo "📦 Running migrations..."
./scripts/migrate.sh up

echo ""
echo "✅ Development environment ready!"
echo ""
echo "  Start API:  cd apps/api && go run ./cmd/server"
echo "  Start Web:  cd apps/web && npm install && npm run dev"
echo ""
echo "  API: http://localhost:8080"
echo "  Web: http://localhost:3000"
