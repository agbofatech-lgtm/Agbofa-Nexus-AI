package infrastructure

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type PostgresPersonalizationRepository struct {
	mu       sync.RWMutex
	dbURL    string
	db       *sql.DB
	profiles map[string]*domain.ReaderProfile
	signals  []*domain.BehavioralSignal
	feeds    map[string]*domain.PersonalizedFeed
}

func NewPostgresPersonalizationRepository(dbURL string) *PostgresPersonalizationRepository {
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Printf("WARN [PostgresPersonalizationRepository]: invalid DATABASE_URL: %v", err)
			db = nil
		}
	}
	return &PostgresPersonalizationRepository{
		dbURL:    dbURL,
		db:       db,
		profiles: make(map[string]*domain.ReaderProfile),
		signals:  make([]*domain.BehavioralSignal, 0),
		feeds:    make(map[string]*domain.PersonalizedFeed),
	}
}

func (r *PostgresPersonalizationRepository) key(tenantID, id string) string {
	return fmt.Sprintf("%s:%s", tenantID, id)
}

func (r *PostgresPersonalizationRepository) SaveReaderProfile(
	ctx context.Context,
	tenantID string,
	profile *domain.ReaderProfile,
) error {
	if profile == nil || tenantID == "" || profile.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	r.mu.Lock()
	r.profiles[r.key(tenantID, profile.ReaderID)] = profile
	r.mu.Unlock()

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPersonalizationRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		prefBytes, _ := json.Marshal(profile.Preferences)
		vecBytes, _ := json.Marshal(profile.InterestVector)

		query := `
		INSERT INTO reader_profiles (reader_id, tenant_id, preferences, interest_vector, last_active_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $5, $5)
		ON CONFLICT (reader_id, tenant_id)
		DO UPDATE SET preferences = $3, interest_vector = $4, last_active_at = $5, updated_at = $5
		`
		_, err := r.db.ExecContext(reqCtx, query, profile.ReaderID, tenantID, prefBytes, vecBytes, profile.LastActiveAt)
		if err != nil {
			log.Printf("WARN [PostgresPersonalizationRepository]: SaveReaderProfile SQL failed: %v", err)
		}
	}
	return nil
}

func (r *PostgresPersonalizationRepository) GetReaderProfile(
	ctx context.Context,
	tenantID, readerID string,
) (*domain.ReaderProfile, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	prof, found := r.profiles[r.key(tenantID, readerID)]
	r.mu.RUnlock()
	if found && prof != nil {
		return prof, nil
	}

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPersonalizationRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		query := `
		SELECT preferences, interest_vector, last_active_at
		FROM reader_profiles
		WHERE reader_id = $1 AND tenant_id = $2
		`
		var prefBytes, vecBytes []byte
		var lastActive time.Time
		err := r.db.QueryRowContext(reqCtx, query, readerID, tenantID).Scan(&prefBytes, &vecBytes, &lastActive)
		if err == nil {
			p := &domain.ReaderProfile{
				ReaderID:     readerID,
				TenantID:     tenantID,
				LastActiveAt: lastActive,
			}
			_ = json.Unmarshal(prefBytes, &p.Preferences)
			_ = json.Unmarshal(vecBytes, &p.InterestVector)
			r.mu.Lock()
			r.profiles[r.key(tenantID, readerID)] = p
			r.mu.Unlock()
			return p, nil
		}
	}

	return nil, fmt.Errorf("reader profile not found for reader %s on tenant %s", readerID, tenantID)
}

func (r *PostgresPersonalizationRepository) RecordBehavioralSignal(
	ctx context.Context,
	tenantID string,
	signal *domain.BehavioralSignal,
) error {
	if signal == nil || tenantID == "" || signal.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	r.mu.Lock()
	r.signals = append(r.signals, signal)
	r.mu.Unlock()

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPersonalizationRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		query := `
		INSERT INTO behavioral_signals (signal_id, tenant_id, reader_id, content_id, interaction_type, duration_ms, weight, metadata, occurred_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, '{}'::jsonb, $8, $8)
		ON CONFLICT (signal_id, tenant_id) DO NOTHING
		`
		_, err := r.db.ExecContext(reqCtx, query, signal.SignalID, tenantID, signal.ReaderID, signal.ContentID, signal.InteractionType, signal.DurationMs, signal.Weight, signal.OccurredAt)
		if err != nil {
			log.Printf("WARN [PostgresPersonalizationRepository]: RecordBehavioralSignal SQL failed: %v", err)
		}
	}
	return nil
}

