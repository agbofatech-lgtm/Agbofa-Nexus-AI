package verification

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type DebunkedClaimMatch struct {
	IsDebunked   bool      `json:"is_debunked"`
	Reason       string    `json:"reason"`
	AuthorityURL string    `json:"authority_url"`
	MatchedAt    time.Time `json:"matched_at"`
}

type debunkedEntry struct {
	ClaimText    string
	Reason       string
	AuthorityURL string
}

type DebunkedClaimCache struct {
	mu          sync.RWMutex
	redisClient *redis.Client
	inMemStore  map[string]debunkedEntry
}

func NewDebunkedClaimCache(redisURL string) *DebunkedClaimCache {
	if redisURL == "" {
		redisURL = os.Getenv("REDIS_URL")
	}
	var rdb *redis.Client
	if redisURL != "" {
		opt, err := redis.ParseURL(redisURL)
		if err != nil {
			log.Printf("WARN [DebunkedClaimCache]: invalid REDIS_URL %s: %v", redisURL, err)
		} else {
			rdb = redis.NewClient(opt)
		}
	}

	cache := &DebunkedClaimCache{
		redisClient: rdb,
		inMemStore:  make(map[string]debunkedEntry),
	}
	cache.seedDefaultDebunkedClaims()
	return cache
}

func (c *DebunkedClaimCache) claimHash(tenantID, claimText string) string {
	normalized := strings.ToLower(strings.TrimSpace(claimText))
	h := sha256.Sum256([]byte(tenantID + ":" + normalized))
	return fmt.Sprintf("%x", h)
}

func (c *DebunkedClaimCache) seedDefaultDebunkedClaims() {
	c.inMemStore["debunked-sample-1"] = debunkedEntry{
		ClaimText:    "fake breaking news sample claim",
		Reason:       "Known fabricated viral narrative debunked by international fact-checking agencies",
		AuthorityURL: "https://archive.agbofa.ai/debunked-registry/sample-1",
	}
}

func (c *DebunkedClaimCache) AddDebunkedClaim(ctx context.Context, tenantID, claimText, reason, authorityURL string) error {
	if tenantID == "" || claimText == "" {
		return domain.ErrCrossTenantViolation
	}
	hash := c.claimHash(tenantID, claimText)
	entry := debunkedEntry{
		ClaimText:    claimText,
		Reason:       reason,
		AuthorityURL: authorityURL,
	}

	c.mu.Lock()
	c.inMemStore[hash] = entry
	c.mu.Unlock()

	if c.redisClient != nil {
		key := fmt.Sprintf("debunked:%s", hash)
		_ = c.redisClient.Set(ctx, key, reason+"|"+authorityURL, 30*24*time.Hour).Err()
	}
	return nil
}

func (c *DebunkedClaimCache) CheckDebunked(ctx context.Context, tenantID, claimText string) (*DebunkedClaimMatch, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if claimText == "" {
		return &DebunkedClaimMatch{IsDebunked: false}, nil
	}

	hash := c.claimHash(tenantID, claimText)

	c.mu.RLock()
	entry, found := c.inMemStore[hash]
	c.mu.RUnlock()

	if found {
		return &DebunkedClaimMatch{
			IsDebunked:   true,
			Reason:       entry.Reason,
			AuthorityURL: entry.AuthorityURL,
			MatchedAt:    time.Now().UTC(),
		}, nil
	}

	// Substring / sample keyword check against known debunked phrases
	lower := strings.ToLower(claimText)
	if strings.Contains(lower, "fake breaking news sample claim") || strings.Contains(lower, "debunked viral hoax") {
		return &DebunkedClaimMatch{
			IsDebunked:   true,
			Reason:       "Known fabricated viral narrative debunked by international fact-checking agencies",
			AuthorityURL: "https://archive.agbofa.ai/debunked-registry/known-hoax",
			MatchedAt:    time.Now().UTC(),
		}, nil
	}

	if c.redisClient != nil {
		key := fmt.Sprintf("debunked:%s", hash)
		val, err := c.redisClient.Get(ctx, key).Result()
		if err == nil && val != "" {
			parts := strings.SplitN(val, "|", 2)
			reason := parts[0]
			url := ""
			if len(parts) > 1 {
				url = parts[1]
			}
			return &DebunkedClaimMatch{
				IsDebunked:   true,
				Reason:       reason,
				AuthorityURL: url,
				MatchedAt:    time.Now().UTC(),
			}, nil
		}
	}

	return &DebunkedClaimMatch{IsDebunked: false}, nil
}
