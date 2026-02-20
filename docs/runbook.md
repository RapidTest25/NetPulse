# NetPulse — Runbook

## Development Setup

```bash
# Prerequisites: Docker, Go 1.23+, Node.js 22+
cp .env.example .env

# Start DB & Redis
docker compose up postgres redis -d

# Run migrations
./scripts/migrate.sh up

# Seed data
./scripts/seed.sh

# Start API (in one terminal)
cd apps/api && go run ./cmd/server

# Start frontend (in another terminal)
cd apps/web && npm install && npm run dev
```

## Production Deployment

```bash
# Build & push Docker images
docker compose build
docker compose push  # to registry

# Deploy
docker compose -f docker-compose.prod.yml up -d

# Run migrations
./scripts/migrate.sh up
```

## Common Operations

### Rollback migration

```bash
./scripts/migrate.sh down 1
```

### Purge all Redis cache

```bash
docker exec netpulse-redis redis-cli FLUSHDB
```

### Check API health

```bash
curl http://localhost:8080/health
```

### View audit logs

```bash
psql -U netpulse -d netpulse -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;"
```

## Troubleshooting

### API won't start

1. Check `.env` values
2. Verify Postgres is running: `docker compose ps`
3. Check logs: `docker compose logs api`

### Search not returning results

1. Verify `search_vector` is populated: `SELECT id, search_vector FROM posts LIMIT 5;`
2. Re-index: `UPDATE posts SET updated_at = NOW();` (triggers vector update)

### Redis connection failed

- API will still work (cache disabled)
- Check Redis: `docker compose logs redis`
