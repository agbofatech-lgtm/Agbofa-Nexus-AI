package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/jackc/pgx/v5"
)

type RateDecision struct {
	Allowed    bool
	Count      int
	Limit      int
	ResetAt    time.Time
	RetryAfter time.Duration
}

type RateLimitStore struct {
	pool *database.Pool
}

func NewRateLimitStore(pool *database.Pool) *RateLimitStore {
	return &RateLimitStore{pool: pool}
}

func (s *RateLimitStore) Healthy(ctx context.Context) error {
	if s == nil || s.pool == nil {
		return nil
	}
	return s.pool.InTx(ctx, func(tx pgx.Tx) error {
		var count int
		return tx.QueryRow(ctx, `SELECT COUNT(*) FROM request_rate_limits WHERE tenant_id IS NULL`).Scan(&count)
	})
}

func (s *RateLimitStore) Allow(ctx context.Context, tenantID, scopeKey string, limit int, window time.Duration) (RateDecision, error) {
	if s == nil || s.pool == nil || limit <= 0 || window <= 0 {
		return RateDecision{Allowed: true, Count: 0, Limit: limit}, nil
	}
	now := time.Now().UTC()
	windowStart := now.Truncate(window)
	resetAt := windowStart.Add(window)
	decision := RateDecision{Allowed: true, Limit: limit, ResetAt: resetAt}
	windowSeconds := int(window / time.Second)
	if windowSeconds <= 0 {
		windowSeconds = 60
	}

	var count int
	run := func(db DB, tenant any) error {
		return db.QueryRow(ctx, `
INSERT INTO request_rate_limits (scope_key, tenant_id, window_start, window_seconds, hit_count, updated_at)
VALUES ($1,$2,$3,$4,1,now())
ON CONFLICT (scope_key, window_start)
DO UPDATE SET
    hit_count = request_rate_limits.hit_count + 1,
    updated_at = now()
RETURNING hit_count`, scopeKey, tenant, windowStart, windowSeconds).Scan(&count)
	}

	var err error
	if tenantID != "" {
		err = s.pool.InTenantTx(ctx, tenantID, func(tx pgx.Tx) error {
			return run(tx, tenantID)
		})
	} else {
		err = s.pool.InTx(ctx, func(tx pgx.Tx) error {
			return run(tx, nil)
		})
	}
	if err != nil {
		return RateDecision{}, fmt.Errorf("rate limit store: %w", err)
	}

	decision.Count = count
	decision.Allowed = count <= limit
	if !decision.Allowed {
		decision.RetryAfter = time.Until(resetAt)
		if decision.RetryAfter < 0 {
			decision.RetryAfter = 0
		}
	}
	return decision, nil
}
