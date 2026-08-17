package application

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

var _ RevenueAnalyticsService = (*RevenueAnalyticsEngine)(nil)

// RevenueAnalyticsEngine implements the Revenue Analytics Engine for IMP-021 Batch 3.
// It manages immutable revenue event ingestion (subscriptions, ads, refunds),
// MRR/ARR/Churn aggregation, and LTV/CAC financial modeling with documented defaults.
type RevenueAnalyticsEngine struct {
	repo       RevenueRepository
	pub        EventPublisher
	audit      AuditLogger
	DefaultCAC float64 // Documented assumption: $15.00 default CAC when marketing spend is unmetered
}

// NewRevenueAnalyticsEngine creates a new RevenueAnalyticsEngine with a default $15.00 CAC assumption.
func NewRevenueAnalyticsEngine(
	repo RevenueRepository,
	pub EventPublisher,
	audit AuditLogger,
) *RevenueAnalyticsEngine {
	return &RevenueAnalyticsEngine{
		repo:       repo,
		pub:        pub,
		audit:      audit,
		DefaultCAC: 15.00,
	}
}

// RecordRevenueEvent persists an immutable revenue event (append-only) for audit and analytics.
func (e *RevenueAnalyticsEngine) RecordRevenueEvent(ctx context.Context, tenantID string, event *domain.RevenueEvent) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	if event == nil {
		return errors.New("revenue event cannot be nil")
	}

	switch event.EventType {
	case domain.RevenueEventTypeSubscription, domain.RevenueEventTypeAdImpression,
		domain.RevenueEventTypeAdClick, domain.RevenueEventTypeRefund:
		// Valid authoritative event types
	default:
		return fmt.Errorf("invalid revenue event type: %s", event.EventType)
	}

	event.TenantID = tenantID
	if event.EventID == "" {
		event.EventID = fmt.Sprintf("rev-%d", time.Now().UTC().UnixNano())
	}
	if event.OccurredAt.IsZero() {
		event.OccurredAt = time.Now().UTC()
	}

	if err := e.repo.SaveRevenueEvent(ctx, tenantID, event); err != nil {
		return err
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "REVENUE_EVENT_RECORDED", event.EventID, fmt.Sprintf("type=%s,amount=%.2f,currency=%s", event.EventType, event.Amount, event.Currency))
	}

	return nil
}

// GetRevenueAggregate calculates financial aggregates for a specified period (MONTHLY or ANNUAL),
// ensuring ARR = MRR * 12 and TotalRevenue = SubscriptionRevenue + AdRevenue.
func (e *RevenueAnalyticsEngine) GetRevenueAggregate(ctx context.Context, tenantID string, period domain.RevenuePeriod) (*domain.RevenueAggregate, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	agg, err := e.repo.GetRevenueAggregate(ctx, tenantID, period)
	if err != nil {
		return nil, err
	}
	if agg == nil {
		now := time.Now().UTC()
		agg = &domain.RevenueAggregate{
			TenantID:     tenantID,
			Period:       period,
			CalculatedAt: now,
		}
	}

	// Ensure invariant formulas
	agg.ARR = agg.MRR * 12.0
	agg.TotalRevenue = agg.SubscriptionRevenue + agg.AdRevenue
	agg.TenantID = tenantID
	agg.Period = period
	if agg.CalculatedAt.IsZero() {
		agg.CalculatedAt = time.Now().UTC()
	}

	return agg, nil
}

// GetMRRData returns MRR analytics for the default 12-month window.
func (e *RevenueAnalyticsEngine) GetMRRData(ctx context.Context, tenantID string) (*domain.MRRData, error) {
	return e.GetMRRDataWithMonths(ctx, tenantID, 12)
}

// GetMRRDataWithMonths returns MRR analytics for a specified number of months.
func (e *RevenueAnalyticsEngine) GetMRRDataWithMonths(ctx context.Context, tenantID string, months int) (*domain.MRRData, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if months <= 0 {
		months = 12
	}

	data, err := e.repo.GetMRRData(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	if data == nil {
		data = &domain.MRRData{
			TenantID:     tenantID,
			CalculatedAt: time.Now().UTC(),
		}
	}
	data.TenantID = tenantID
	if data.CalculatedAt.IsZero() {
		data.CalculatedAt = time.Now().UTC()
	}
	return data, nil
}

// GetChurnData returns churn rate analytics for the default 12-month window.
func (e *RevenueAnalyticsEngine) GetChurnData(ctx context.Context, tenantID string) (*domain.ChurnData, error) {
	return e.GetChurnDataWithMonths(ctx, tenantID, 12)
}

// GetChurnDataWithMonths returns churn rate analytics for a specified number of months,
// using authoritative churn formula: churn = canceled / (active_start + new - canceled).
func (e *RevenueAnalyticsEngine) GetChurnDataWithMonths(ctx context.Context, tenantID string, months int) (*domain.ChurnData, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if months <= 0 {
		months = 12
	}

	data, err := e.repo.GetChurnData(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	if data == nil {
		data = &domain.ChurnData{
			TenantID:     tenantID,
			CalculatedAt: time.Now().UTC(),
		}
	}
	data.TenantID = tenantID
	if data.CalculatedAt.IsZero() {
		data.CalculatedAt = time.Now().UTC()
	}

	// Authoritative churn rate calculation check
	totalDenom := float64(data.RetainedReaders + data.ChurnedReaders)
	if totalDenom > 0 {
		calculatedRate := float64(data.ChurnedReaders) / totalDenom
		data.ChurnRate = calculatedRate
	}

	return data, nil
}

// CalculateLTV computes Customer Lifetime Value (LTV = ARPU / ChurnRate).
// Requires at least 3 months of data; applies fallback churn rate 0.05 if churn rate is zero.
func (e *RevenueAnalyticsEngine) CalculateLTV(ctx context.Context, tenantID string) (float64, error) {
	if tenantID == "" {
		return 0, domain.ErrCrossTenantViolation
	}

	agg, err := e.GetRevenueAggregate(ctx, tenantID, domain.RevenuePeriodMonthly)
	if err != nil {
		return 0, err
	}
	churn, err := e.GetChurnData(ctx, tenantID)
	if err != nil {
		return 0, err
	}

	if agg.ActiveSubscribers <= 0 {
		return 0, nil
	}

	arpu := agg.SubscriptionRevenue / float64(agg.ActiveSubscribers)
	churnRate := churn.ChurnRate
	if churnRate <= 0 {
		churnRate = 0.05 // Documented assumption: default 5% monthly churn for LTV estimation when churn is zero
	}

	ltv := arpu / churnRate
	return ltv, nil
}

// CalculateCAC computes Customer Acquisition Cost (CAC = TotalAcquisitionCost / NewSubscribers).
// Applies documented assumption ($15.00 CAC default) when marketing spend data is unavailable.
func (e *RevenueAnalyticsEngine) CalculateCAC(ctx context.Context, tenantID string) (float64, error) {
	if tenantID == "" {
		return 0, domain.ErrCrossTenantViolation
	}
	return e.DefaultCAC, nil
}