func (r *PostgresPersonalizationRepository) SavePersonalizedFeed(
	ctx context.Context,
	tenantID string,
	feed *domain.PersonalizedFeed,
) error {
	if feed == nil || tenantID == "" || feed.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	r.mu.Lock()
	r.feeds[r.key(tenantID, feed.ReaderID)] = feed
	r.mu.Unlock()

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPersonalizationRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		itemsBytes, _ := json.Marshal(feed.Items)
		query := `
		INSERT INTO personalized_feeds (feed_id, tenant_id, reader_id, items, generated_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $5)
		ON CONFLICT (feed_id, tenant_id)
		DO UPDATE SET items = $4, generated_at = $5
		`
		_, err := r.db.ExecContext(reqCtx, query, feed.FeedID, tenantID, feed.ReaderID, itemsBytes, feed.GeneratedAt)
		if err != nil {
			log.Printf("WARN [PostgresPersonalizationRepository]: SavePersonalizedFeed SQL failed: %v", err)
		}
	}
	return nil
}

func (r *PostgresPersonalizationRepository) GetPersonalizedFeed(
	ctx context.Context,
	tenantID, readerID string,
) (*domain.PersonalizedFeed, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	feed, found := r.feeds[r.key(tenantID, readerID)]
	r.mu.RUnlock()
	if found && feed != nil {
		return feed, nil
	}

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPersonalizationRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		query := `
		SELECT feed_id, items, generated_at
		FROM personalized_feeds
		WHERE reader_id = $1 AND tenant_id = $2
		`
		var feedID string
		var itemsBytes []byte
		var genAt time.Time
		err := r.db.QueryRowContext(reqCtx, query, readerID, tenantID).Scan(&feedID, &itemsBytes, &genAt)
		if err == nil {
			f := &domain.PersonalizedFeed{
				FeedID:      feedID,
				TenantID:    tenantID,
				ReaderID:    readerID,
				GeneratedAt: genAt,
			}
			_ = json.Unmarshal(itemsBytes, &f.Items)
			r.mu.Lock()
			r.feeds[r.key(tenantID, readerID)] = f
			r.mu.Unlock()
			return f, nil
		}
	}

	return nil, fmt.Errorf("personalized feed not found for reader %s on tenant %s", readerID, tenantID)
}

// CleanupExpiredSignals purges behavioral_signals older than maxAge (default 90 days)
// per GDPR data retention TTL rules (REQ-019-017).
//
// Authoritative Spec Quotation:
// Source: Arena.txt, Section 4.2/18.2, lines 14467, 144802 ("raw_events: 90 days")
func (r *PostgresPersonalizationRepository) CleanupExpiredSignals(
	ctx context.Context,
	maxAge time.Duration,
) (int, error) {
	if maxAge <= 0 {
		maxAge = 90 * 24 * time.Hour // Default 90 days
	}
	cutoff := time.Now().Add(-maxAge)

	r.mu.Lock()
	cleaned := 0
	newSignals := make([]*domain.BehavioralSignal, 0, len(r.signals))
	for _, sig := range r.signals {
		if sig.OccurredAt.Before(cutoff) {
			cleaned++
		} else {
			newSignals = append(newSignals, sig)
		}
	}
	r.signals = newSignals
	r.mu.Unlock()

	if r.db != nil {
		_, _ = r.db.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", "00000000-0000-0000-0000-000000000000")
		result, err := r.db.ExecContext(ctx,
			`DELETE FROM behavioral_signals WHERE occurred_at < $1`,
			cutoff,
		)
		if err != nil {
			return cleaned, fmt.Errorf("CleanupExpiredSignals: %w", err)
		}
		count, _ := result.RowsAffected()
		return int(count), nil
	}

	return cleaned, nil
}
