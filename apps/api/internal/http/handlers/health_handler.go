package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/utils"
	"github.com/redis/go-redis/v9"
)

type HealthHandler struct {
	db  *pgxpool.Pool
	rdb *redis.Client
}

func NewHealthHandler(db *pgxpool.Pool, rdb *redis.Client) *HealthHandler {
	return &HealthHandler{db: db, rdb: rdb}
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	status := "ok"
	dbOK := true
	redisOK := true

	if err := h.db.Ping(ctx); err != nil {
		dbOK = false
		status = "degraded"
	}

	if err := h.rdb.Ping(ctx).Err(); err != nil {
		redisOK = false
		status = "degraded"
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"status":   status,
		"postgres": dbOK,
		"redis":    redisOK,
	})
}
