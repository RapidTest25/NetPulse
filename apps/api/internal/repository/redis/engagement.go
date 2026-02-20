package redis

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// EngagementCache handles view deduplication and like caching.
type EngagementCache struct {
	rdb *redis.Client
}

func NewEngagementCache(rdb *redis.Client) *EngagementCache {
	return &EngagementCache{rdb: rdb}
}

// hashFingerprint creates a hash from IP + user agent for deduplication.
func hashFingerprint(ip, ua string) string {
	h := sha256.Sum256([]byte(ip + "|" + ua))
	return hex.EncodeToString(h[:8]) // short hash
}

// IsViewDuplicate checks if this view is a duplicate (within TTL).
// Returns true if already viewed (duplicate).
func (c *EngagementCache) IsViewDuplicate(ctx context.Context, postID, ip, ua string) (bool, error) {
	fp := hashFingerprint(ip, ua)
	key := fmt.Sprintf("view:%s:%s", postID, fp)

	exists, err := c.rdb.Exists(ctx, key).Result()
	if err != nil {
		// On Redis failure, treat as not duplicate (fail open, accept the view)
		return false, nil
	}

	if exists > 0 {
		return true, nil
	}

	// Set the key with 30-minute TTL
	c.rdb.Set(ctx, key, "1", 30*time.Minute)
	return false, nil
}

// IsLikeDuplicate checks if a guest has already liked (via Redis TTL).
func (c *EngagementCache) IsLikeDuplicate(ctx context.Context, postID, guestKey string) (bool, error) {
	key := fmt.Sprintf("like:%s:%s", postID, guestKey)
	exists, err := c.rdb.Exists(ctx, key).Result()
	if err != nil {
		return false, nil
	}
	return exists > 0, nil
}

// SetGuestLike marks a guest like in Redis.
func (c *EngagementCache) SetGuestLike(ctx context.Context, postID, guestKey string) error {
	key := fmt.Sprintf("like:%s:%s", postID, guestKey)
	return c.rdb.Set(ctx, key, "1", 24*time.Hour).Err()
}

// RemoveGuestLike removes a guest like from Redis.
func (c *EngagementCache) RemoveGuestLike(ctx context.Context, postID, guestKey string) error {
	key := fmt.Sprintf("like:%s:%s", postID, guestKey)
	return c.rdb.Del(ctx, key).Err()
}

// CheckReferralIPLimit checks referral abuse via Redis.
func (c *EngagementCache) CheckReferralIPLimit(ctx context.Context, ip string, maxPerDay int) (bool, error) {
	key := fmt.Sprintf("ref_ip:%s", ip)
	count, err := c.rdb.Incr(ctx, key).Result()
	if err != nil {
		return false, nil
	}
	if count == 1 {
		c.rdb.Expire(ctx, key, 24*time.Hour)
	}
	return count > int64(maxPerDay), nil
}
