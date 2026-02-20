package bootstrap

import (
	"context"
	"time"

	"github.com/rapidtest/netpulse-api/internal/config"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

// NewRedis creates a Redis client.
func NewRedis(cfg *config.Config) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:         cfg.RedisAddr(),
		Password:     cfg.RedisPassword,
		DB:           0,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     20,
		MinIdleConns: 5,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Warn().Err(err).Msg("Redis not available — cache disabled")
	} else {
		log.Info().Msg("connected to Redis")
	}

	return rdb
}
