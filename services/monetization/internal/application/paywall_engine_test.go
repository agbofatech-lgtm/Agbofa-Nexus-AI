package application

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type mockPaywallRepository struct {
	mu            sync.Mutex
	entitlements  map[string]*domain.PaywallEntitlement
	meteredAccess map[string]*domain.MeteredAccess
}

func newMockPaywallRepository() *mockPaywallRepository {
	return &mockPaywallRepository{
		entitlements:  make(map[string]*domain.PaywallEntitlement),
		meteredAccess: make(map[string]*domain.MeteredAccess),
	}
}

func (m *mockPaywallRepository) SaveEntitlement(ctx context.Context, tenantID string, ent *domain.PaywallEntitlement) error {
	if tenantID == "" || ent.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	key := fmt.Sprintf("%s:%s:%s", tenantID, ent.ReaderID, ent.ContentID)
	m.entitlements[key] = ent
	return nil
}

func (m *mockPaywallRepository) GetEntitlement(ctx context.Context, tenantID, readerID, contentID string) (*domain.PaywallEntitlement, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	key := fmt.Sprintf("%s:%s:%s", tenantID, readerID, contentID)
	ent, exists := m.entitlements[key]
	if !exists {
		return nil, domain.ErrPaywallAccessDenied
	}
	if ent.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return ent, nil
}

func (m *mockPaywallRepository) GetMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	key := fmt.Sprintf("%s:%s", tenantID, readerID)
	rec, exists := m.meteredAccess[key]
	if !exists {
		return nil, nil
	}
	if rec.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return rec, nil
}

func (m *mockPaywallRepository) IncrementMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	key := fmt.Sprintf("%s:%s", tenantID, readerID)
	rec, exists := m.meteredAccess[key]
	if !exists {
		now := time.Now().UTC()
		windowStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		windowEnd := windowStart.AddDate(0, 1, 0)
		rec = &domain.MeteredAccess{
			TenantID:     tenantID,
			ReaderID:     readerID,
			MeteredCount: 1,
			MeteredLimit: 5,
			WindowStart:  windowStart,
			WindowEnd:    windowEnd,
		}
		m.meteredAccess[key] = rec
		return rec, nil
	}
	if rec.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	rec.MeteredCount++
	return rec, nil
}

func setupPaywallTest() (*PaywallEngine, *SubscriptionEngine, *mockPaywallRepository, *mockSubscriptionRepository, *mockEventPublisher, *mockAuditLogger) {
	subEngine, subRepo, pub, audit := setupSubscriptionEngine()
	paywallRepo := newMockPaywallRepository()
	readerVal := &mockReaderValidator{
		validReaders: map[string]bool{
			"tenant-A:reader-1": true,
			"tenant-A:reader-2": true,
			"tenant-A:reader-3": true,
			"tenant-B:reader-1": true,
		},
	}

	paywallEngine := NewPaywallEngine(paywallRepo, subEngine, readerVal, pub, audit)
	return paywallEngine, subEngine, paywallRepo, subRepo, pub, audit
}

func TestPaywallEngine_TenantIsolation(t *testing.T) {
	engine, _, _, _, _, _ := setupPaywallTest()
	ctx := context.Background()

	// 1. Check entitlement with empty tenantID -> error
	_, err := engine.CheckEntitlement(ctx, "", "reader-1", "content-100", false)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant, got %v", err)
	}

	// 2. Get metered access with empty tenantID -> error
	_, err = engine.GetMeteredAccess(ctx, "", "reader-1")
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant, got %v", err)
	}

	// 3. Increment metered access with empty tenantID -> error
	_, err = engine.IncrementMeteredAccess(ctx, "", "reader-1")
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant, got %v", err)
	}
}

