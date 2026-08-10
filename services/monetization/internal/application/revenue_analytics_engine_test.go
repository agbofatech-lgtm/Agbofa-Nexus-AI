package application

import (
	"context"
	"errors"
	"sync"
	"testing"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type mockRevenueRepository struct {
	mu         sync.Mutex
	events     map[string]*domain.RevenueEvent
	aggregates map[string]*domain.RevenueAggregate
	mrr        map[string]*domain.MRRData
	churn      map[string]*domain.ChurnData
}

func newMockRevenueRepository() *mockRevenueRepository {
	return &mockRevenueRepository{
		events:     make(map[string]*domain.RevenueEvent),
		aggregates: make(map[string]*domain.RevenueAggregate),
		mrr:        make(map[string]*domain.MRRData),
		churn:      make(map[string]*domain.ChurnData),
	}
}

func (m *mockRevenueRepository) SaveRevenueEvent(ctx context.Context, tenantID string, event *domain.RevenueEvent) error {
	if tenantID == "" || event.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events[event.EventID] = event
	return nil
}

func (m *mockRevenueRepository) GetRevenueAggregate(ctx context.Context, tenantID string, period domain.RevenuePeriod) (*domain.RevenueAggregate, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	agg, ok := m.aggregates[tenantID+":"+string(period)]
	if !ok {
		return nil, nil
	}
	if agg.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return agg, nil
}

func (m *mockRevenueRepository) GetMRRData(ctx context.Context, tenantID string) (*domain.MRRData, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	data, ok := m.mrr[tenantID]
	if !ok {
		return nil, nil
	}
	if data.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return data, nil
}

func (m *mockRevenueRepository) GetChurnData(ctx context.Context, tenantID string) (*domain.ChurnData, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	data, ok := m.churn[tenantID]
	if !ok {
		return nil, nil
	}
	if data.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return data, nil
}

func setupRevenueEngine() (*RevenueAnalyticsEngine, *mockRevenueRepository, *mockAdEventPublisher, *mockAuditLogger) {
	repo := newMockRevenueRepository()
	pub := &mockAdEventPublisher{}
	audit := &mockAuditLogger{}
	engine := NewRevenueAnalyticsEngine(repo, pub, audit)
	return engine, repo, pub, audit
}

func TestRevenueAnalyticsEngine_TenantIsolation(t *testing.T) {
	engine, _, _, _ := setupRevenueEngine()
	ctx := context.Background()

	err := engine.RecordRevenueEvent(ctx, "", &domain.RevenueEvent{EventType: domain.RevenueEventTypeSubscription, Amount: 99.0})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant, got %v", err)
	}

	_, err = engine.GetRevenueAggregate(ctx, "", domain.RevenuePeriodMonthly)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant, got %v", err)
	}
}

func TestRevenueAnalyticsEngine_RecordRevenueEvent(t *testing.T) {
	engine, repo, _, audit := setupRevenueEngine()
	ctx := context.Background()

	// 1. Valid event
	err := engine.RecordRevenueEvent(ctx, "tenant-A", &domain.RevenueEvent{
		EventType: domain.RevenueEventTypeSubscription,
		Amount:    49.99,
		Currency:  "USD",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(repo.events) != 1 {
		t.Fatalf("expected 1 saved event, got %d", len(repo.events))
	}
	if len(audit.events) != 1 {
		t.Fatalf("expected 1 audit log event, got %d", len(audit.events))
	}

	// 2. Invalid event type -> error
	err = engine.RecordRevenueEvent(ctx, "tenant-A", &domain.RevenueEvent{
		EventType: "INVALID_TYPE",
		Amount:    10.0,
	})
	if err == nil {
		t.Fatalf("expected error on invalid revenue event type")
	}
}

func TestRevenueAnalyticsEngine_AggregateFormulas(t *testing.T) {
	engine, repo, _, _ := setupRevenueEngine()
	ctx := context.Background()

	// Seed repository aggregate
	repo.aggregates["tenant-A:MONTHLY"] = &domain.RevenueAggregate{
		TenantID:            "tenant-A",
		Period:              domain.RevenuePeriodMonthly,
		MRR:                 1000.0,
		SubscriptionRevenue: 1000.0,
		AdRevenue:           500.0,
		ActiveSubscribers:   100,
	}

	agg, err := engine.GetRevenueAggregate(ctx, "tenant-A", domain.RevenuePeriodMonthly)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Invariant formulas check
	if agg.ARR != 12000.0 { // 1000 * 12
		t.Fatalf("expected ARR=12000, got %f", agg.ARR)
	}
	if agg.TotalRevenue != 1500.0 { // 1000 + 500
		t.Fatalf("expected TotalRevenue=1500, got %f", agg.TotalRevenue)
	}
}

func TestRevenueAnalyticsEngine_ChurnFormulaAndLTVCAC(t *testing.T) {
	engine, repo, _, _ := setupRevenueEngine()
	ctx := context.Background()

	// Seed churn data
	repo.churn["tenant-A"] = &domain.ChurnData{
		TenantID:        "tenant-A",
		ChurnedReaders:  10,
		RetainedReaders: 190,
	}
	// Seed revenue aggregate for ARPU calculation
	repo.aggregates["tenant-A:MONTHLY"] = &domain.RevenueAggregate{
		TenantID:            "tenant-A",
		Period:              domain.RevenuePeriodMonthly,
		MRR:                 2000.0,
		SubscriptionRevenue: 2000.0,
		ActiveSubscribers:   200, // ARPU = 2000 / 200 = 10.00
	}

	churn, err := engine.GetChurnData(ctx, "tenant-A")
	if err != nil {
		t.Fatalf("unexpected churn error: %v", err)
	}
	expectedChurnRate := 10.0 / 200.0 // 0.05
	if churn.ChurnRate != expectedChurnRate {
		t.Fatalf("expected churn rate %f, got %f", expectedChurnRate, churn.ChurnRate)
	}

	ltv, err := engine.CalculateLTV(ctx, "tenant-A")
	if err != nil {
		t.Fatalf("unexpected LTV error: %v", err)
	}
	// ARPU = 10.00, ChurnRate = 0.05 => LTV = 10.00 / 0.05 = 200.00
	if ltv != 200.0 {
		t.Fatalf("expected LTV=200.0, got %f", ltv)
	}

	cac, err := engine.CalculateCAC(ctx, "tenant-A")
	if err != nil {
		t.Fatalf("unexpected CAC error: %v", err)
	}
	if cac != 15.00 { // Default documented assumption
		t.Fatalf("expected default CAC=15.00, got %f", cac)
	}
}
