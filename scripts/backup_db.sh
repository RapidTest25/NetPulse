#!/usr/bin/env bash
set -euo pipefail

# Database backup script

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-rapidwire}"
DB_NAME="${POSTGRES_DB:-rapidwire}"

export PGPASSWORD="${POSTGRES_PASSWORD:-changeme_postgres}"

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/rapidwire_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Backing up database to ${FILENAME}..."

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$FILENAME"

echo "Backup complete: ${FILENAME} ($(du -sh "$FILENAME" | cut -f1))"

# Keep only last 10 backups
ls -t "$BACKUP_DIR"/rapidwire_*.sql.gz | tail -n +11 | xargs rm -f 2>/dev/null || true
echo "Old backups cleaned up (keeping last 10)."
