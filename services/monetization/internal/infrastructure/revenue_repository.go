package infrastructure

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/application"
	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

var _ application.RevenueRepository = (*PostgresRevenueRepository)(nil)

// PostgresRevenueRepository implements application.RevenueRepository backed by PostgreSQL.
// All revenue events are immutable and append-only.
// Every SQL operation executes SET LOCAL app.current_tenant = $1.
type PostgresRevenueRepository struct {
	mu     sync.RWMutex
	dbURL  string
	db     *sql.DB
	events map[string]*domain.RevenueEvent
	mrr    map[string]*domain.MRRData
	churn  map[string]*domain.ChurnData
}

// NewPostgresRevenueRepository creates a new PostgresRevenueRepository.
func NewPostgresRevenueRepository(dbURL string) *PostgresRevenueRepository {
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Printf("WARN [PostgresRevenueRepository]: invalid DATABASE_URL: %v", err)
			db = nil
		}
	}
	return &PostgresRevenueRepository{
		dbURL:  dbURL,
		db:     db,
		events: make(map[string]*domain.RevenueEvent),
		mrr:    make(map[string]*domain.MRRData),
		churn:  make(map[string]*domain.ChurnData),
	}
}

// SaveRevenueEvent appends an immutable revenue event with RLS enforcement.
func (r *PostgresRevenueRepository) SaveRevenueEvent(ctx context.Context, tenantID string, event *domain.RevenueEvent) error {
	if tenantID == "" || event == nil || event.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return err
		}

		query := `
			INSERT INTO revenue_events (
				event_id, tenant_id, event_type, amount, currency,
				related_id, metadata, occurred_at, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`
		_, err = tx.ExecContext(ctx, query,
			event.EventID, event.TenantID, string(event.EventType),
			event.Amount, event.Currency, event.RelatedID, "{}",
			event.OccurredAt, time.Now().UTC(),
		)
		if err != nil {
			return fmt.Errorf("SaveRevenueEvent SQL error: %w", err)
		}
		return tx.Commit()
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.events[event.EventID] = event
	return nil
}

// GetRevenueAggregate calculates aggregate revenue figures for a tenant and period from raw events.
func (r *PostgresRevenueRepository) GetRevenueAggregate(ctx context.Context, tenantID string, period domain.RevenuePeriod) (*domain.RevenueAggregate, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return nil, err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return nil, err
		}

		query := `
			SELECT
				COALESCE(SUM(CASE WHEN event_type = 'SUBSCRIPTION' THEN amount ELSE 0 END), 0) AS sub_rev,
				COALESCE(SUM(CASE WHEN event_type IN ('AD_IMPRESSION', 'AD_CLICK') THEN amount ELSE 0 END), 0) AS ad_rev
			FROM revenue_events
			WHERE tenant_id = $1
		`
		var subRev, adRev float64
		err = tx.QueryRowContext(ctx, query, tenantID).Scan(&subRev, &adRev)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("GetRevenueAggregate SQL error: %w", err)
		}

		_ = tx.Commit()
		now := time.Now().UTC()
		return &domain.RevenueAggregate{
			TenantID:            tenantID,
			Period:              period,
			MRR:                 subRev, // Basic approximation from monthly subscription events
			ARR:                 subRev * 12.0,
			TotalRevenue:        subRev + adRev,
			SubscriptionRevenue: subRev,
			AdRevenue:           adRev,
			ActiveSubscribers:   0,
			CalculatedAt:        now,
		}, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var subRev, adRev float64
	for _, ev := range r.events {
		if ev.TenantID == tenantID {
			if ev.EventType == domain.RevenueEventTypeSubscription {
				subRev += ev.Amount
			} else if ev.EventType == domain.RevenueEventTypeAdImpression || ev.EventType == domain.RevenueEventTypeAdClick {
				adRev += ev.Amount
			}
		}
	}
	now := time.Now().UTC()
	return &domain.RevenueAggregate{
		TenantID:            tenantID,
		Period:              period,
		MRR:                 subRev,
		ARR:                 subRev * 12.0,
		TotalRevenue:        subRev + adRev,
		SubscriptionRevenue: subRev,
		AdRevenue:           adRev,
		ActiveSubscribers:   0,
		CalculatedAt:        now,
	}, nil
}

// GetMRRData calculates or retrieves MRR analytics for a tenant.
func (r *PostgresRevenueRepository) GetMRRData(ctx context.Context, tenantID string) (*domain.MRRData, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	data, ok := r.mrr[tenantID]
	r.mu.RUnlock()
	if ok {
		return data, nil
	}
	return &domain.MRRData{
		TenantID:     tenantID,
		CalculatedAt: time.Now().UTC(),
	}, nil
}

// GetChurnData calculates or retrieves Churn rate analytics for a tenant.
func (r *PostgresRevenueRepository) GetChurnData(ctx context.Context, tenantID string) (*domain.ChurnData, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	data, ok := r.churn[tenantID]
	r.mu.RUnlock()
	if ok {
		return data, nil
	}
	return &domain.ChurnData{
		TenantID:     tenantID,
		CalculatedAt: time.Now().UTC(),
	}, nil
}
