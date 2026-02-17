package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	redisRepo "github.com/rapidtest/netpulse-api/internal/repository/redis"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// RedisRateLimit creates a rate limiting middleware using Redis sliding window.
func RedisRateLimit(limiter *redisRepo.RateLimiter, maxRequests int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := extractIP(r)
			key := fmt.Sprintf("%s:%s", ip, r.URL.Path)

			allowed, remaining, _ := limiter.Allow(r.Context(), key, maxRequests, window)

			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))

			if !allowed {
				w.Header().Set("Retry-After", fmt.Sprintf("%d", int(window.Seconds())))
				utils.JSONError(w, http.StatusTooManyRequests, "rate limit exceeded, try again later")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// extractIP tries to get the real client IP.
func extractIP(r *http.Request) string {
	// Check CF-Connecting-IP first (Cloudflare)
	if ip := r.Header.Get("CF-Connecting-IP"); ip != "" {
		return ip
	}
	// Then X-Forwarded-For
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.SplitN(xff, ",", 2)
		return strings.TrimSpace(parts[0])
	}
	// Then X-Real-IP
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	// Fallback to RemoteAddr
	parts := strings.SplitN(r.RemoteAddr, ":", 2)
	return parts[0]
}

// ExtractIP is the exported version for use in handlers.
func ExtractIP(r *http.Request) string {
	return extractIP(r)
}