func TestPaywallEngine_EntitlementReasons(t *testing.T) {
	engine, subEngine, _, _, pub, _ := setupPaywallTest()
	ctx := context.Background()

	// 1. SUBSCRIBED: reader with ACTIVE subscription
	_, _ = subEngine.CreateSubscription(ctx, "tenant-A", "reader-1", "plan-free", "")
	resSub, err := engine.CheckEntitlement(ctx, "tenant-A", "reader-1", "content-101", true)
	if err != nil {
		t.Fatalf("unexpected CheckEntitlement error: %v", err)
	}
	if !resSub.HasAccess || resSub.Reason != domain.PaywallReasonSubscribed {
		t.Fatalf("expected HasAccess=true, Reason=SUBSCRIBED, got HasAccess=%v, Reason=%s", resSub.HasAccess, resSub.Reason)
	}

	// 2. METERED_FREE: reader without subscription accessing non-premium content under limit
	resMetered, err := engine.CheckEntitlement(ctx, "tenant-A", "reader-2", "content-102", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resMetered.HasAccess || resMetered.Reason != domain.PaywallReasonMeteredFree {
		t.Fatalf("expected HasAccess=true, Reason=METERED_FREE, got HasAccess=%v, Reason=%s", resMetered.HasAccess, resMetered.Reason)
	}

	// 3. PREMIUM_ONLY: free reader attempting to access premium content
	resPrem, err := engine.CheckEntitlement(ctx, "tenant-A", "reader-2", "content-103", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resPrem.HasAccess || resPrem.Reason != domain.PaywallReasonPremiumOnly {
		t.Fatalf("expected HasAccess=false, Reason=PREMIUM_ONLY, got HasAccess=%v, Reason=%s", resPrem.HasAccess, resPrem.Reason)
	}

	// 4. EXPIRED: reader with EXPIRED subscription attempting to access content
	subExp, err := subEngine.CreateSubscription(ctx, "tenant-A", "reader-3", "plan-free", "")
	if err != nil {
		t.Fatalf("unexpected CreateSubscription error for reader-3: %v", err)
	}
	_, err = subEngine.TransitionStatus(ctx, "tenant-A", subExp.SubscriptionID, domain.SubscriptionStatusExpired)
	if err != nil {
		t.Fatalf("unexpected TransitionStatus error for reader-3: %v", err)
	}

	resExp, err := engine.CheckEntitlement(ctx, "tenant-A", "reader-3", "content-104", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resExp.HasAccess || resExp.Reason != domain.PaywallReasonExpired {
		t.Fatalf("expected HasAccess=false, Reason=EXPIRED, got HasAccess=%v, Reason=%s", resExp.HasAccess, resExp.Reason)
	}

	// 5. Verify events emitted
	if len(pub.subCreatedEvents) == 0 {
		t.Fatalf("expected subscription events to be published")
	}
}

func TestPaywallEngine_MeteredAccessLimits(t *testing.T) {
	engine, _, _, _, _, _ := setupPaywallTest()
	ctx := context.Background()

	// 1. Default limit is 5
	access, err := engine.GetMeteredAccess(ctx, "tenant-A", "reader-2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if access.MeteredLimit != 5 {
		t.Fatalf("expected default metered limit 5, got %d", access.MeteredLimit)
	}

	// 2. Configure limit to 2 for tenant-A
	engine.SetTenantMeterLimit("tenant-A", 2)
	access, _ = engine.GetMeteredAccess(ctx, "tenant-A", "reader-2")
	if access.MeteredLimit != 2 {
		t.Fatalf("expected configured metered limit 2, got %d", access.MeteredLimit)
	}

	// 3. Increment metered count up to limit
	_, _ = engine.IncrementMeteredAccess(ctx, "tenant-A", "reader-2")
	_, _ = engine.IncrementMeteredAccess(ctx, "tenant-A", "reader-2")

	// 4. Now at limit (2/2): CheckEntitlement should return HasAccess=false, Reason=PREMIUM_ONLY
	resOver, err := engine.CheckEntitlement(ctx, "tenant-A", "reader-2", "content-105", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resOver.HasAccess || resOver.Reason != domain.PaywallReasonPremiumOnly {
		t.Fatalf("expected HasAccess=false, Reason=PREMIUM_ONLY when over metered limit, got HasAccess=%v, Reason=%s", resOver.HasAccess, resOver.Reason)
	}
}

func TestPaywallEngine_ThreadSafeIncrements(t *testing.T) {
	engine, _, _, _, _, _ := setupPaywallTest()
	ctx := context.Background()

	engine.SetTenantMeterLimit("tenant-A", 100)

	var wg sync.WaitGroup
	workers := 20
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := engine.IncrementMeteredAccess(ctx, "tenant-A", "reader-concurrency")
			if err != nil {
				t.Errorf("concurrent increment failed: %v", err)
			}
		}()
	}
	wg.Wait()

	res, err := engine.GetMeteredAccess(ctx, "tenant-A", "reader-concurrency")
	if err != nil {
		t.Fatalf("failed to get metered access: %v", err)
	}
	if res.MeteredCount != workers {
		t.Fatalf("expected count %d after concurrent increments, got %d", workers, res.MeteredCount)
	}
}

func TestPaywallEngine_CacheTTLAndInvalidation(t *testing.T) {
	engine, _, _, _, _, _ := setupPaywallTest()
	ctx := context.Background()

	// 1. Initial entitlement check -> cache miss -> evaluated METERED_FREE
	res1, err := engine.CheckEntitlement(ctx, "tenant-A", "reader-2", "content-200", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !res1.HasAccess || res1.Reason != domain.PaywallReasonMeteredFree {
		t.Fatalf("expected METERED_FREE, got %s", res1.Reason)
	}

	// 2. Mark content as premium in engine
	engine.SetContentPremium("tenant-A", "content-200", true)

	// 3. Check again immediately: should hit cache and still return METERED_FREE
	res2, err := engine.CheckEntitlement(ctx, "tenant-A", "reader-2", "content-200", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !res2.HasAccess || res2.Reason != domain.PaywallReasonMeteredFree {
		t.Fatalf("expected cache hit returning METERED_FREE, got %s", res2.Reason)
	}

	// 4. Invalidate reader cache
	engine.InvalidateReaderCache(ctx, "tenant-A", "reader-2")

	// 5. Check again after invalidation: should re-evaluate as PREMIUM_ONLY
	res3, err := engine.CheckEntitlement(ctx, "tenant-A", "reader-2", "content-200", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res3.HasAccess || res3.Reason != domain.PaywallReasonPremiumOnly {
		t.Fatalf("expected PREMIUM_ONLY after cache invalidation, got HasAccess=%v, Reason=%s", res3.HasAccess, res3.Reason)
	}
}

func TestPaywallEngine_AnonymousUsers(t *testing.T) {
	engine, _, _, _, _, _ := setupPaywallTest()
	ctx := context.Background()

	// Anonymous session ID
	anonID := "anon:sess-9999"

	// 1. Non-premium content -> METERED_FREE
	res1, err := engine.CheckEntitlement(ctx, "tenant-A", anonID, "content-10", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !res1.HasAccess || res1.Reason != domain.PaywallReasonMeteredFree {
		t.Fatalf("expected METERED_FREE for anon reader on free content, got %s", res1.Reason)
	}

	// 2. Premium content -> PREMIUM_ONLY
	res2, err := engine.CheckEntitlement(ctx, "tenant-A", anonID, "content-20", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res2.HasAccess || res2.Reason != domain.PaywallReasonPremiumOnly {
		t.Fatalf("expected PREMIUM_ONLY for anon reader on premium content, got %s", res2.Reason)
	}
}
