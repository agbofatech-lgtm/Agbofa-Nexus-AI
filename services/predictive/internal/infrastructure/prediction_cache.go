package infrastructure

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

type cacheEntry struct {
	result    *domain.PredictionResult
	expiresAt time.Time
}

// PredictionCache provides an in-memory TTL cache for prediction results,
// supporting configurable TTLs (5m virality, 15m engagement, 60m trends)
// and invalidation on model promotion.
type PredictionCache struct {
	mu      sync.RWMutex
	enabled bool
	entries map[string]cacheEntry
}

// NewPredictionCache initializes a new authoritative PredictionCache (BATCH 3 INFRASTRUCTURE).
func NewPredictionCache(enabled bool) *PredictionCache {
	return &PredictionCache{
		enabled: enabled,
		entries: make(map[string]cacheEntry),
	}
}

func (c *PredictionCache) generateCacheKey(tenantID string, pt domain.PredictionType, features map[string]interface{}) string {
	bytes, _ := json.Marshal(features)
	hash := sha256.Sum256(bytes)
	return fmt.Sprintf("%s:%s:%s", tenantID, pt, hex.EncodeToString(hash[:]))
}

// Get retrieves a cached prediction result if enabled and not expired.
func (c *PredictionCache) Get(ctx context.Context, tenantID string, pt domain.PredictionType, features map[string]interface{}) (*domain.PredictionResult, bool) {
	if !c.enabled || tenantID == "" {
		return nil, false
	}
	key := c.generateCacheKey(tenantID, pt, features)
	c.mu.RLock()
	entry, ok := c.entries[key]
	c.mu.RUnlock()

	if !ok || time.Now().After(entry.expiresAt) {
		return nil, false
	}
	return entry.result, true
}

// Put caches a prediction result with appropriate TTL based on prediction type.
func (c *PredictionCache) Put(ctx context.Context, tenantID string, pt domain.PredictionType, features map[string]interface{}, result *domain.PredictionResult) {
	if !c.enabled || tenantID == "" || result == nil {
		return
	}
	ttl := 15 * time.Minute
	switch pt {
	case domain.PredictionTypeVirality:
		ttl = 5 * time.Minute
	case domain.PredictionTypeEngagement:
		ttl = 15 * time.Minute
	case domain.PredictionTypeTrendLifecycle:
		ttl = 60 * time.Minute
	}

	key := c.generateCacheKey(tenantID, pt, features)
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[key] = cacheEntry{
		result:    result,
		expiresAt: time.Now().Add(ttl),
	}
}

// InvalidateByPredictionType clears all cached entries for a tenant and prediction type (used on model promotion).
func (c *PredictionCache) InvalidateByPredictionType(tenantID string, pt domain.PredictionType) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	prefix := fmt.Sprintf("%s:%s:", tenantID, pt)
	count := 0
	for k := range c.entries {
		if len(k) >= len(prefix) && k[:len(prefix)] == prefix {
			delete(c.entries, k)
			count++
		}
	}
	return count
}
