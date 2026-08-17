package infrastructure

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/agbofa/nexus/services/monetization/internal/application"
	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

var _ application.SubscriptionRepository = (*PostgresSubscriptionRepository)(nil)

// PostgresSubscriptionRepository implements application.SubscriptionRepository backed by PostgreSQL
// with non-negotiable Row-Level Security (RLS) enforcement on every SQL operation.
// Also provides thread-safe in-memory storage fallback when running without a database connection.
type PostgresSubscriptionRepository struct {
	mu       sync.RWMutex
	dbURL    string
	db       *sql.DB
	subs     map[string]*domain.ReaderSubscription
	plans    map[string]*domain.SubscriptionPlan
}

// NewPostgresSubscriptionRepository creates a new PostgresSubscriptionRepository.
func NewPostgresSubscriptionRepository(dbURL string) *PostgresSubscriptionRepository {
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Printf("WARN [PostgresSubscriptionRepository]: invalid DATABASE_URL: %v", err)
			db = nil
		}
	}
	return &PostgresSubscriptionRepository{
		dbURL: dbURL,
		db:    db,
		subs:  make(map[string]*domain.ReaderSubscription),
		plans: make(map[string]*domain.SubscriptionPlan),
	}
}

// setTenantRLS executes SET LOCAL app.current_tenant = $1 within an active database transaction.
func setTenantRLS(ctx context.Context, tx *sql.Tx, tenantID string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	_, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID)
	if err != nil {
		return fmt.Errorf("failed to set app.current_tenant RLS: %w", err)
	}
	return nil
}

