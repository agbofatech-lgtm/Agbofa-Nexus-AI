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

var _ application.PaywallRepository = (*PostgresPaywallRepository)(nil)

// PostgresPaywallRepository implements application.PaywallRepository backed by PostgreSQL.
// Implements atomic database-level metering via SQL ON CONFLICT DO UPDATE SET metered_count = metered_count + 1.
// Enforces non-negotiable RLS SET LOCAL app.current_tenant = $1 on every database transaction.
type PostgresPaywallRepository struct {
	mu           sync.RWMutex
	dbURL        string
	db           *sql.DB
	entitlements map[string]*domain.PaywallEntitlement
	metered      map[string]*domain.MeteredAccess
}

// NewPostgresPaywallRepository creates a new PostgresPaywallRepository.
func NewPostgresPaywallRepository(dbURL string) *PostgresPaywallRepository {
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Printf("WARN [PostgresPaywallRepository]: invalid DATABASE_URL: %v", err)
			db = nil
		}
	}
	return &PostgresPaywallRepository{
		dbURL:        dbURL,
		db:           db,
		entitlements: make(map[string]*domain.PaywallEntitlement),
		metered:      make(map[string]*domain.MeteredAccess),
	}
}

// SaveEntitlement saves a PaywallEntitlement record with RLS enforcement.
func (r *PostgresPaywallRepository) SaveEntitlement(ctx context.Context, tenantID string, ent *domain.PaywallEntitlement) error {
	if tenantID == "" || ent == nil || ent.TenantID != tenantID {
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
			INSERT INTO paywall_entitlements (
				entitlement_id, tenant_id, reader_id, content_id,
				has_access, reason, metered_count, metered_limit, checked_at, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			ON CONFLICT (tenant_id, reader_id, content_id) DO UPDATE SET
				has_access = EXCLUDED.has_access,
				reason = EXCLUDED.reason,
				metered_count = EXCLUDED.metered_count,
				metered_limit = EXCLUDED.metered_limit,
				checked_at = EXCLUDED.checked_at
			WHERE paywall_entitlements.tenant_id = $2
		`
		now := time.Now().UTC()
		entID := fmt.Sprintf("ent-%d", now.UnixNano())
		_, err = tx.ExecContext(ctx, query,
			entID, ent.TenantID, ent.ReaderID, ent.ContentID,
			ent.HasAccess, string(ent.Reason), ent.MeteredCount, ent.MeteredLimit,
			ent.CheckedAt, now,
		)
		if err != nil {
			return fmt.Errorf("SaveEntitlement SQL error: %w", err)
		}
		return tx.Commit()
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	key := fmt.Sprintf("%s:%s:%s", tenantID, ent.ReaderID, ent.ContentID)
	r.entitlements[key] = ent
	return nil
}

// GetEntitlement retrieves a cached/saved PaywallEntitlement with RLS enforcement.
func (r *PostgresPaywallRepository) GetEntitlement(ctx context.Context, tenantID, readerID, contentID string) (*domain.PaywallEntitlement, error) {
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
			SELECT tenant_id, reader_id, content_id, has_access,
			       reason, metered_count, metered_limit, checked_at
			FROM paywall_entitlements
			WHERE tenant_id = $1 AND reader_id = $2 AND content_id = $3
			ORDER BY checked_at DESC
			LIMIT 1
		`
		row := tx.QueryRowContext(ctx, query, tenantID, readerID, contentID)
		ent := &domain.PaywallEntitlement{}
		var reasonStr string
		err = row.Scan(
			&ent.TenantID, &ent.ReaderID, &ent.ContentID, &ent.HasAccess,
			&reasonStr, &ent.MeteredCount, &ent.MeteredLimit, &ent.CheckedAt,
		)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrPaywallAccessDenied
		} else if err != nil {
			return nil, fmt.Errorf("GetEntitlement SQL error: %w", err)
		}
		ent.Reason = domain.PaywallReason(reasonStr)
		_ = tx.Commit()
		return ent, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	key := fmt.Sprintf("%s:%s:%s", tenantID, readerID, contentID)
	ent, ok := r.entitlements[key]
	if !ok {
		return nil, domain.ErrPaywallAccessDenied
	}
	if ent.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return ent, nil
}

// GetMeteredAccess retrieves the current metered access state for a reader.
func (r *PostgresPaywallRepository) GetMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error) {
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
			SELECT metered_count, metered_limit, checked_at
			FROM paywall_entitlements
			WHERE tenant_id = $1 AND reader_id = $2
			ORDER BY checked_at DESC
			LIMIT 1
		`
		row := tx.QueryRowContext(ctx, query, tenantID, readerID)
		var count, limit int
		var checkedAt time.Time
		err = row.Scan(&count, &limit, &checkedAt)
		if errors.Is(err, sql.ErrNoRows) {
			_ = tx.Commit()
			return nil, nil
		} else if err != nil {
			return nil, fmt.Errorf("GetMeteredAccess SQL error: %w", err)
		}

		now := time.Now().UTC()
		windowStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		windowEnd := windowStart.AddDate(0, 1, 0)

		_ = tx.Commit()
		return &domain.MeteredAccess{
			TenantID:     tenantID,
			ReaderID:     readerID,
			MeteredCount: count,
			MeteredLimit: limit,
			WindowStart:  windowStart,
			WindowEnd:    windowEnd,
		}, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	key := fmt.Sprintf("%s:%s", tenantID, readerID)
	rec, ok := r.metered[key]
	if !ok {
		return nil, nil
	}
	if rec.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return rec, nil
}

// IncrementMeteredAccess executes an atomic database-level metering increment:
// UPDATE paywall_entitlements SET metered_count = metered_count + 1 WHERE tenant_id = $1 AND reader_id = $2.
// When no row exists, inserts with metered_count = 1.
func (r *PostgresPaywallRepository) IncrementMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	now := time.Now().UTC()
	windowStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	windowEnd := windowStart.AddDate(0, 1, 0)

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
		if err != nil {
			return nil, err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return nil, err
		}

		// Atomic update or insert with ON CONFLICT DO UPDATE
		query := `
			INSERT INTO paywall_entitlements (
				entitlement_id, tenant_id, reader_id, content_id,
				has_access, reason, metered_count, metered_limit, checked_at, created_at
			) VALUES ($1, $2, $3, 'metered_tracker', TRUE, 'METERED_FREE', 1, 5, $4, $4)
			ON CONFLICT (tenant_id, reader_id, content_id) DO UPDATE SET
				metered_count = paywall_entitlements.metered_count + 1,
				checked_at = EXCLUDED.checked_at
			WHERE paywall_entitlements.tenant_id = $2
			RETURNING metered_count, metered_limit
		`
		entID := fmt.Sprintf("meter-%d", now.UnixNano())
		row := tx.QueryRowContext(ctx, query, entID, tenantID, readerID, now)
		var count, limit int
		if err := row.Scan(&count, &limit); err != nil {
			return nil, fmt.Errorf("atomic IncrementMeteredAccess SQL error: %w", err)
		}
		_ = tx.Commit()
		return &domain.MeteredAccess{
			TenantID:     tenantID,
			ReaderID:     readerID,
			MeteredCount: count,
			MeteredLimit: limit,
			WindowStart:  windowStart,
			WindowEnd:    windowEnd,
		}, nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	key := fmt.Sprintf("%s:%s", tenantID, readerID)
	rec, ok := r.metered[key]
	if !ok {
		rec = &domain.MeteredAccess{
			TenantID:     tenantID,
			ReaderID:     readerID,
			MeteredCount: 1,
			MeteredLimit: 5,
			WindowStart:  windowStart,
			WindowEnd:    windowEnd,
		}
		r.metered[key] = rec
		return rec, nil
	}
	if rec.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	rec.MeteredCount++
	return rec, nil
}
