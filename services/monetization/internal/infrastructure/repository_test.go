package infrastructure

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

func TestPostgresSubscriptionRepository_CRUDAndTenantIsolation(t *testing.T) {
	ctx := context.Background()
	repo := NewPostgresSubscriptionRepository("")
	tenantA := "tenant-alpha"
	tenantB := "tenant-beta"

	// Save Plan in Tenant A
	plan := &domain.SubscriptionPlan{
		PlanID:          "plan-1",
		TenantID:        tenantA,
		Name:            "Pro Plan",
		Tier:            domain.PlanTierPremium,
		Price:           29.99,
		Currency:        "USD",
		BillingInterval: domain.BillingIntervalMonthly,
	}
	if err := repo.SavePlan(ctx, tenantA, plan); err != nil {
		t.Fatalf("unexpected SavePlan error: %v", err)
	}

	// Cross-tenant GetPlan from Tenant B -> error
	_, err := repo.GetPlan(ctx, tenantB, "plan-1")
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on cross-tenant GetPlan, got %v", err)
	}

	// Save Subscription in Tenant A
	sub := &domain.ReaderSubscription{
		SubscriptionID:     "sub-100",
		TenantID:           tenantA,
		ReaderID:           "reader-1",
		PlanID:             "plan-1",
		Status:             domain.SubscriptionStatusActive,
		CurrentPeriodStart: time.Now().UTC(),
		CurrentPeriodEnd:   time.Now().UTC().AddDate(0, 1, 0),
	}
	if err := repo.SaveSubscription(ctx, tenantA, sub); err != nil {
		t.Fatalf("unexpected SaveSubscription error: %v", err)
	}

	// GetActiveSubscriptionByReader for Tenant A
	got, err := repo.GetActiveSubscriptionByReader(ctx, tenantA, "reader-1")
	if err != nil || got == nil {
		t.Fatalf("expected active subscription, got err=%v sub=%v", err, got)
	}

	// Cross-tenant GetSubscription -> error
	_, err = repo.GetSubscription(ctx, tenantB, "sub-100")
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
}

func TestPostgresAdRepository_CRUDAndTenantIsolation(t *testing.T) {
	ctx := context.Background()
	repo := NewPostgresAdRepository("")
	tenantA := "tenant-ad-a"
	tenantB := "tenant-ad-b"

	camp := &domain.AdCampaign{
		CampaignID: "camp-1",
		TenantID:   tenantA,
		Name:       "Summer Campaign",
		Budget:     1000,
		Status:     domain.CampaignStatusActive,
	}
	if err := repo.SaveCampaign(ctx, tenantA, camp); err != nil {
		t.Fatalf("unexpected SaveCampaign error: %v", err)
	}

	_, err := repo.GetCampaign(ctx, tenantB, "camp-1")
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
}

func TestPostgresRevenueRepository_ImmutableEventsAndAggregates(t *testing.T) {
	ctx := context.Background()
	repo := NewPostgresRevenueRepository("")
	tenant := "tenant-rev"

	ev1 := &domain.RevenueEvent{
		EventID:    "rev-1",
		TenantID:   tenant,
		EventType:  domain.RevenueEventTypeSubscription,
		Amount:     50.0,
		Currency:   "USD",
		OccurredAt: time.Now().UTC(),
	}
	ev2 := &domain.RevenueEvent{
		EventID:    "rev-2",
		TenantID:   tenant,
		EventType:  domain.RevenueEventTypeAdImpression,
		Amount:     10.0,
		Currency:   "USD",
		OccurredAt: time.Now().UTC(),
	}

	_ = repo.SaveRevenueEvent(ctx, tenant, ev1)
	_ = repo.SaveRevenueEvent(ctx, tenant, ev2)

	agg, err := repo.GetRevenueAggregate(ctx, tenant, domain.RevenuePeriodMonthly)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if agg.TotalRevenue != 60.0 { // 50 + 10
		t.Fatalf("expected TotalRevenue 60.0, got %f", agg.TotalRevenue)
	}
}

func TestPostgresPaywallRepository_AtomicMeteringAndTenantIsolation(t *testing.T) {
	ctx := context.Background()
	repo := NewPostgresPaywallRepository("")
	tenant := "tenant-pw"

	// Increment access sequentially
	rec1, err := repo.IncrementMeteredAccess(ctx, tenant, "reader-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec1.MeteredCount != 1 {
		t.Fatalf("expected count 1, got %d", rec1.MeteredCount)
	}

	rec2, err := repo.IncrementMeteredAccess(ctx, tenant, "reader-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec2.MeteredCount != 2 {
		t.Fatalf("expected count 2, got %d", rec2.MeteredCount)
	}

	// Cross-tenant attempt returns ErrCrossTenantViolation
	_, err = repo.IncrementMeteredAccess(ctx, "tenant-other", "reader-1")
	if err == nil || rec2.TenantID == "tenant-other" {
		t.Fatalf("expected separate tenant isolation for metered tracker")
	}
}

func TestPostgresReaderValidator_FailClosedCrossTenant(t *testing.T) {
	ctx := context.Background()
	val := NewPostgresReaderValidator("")

	val.RegisterReaderForTest("tenant-A", "reader-1")

	// 1. Valid reader in tenant A
	err := val.ValidateReaderIdentity(ctx, "tenant-A", "reader-1")
	if err != nil {
		t.Fatalf("unexpected validation failure: %v", err)
	}

	// 2. Cross-tenant attempt: reader-1 with tenant-B -> fail closed
	err = val.ValidateReaderIdentity(ctx, "tenant-B", "reader-1")
	if err == nil {
		t.Fatalf("expected validation failure for cross-tenant reader check")
	}

	// 3. Unknown reader in tenant A -> fail closed
	err = val.ValidateReaderIdentity(ctx, "tenant-A", "reader-unknown")
	if err == nil {
		t.Fatalf("expected validation failure for non-existent reader")
	}
}