// SaveSubscription saves or updates a ReaderSubscription with RLS enforcement.
func (r *PostgresSubscriptionRepository) SaveSubscription(ctx context.Context, tenantID string, sub *domain.ReaderSubscription) error {
	if tenantID == "" || sub == nil || sub.TenantID != tenantID {
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
			INSERT INTO reader_subscriptions (
				subscription_id, tenant_id, reader_id, plan_id, status,
				current_period_start, current_period_end, cancel_at_period_end,
				payment_method_id, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			ON CONFLICT (subscription_id) DO UPDATE SET
				status = EXCLUDED.status,
				current_period_start = EXCLUDED.current_period_start,
				current_period_end = EXCLUDED.current_period_end,
				cancel_at_period_end = EXCLUDED.cancel_at_period_end,
				payment_method_id = EXCLUDED.payment_method_id,
				updated_at = EXCLUDED.updated_at
			WHERE reader_subscriptions.tenant_id = $2
		`
		_, err = tx.ExecContext(ctx, query,
			sub.SubscriptionID, sub.TenantID, sub.ReaderID, sub.PlanID, string(sub.Status),
			sub.CurrentPeriodStart, sub.CurrentPeriodEnd, sub.CancelAtPeriodEnd,
			sub.PaymentMethodID, sub.CreatedAt, sub.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("SaveSubscription SQL error: %w", err)
		}

		return tx.Commit()
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.subs[sub.SubscriptionID] = sub
	return nil
}

// GetSubscription retrieves a ReaderSubscription by ID with RLS enforcement.
func (r *PostgresSubscriptionRepository) GetSubscription(ctx context.Context, tenantID, subscriptionID string) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if subscriptionID == "" {
		return nil, domain.ErrSubscriptionNotFound
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
			SELECT subscription_id, tenant_id, reader_id, plan_id, status,
			       current_period_start, current_period_end, cancel_at_period_end,
			       payment_method_id, created_at, updated_at
			FROM reader_subscriptions
			WHERE subscription_id = $1 AND tenant_id = $2
		`
		row := tx.QueryRowContext(ctx, query, subscriptionID, tenantID)
		sub := &domain.ReaderSubscription{}
		var statusStr string
		err = row.Scan(
			&sub.SubscriptionID, &sub.TenantID, &sub.ReaderID, &sub.PlanID, &statusStr,
			&sub.CurrentPeriodStart, &sub.CurrentPeriodEnd, &sub.CancelAtPeriodEnd,
			&sub.PaymentMethodID, &sub.CreatedAt, &sub.UpdatedAt,
		)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrSubscriptionNotFound
		} else if err != nil {
			return nil, fmt.Errorf("GetSubscription SQL error: %w", err)
		}
		sub.Status = domain.SubscriptionStatus(statusStr)
		_ = tx.Commit()
		return sub, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	sub, ok := r.subs[subscriptionID]
	if !ok {
		return nil, domain.ErrSubscriptionNotFound
	}
	if sub.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return sub, nil
}

// GetActiveSubscriptionByReader retrieves an active or trialing subscription for a reader.
func (r *PostgresSubscriptionRepository) GetActiveSubscriptionByReader(ctx context.Context, tenantID, readerID string) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if readerID == "" {
		return nil, nil
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
			SELECT subscription_id, tenant_id, reader_id, plan_id, status,
			       current_period_start, current_period_end, cancel_at_period_end,
			       payment_method_id, created_at, updated_at
			FROM reader_subscriptions
			WHERE tenant_id = $1 AND reader_id = $2 AND status IN ('ACTIVE', 'TRIALING')
			ORDER BY updated_at DESC
			LIMIT 1
		`
		row := tx.QueryRowContext(ctx, query, tenantID, readerID)
		sub := &domain.ReaderSubscription{}
		var statusStr string
		err = row.Scan(
			&sub.SubscriptionID, &sub.TenantID, &sub.ReaderID, &sub.PlanID, &statusStr,
			&sub.CurrentPeriodStart, &sub.CurrentPeriodEnd, &sub.CancelAtPeriodEnd,
			&sub.PaymentMethodID, &sub.CreatedAt, &sub.UpdatedAt,
		)
		if errors.Is(err, sql.ErrNoRows) {
			_ = tx.Commit()
			return nil, nil
		} else if err != nil {
			return nil, fmt.Errorf("GetActiveSubscriptionByReader SQL error: %w", err)
		}
		sub.Status = domain.SubscriptionStatus(statusStr)
		_ = tx.Commit()
		return sub, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, sub := range r.subs {
		if sub.TenantID == tenantID && sub.ReaderID == readerID &&
			(sub.Status == domain.SubscriptionStatusActive || sub.Status == domain.SubscriptionStatusTrialing) {
			return sub, nil
		}
	}
	return nil, nil
}

// ListSubscriptions returns all subscriptions belonging to a tenant.
func (r *PostgresSubscriptionRepository) ListSubscriptions(ctx context.Context, tenantID string) ([]*domain.ReaderSubscription, error) {
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
			SELECT subscription_id, tenant_id, reader_id, plan_id, status,
			       current_period_start, current_period_end, cancel_at_period_end,
			       payment_method_id, created_at, updated_at
			FROM reader_subscriptions
			WHERE tenant_id = $1
		`
		rows, err := tx.QueryContext(ctx, query, tenantID)
		if err != nil {
			return nil, fmt.Errorf("ListSubscriptions SQL error: %w", err)
		}
		defer rows.Close()

		var list []*domain.ReaderSubscription
		for rows.Next() {
			sub := &domain.ReaderSubscription{}
			var statusStr string
			if err := rows.Scan(
				&sub.SubscriptionID, &sub.TenantID, &sub.ReaderID, &sub.PlanID, &statusStr,
				&sub.CurrentPeriodStart, &sub.CurrentPeriodEnd, &sub.CancelAtPeriodEnd,
				&sub.PaymentMethodID, &sub.CreatedAt, &sub.UpdatedAt,
			); err != nil {
				return nil, err
			}
			sub.Status = domain.SubscriptionStatus(statusStr)
			list = append(list, sub)
		}
		_ = tx.Commit()
		return list, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []*domain.ReaderSubscription
	for _, sub := range r.subs {
		if sub.TenantID == tenantID {
			list = append(list, sub)
		}
	}
	return list, nil
}

// SavePlan persists a SubscriptionPlan with RLS enforcement.
func (r *PostgresSubscriptionRepository) SavePlan(ctx context.Context, tenantID string, plan *domain.SubscriptionPlan) error {
	if tenantID == "" || plan == nil || plan.TenantID != tenantID {
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

		featuresBytes, _ := json.Marshal(plan.Features)
		query := `
			INSERT INTO subscription_plans (
				plan_id, tenant_id, name, tier, price, currency,
				billing_interval, features, max_readers, is_active, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			ON CONFLICT (plan_id) DO UPDATE SET
				name = EXCLUDED.name,
				tier = EXCLUDED.tier,
				price = EXCLUDED.price,
				currency = EXCLUDED.currency,
				billing_interval = EXCLUDED.billing_interval,
				features = EXCLUDED.features,
				max_readers = EXCLUDED.max_readers,
				updated_at = EXCLUDED.updated_at
			WHERE subscription_plans.tenant_id = $2
		`
		_, err = tx.ExecContext(ctx, query,
			plan.PlanID, plan.TenantID, plan.Name, string(plan.Tier), plan.Price, plan.Currency,
			string(plan.BillingInterval), featuresBytes, plan.MaxReaders, true, plan.CreatedAt, plan.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("SavePlan SQL error: %w", err)
		}
		return tx.Commit()
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.plans[plan.PlanID] = plan
	return nil
}

// GetPlan retrieves a SubscriptionPlan by ID within a tenant context.
func (r *PostgresSubscriptionRepository) GetPlan(ctx context.Context, tenantID, planID string) (*domain.SubscriptionPlan, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if planID == "" {
		return nil, domain.ErrPlanNotFound
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
			SELECT plan_id, tenant_id, name, tier, price, currency,
			       billing_interval, features, max_readers, created_at, updated_at
			FROM subscription_plans
			WHERE plan_id = $1 AND tenant_id = $2 AND is_active = TRUE
		`
		row := tx.QueryRowContext(ctx, query, planID, tenantID)
		plan := &domain.SubscriptionPlan{}
		var tierStr, intervalStr string
		var featuresBytes []byte
		err = row.Scan(
			&plan.PlanID, &plan.TenantID, &plan.Name, &tierStr, &plan.Price, &plan.Currency,
			&intervalStr, &featuresBytes, &plan.MaxReaders, &plan.CreatedAt, &plan.UpdatedAt,
		)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrPlanNotFound
		} else if err != nil {
			return nil, fmt.Errorf("GetPlan SQL error: %w", err)
		}
		plan.Tier = domain.PlanTier(tierStr)
		plan.BillingInterval = domain.BillingInterval(intervalStr)
		_ = json.Unmarshal(featuresBytes, &plan.Features)
		_ = tx.Commit()
		return plan, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	plan, ok := r.plans[planID]
	if !ok {
		return nil, domain.ErrPlanNotFound
	}
	if plan.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return plan, nil
}

// ListPlans lists all active plans for a tenant.
func (r *PostgresSubscriptionRepository) ListPlans(ctx context.Context, tenantID string) ([]*domain.SubscriptionPlan, error) {
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
			SELECT plan_id, tenant_id, name, tier, price, currency,
			       billing_interval, features, max_readers, created_at, updated_at
			FROM subscription_plans
			WHERE tenant_id = $1 AND is_active = TRUE
		`
		rows, err := tx.QueryContext(ctx, query, tenantID)
		if err != nil {
			return nil, fmt.Errorf("ListPlans SQL error: %w", err)
		}
		defer rows.Close()

		var list []*domain.SubscriptionPlan
		for rows.Next() {
			plan := &domain.SubscriptionPlan{}
			var tierStr, intervalStr string
			var featuresBytes []byte
			if err := rows.Scan(
				&plan.PlanID, &plan.TenantID, &plan.Name, &tierStr, &plan.Price, &plan.Currency,
				&intervalStr, &featuresBytes, &plan.MaxReaders, &plan.CreatedAt, &plan.UpdatedAt,
			); err != nil {
				return nil, err
			}
			plan.Tier = domain.PlanTier(tierStr)
			plan.BillingInterval = domain.BillingInterval(intervalStr)
			_ = json.Unmarshal(featuresBytes, &plan.Features)
			list = append(list, plan)
		}
		_ = tx.Commit()
		return list, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []*domain.SubscriptionPlan
	for _, plan := range r.plans {
		if plan.TenantID == tenantID {
			list = append(list, plan)
		}
	}
	return list, nil
}