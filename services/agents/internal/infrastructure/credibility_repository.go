package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type PostgresCredibilityRepository struct {
	mu         sync.RWMutex
	dbURL      string
	db         *sql.DB
	inMemStore map[string]*domain.SourceCredibilityScore
}

func NewPostgresCredibilityRepository(dbURL string) *PostgresCredibilityRepository {
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Printf("WARN [PostgresCredibilityRepository]: invalid DATABASE_URL: %v", err)
			db = nil
		}
	}
	return &PostgresCredibilityRepository{
		dbURL:      dbURL,
		db:         db,
		inMemStore: make(map[string]*domain.SourceCredibilityScore),
	}
}

func (r *PostgresCredibilityRepository) key(tenantID, sourceID string) string {
	return fmt.Sprintf("%s:%s", tenantID, sourceID)
}

func (r *PostgresCredibilityRepository) GetCredibility(ctx context.Context, tenantID, sourceID string) (*domain.SourceCredibilityScore, error) {
	if tenantID == "" || sourceID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
		defer cancel()

		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresCredibilityRepository]: failed to set app.current_tenant: %v", errTenant)
		}

		query := `SELECT trust_score, history_rating, last_evaluated_at FROM source_credibility_scores WHERE source_id = $1 AND tenant_id = $2`
		var trustScore float64
		var historyRating string
		var lastEval time.Time
		err := r.db.QueryRowContext(reqCtx, query, sourceID, tenantID).Scan(&trustScore, &historyRating, &lastEval)
		if err == nil {
			return &domain.SourceCredibilityScore{
				SourceID:        sourceID,
				TenantID:        tenantID,
				TrustScore:      trustScore,
				HistoryRating:   historyRating,
				LastEvaluatedAt: lastEval,
			}, nil
		}
	}

	r.mu.RLock()
	cred, found := r.inMemStore[r.key(tenantID, sourceID)]
	r.mu.RUnlock()
	if found && cred != nil {
		return cred, nil
	}

	return &domain.SourceCredibilityScore{
		SourceID:        sourceID,
		TenantID:        tenantID,
		Platform:        domain.PlatformTwitter,
		TrustScore:      0.50,
		HistoryRating:   "UNKNOWN",
		LastEvaluatedAt: time.Now(),
	}, nil
}

func (r *PostgresCredibilityRepository) SaveCredibility(ctx context.Context, tenantID string, score *domain.SourceCredibilityScore) error {
	return r.UpsertCredibility(ctx, tenantID, score)
}

func (r *PostgresCredibilityRepository) UpsertCredibility(ctx context.Context, tenantID string, cred *domain.SourceCredibilityScore) error {
	if cred == nil || tenantID == "" || cred.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	r.mu.Lock()
	r.inMemStore[r.key(tenantID, cred.SourceID)] = cred
	r.mu.Unlock()

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()

		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresCredibilityRepository]: failed to set app.current_tenant: %v", errTenant)
		}

		query := `
		INSERT INTO source_credibility_scores (source_id, tenant_id, platform, trust_score, history_rating, last_evaluated_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $6)
		ON CONFLICT (source_id, tenant_id)
		DO UPDATE SET trust_score = EXCLUDED.trust_score,
		              history_rating = EXCLUDED.history_rating,
		              last_evaluated_at = EXCLUDED.last_evaluated_at
		`
		_, err := r.db.ExecContext(reqCtx, query, cred.SourceID, tenantID, string(cred.Platform), cred.TrustScore, cred.HistoryRating, time.Now())
		if err != nil {
			log.Printf("WARN [PostgresCredibilityRepository]: UpsertCredibility SQL failed: %v", err)
		}
	}
	return nil
}
