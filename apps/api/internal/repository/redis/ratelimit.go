package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// RateLimiter implements sliding window rate limiting with Redis.
type RateLimiter struct {
	rdb *redis.Client
}

func NewRateLimiter(rdb *redis.Client) *RateLimiter {
	return &RateLimiter{rdb: rdb}
}

// Allow checks if the request should be allowed under the rate limit.
// Returns (allowed, remaining, error).
func (rl *RateLimiter) Allow(ctx context.Context, key string, maxRequests int, window time.Duration) (bool, int, error) {
	now := time.Now().UnixMilli()
	windowStart := now - window.Milliseconds()
	redisKey := fmt.Sprintf("rl:%s", key)

	pipe := rl.rdb.Pipeline()

	// Remove old entries outside the window
	pipe.ZRemRangeByScore(ctx, redisKey, "-inf", fmt.Sprintf("%d", windowStart))
	// Count current entries
	countCmd := pipe.ZCard(ctx, redisKey)
	// Add current request
	pipe.ZAdd(ctx, redisKey, redis.Z{Score: float64(now), Member: now})
	// Set expiry on the key
	pipe.Expire(ctx, redisKey, window)

	_, err := pipe.Exec(ctx)
	if err != nil {
		// On Redis failure, allow the request (fail open)
		return true, maxRequests, nil
	}

	count := int(countCmd.Val())
	remaining := maxRequests - count - 1
	if remaining < 0 {
		remaining = 0
	}

	if count >= maxRequests {
		return false, 0, nil
	}
	return true, remaining, nil
}

// IsRateLimited is a simpler check that returns true if rate limited.
func (rl *RateLimiter) IsRateLimited(ctx context.Context, key string, maxRequests int, window time.Duration) bool {
	allowed, _, _ := rl.Allow(ctx, key, maxRequests, window)
	return !allowed
}
