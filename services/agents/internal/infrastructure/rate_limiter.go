package infrastructure

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type PlatformRateLimiter struct {
	client     *redis.Client
	maxQuota   int
	failClosed bool
	luaScript  *redis.Script
}

func NewPlatformRateLimiter() *PlatformRateLimiter {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379/0"
	}
	opt, err := redis.ParseURL(redisURL)
	var client *redis.Client
	if err != nil {
		log.Printf("WARN [PlatformRateLimiter]: invalid REDIS_URL %s: %v", redisURL, err)
		client = redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	} else {
		client = redis.NewClient(opt)
	}

	// Lua script for atomic token bucket check-and-decrement
	// KEYS[1] = bucket key (e.g. "ratelimit:{tenant}:{platform}")
	// ARGV[1] = maxQuota (e.g. 1000)
	// ARGV[2] = windowTTL in seconds (e.g. 3600)
	scriptSource := `
	local current = redis.call("GET", KEYS[1])
	if current == false then
		redis.call("SET", KEYS[1], 1, "EX", ARGV[2])
		return 1
	else
		local val = tonumber(current)
		local maxQ = tonumber(ARGV[1])
		if val >= maxQ then
			return -1
		else
			redis.call("INCR", KEYS[1])
			return 1
		end
	end
	`

	return &PlatformRateLimiter{
		client:     client,
		maxQuota:   1000,
		failClosed: true,
		luaScript:  redis.NewScript(scriptSource),
	}
}

func (r *PlatformRateLimiter) bucketKey(tenantID string, platform domain.PlatformSource) string {
	return fmt.Sprintf("ratelimit:%s:%s", tenantID, platform)
}

func (r *PlatformRateLimiter) Allow(ctx context.Context, platform domain.PlatformSource, tenantID string) (bool, error) {
	if tenantID == "" {
		return false, domain.ErrCrossTenantViolation
	}

	reqCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	key := r.bucketKey(tenantID, platform)
	res, err := r.luaScript.Run(reqCtx, r.client, []string{key}, r.maxQuota, 3600).Int()
	if err != nil {
		log.Printf("ERROR [PlatformRateLimiter]: Redis check failed for key %s: %v", key, err)
		if r.failClosed {
			return false, fmt.Errorf("rate limiter unavailable: %w", domain.ErrServiceUnavailable)
		}
		return true, nil
	}

	if res == -1 {
		return false, domain.ErrRateLimitExceeded
	}
	return true, nil
}

func (r *PlatformRateLimiter) Remaining(ctx context.Context, platform domain.PlatformSource, tenantID string) (int, error) {
	if tenantID == "" {
		return 0, domain.ErrCrossTenantViolation
	}

	reqCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	key := r.bucketKey(tenantID, platform)
	valStr, err := r.client.Get(reqCtx, key).Result()
	if err == redis.Nil {
		return r.maxQuota, nil
	}
	if err != nil {
		log.Printf("ERROR [PlatformRateLimiter]: Redis Get failed for key %s: %v", key, err)
		if r.failClosed {
			return 0, fmt.Errorf("rate limiter unavailable: %w", domain.ErrServiceUnavailable)
		}
		return r.maxQuota, nil
	}

	used, err := strconv.Atoi(valStr)
	if err != nil {
		return r.maxQuota, nil
	}
	rem := r.maxQuota - used
	if rem < 0 {
		return 0, nil
	}
	return rem, nil
}
