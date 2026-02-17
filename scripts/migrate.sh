#!/usr/bin/env bash
set -euo pipefail

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-rapidwire}"
DB_NAME="${POSTGRES_DB:-rapidwire}"

export PGPASSWORD="${POSTGRES_PASSWORD:-changeme_postgres}"

MIGRATIONS_DIR="apps/api/migrations"
ACTION="${1:-up}"

if [ "$ACTION" = "up" ]; then
  echo "Running migrations..."
  for f in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
    echo "  → $(basename $f)"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$f" 2>&1 || true
  done
  echo "Migrations complete."

elif [ "$ACTION" = "down" ]; then
  COUNT="${2:-1}"
  echo "Rolling back last $COUNT migration(s)..."
  echo "⚠  Manual rollback — check migration files for DROP statements"
  echo "   TODO: Implement down migrations"

else
  echo "Usage: $0 [up|down] [count]"
  exit 1
fi
