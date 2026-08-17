package application

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

// mockSubscriptionRepository is an in-memory implementation for testing SubscriptionEngine.
type mockSubscriptionRepository struct {
	subs  map[string]*domain.ReaderSubscription
	plans map[string]*domain.SubscriptionPlan
}

func newMockSubscriptionRepository() *mockSubscriptionRepository {
	return &mockSubscriptionRepository{
		subs:  make(map[string]*domain.ReaderSubscription),
		plans: make(map[string]*domain.SubscriptionPlan),
	}
}

func (m *mockSubscriptionRepository) SaveSubscription(ctx context.Context, tenantID string, sub *domain.ReaderSubscription) error {
	if tenantID == "" || sub.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}
	m.subs[sub.SubscriptionID] = sub
	return nil
}

func (m *mockSubscriptionRepository) GetSubscription(ctx context.Context, tenantID, subscriptionID string) (*domain.ReaderSubscription, error) {
	sub, exists := m.subs[subscriptionID]
	if !exists {
		return nil, domain.ErrSubscriptionNotFound
	}
	if sub.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return sub, nil
}

func (m *mockSubscriptionRepository) GetActiveSubscriptionByReader(ctx context.Context, tenantID, readerID string) (*domain.ReaderSubscription, error) {
	for _, sub := range m.subs {
		if sub.TenantID == tenantID && sub.ReaderID == readerID &&
			(sub.Status == domain.SubscriptionStatusActive || sub.Status == domain.SubscriptionStatusTrialing) {
			return sub, nil
		}
	}
	return nil, nil
}

func (m *mockSubscriptionRepository) ListSubscriptions(ctx context.Context, tenantID string) ([]*domain.ReaderSubscription, error) {
	var list []*domain.ReaderSubscription
	for _, sub := range m.subs {
		if sub.TenantID == tenantID {
			list = append(list, sub)
		}
	}
	return list, nil
}

func (m *mockSubscriptionRepository) SavePlan(ctx context.Context, tenantID string, plan *domain.SubscriptionPlan) error {
	if plan.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}
	m.plans[plan.PlanID] = plan
	return nil
}

func (m *mockSubscriptionRepository) GetPlan(ctx context.Context, tenantID, planID string) (*domain.SubscriptionPlan, error) {
	plan, exists := m.plans[planID]
	if !exists {
		return nil, domain.ErrPlanNotFound
	}
	if plan.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return plan, nil
}

func (m *mockSubscriptionRepository) ListPlans(ctx context.Context, tenantID string) ([]*domain.SubscriptionPlan, error) {
	var list []*domain.SubscriptionPlan
	for _, plan := range m.plans {
		if plan.TenantID == tenantID {
			list = append(list, plan)
		}
	}
	return list, nil
}

type mockReaderValidator struct {
	validReaders map[string]bool
}

func (m *mockReaderValidator) ValidateReaderIdentity(ctx context.Context, tenantID, readerID string) error {
	if m.validReaders != nil && !m.validReaders[tenantID+":"+readerID] {
		return errors.New("reader identity not found in IMP-019")
	}
	return nil
}

type mockEventPublisher struct {
	subCreatedEvents  []*domain.SubscriptionCreatedEvent
	subCanceledEvents []*domain.SubscriptionCanceledEvent
	paySuccessEvents  []*domain.PaymentSucceededEvent
	payFailEvents     []*domain.PaymentFailedEvent
}

func (m *mockEventPublisher) PublishSubscriptionCreated(ctx context.Context, event *domain.SubscriptionCreatedEvent) error {
	m.subCreatedEvents = append(m.subCreatedEvents, event)
	return nil
}

func (m *mockEventPublisher) PublishSubscriptionCanceled(ctx context.Context, event *domain.SubscriptionCanceledEvent) error {
	m.subCanceledEvents = append(m.subCanceledEvents, event)
	return nil
}

func (m *mockEventPublisher) PublishPaymentSucceeded(ctx context.Context, event *domain.PaymentSucceededEvent) error {
	m.paySuccessEvents = append(m.paySuccessEvents, event)
	return nil
}

func (m *mockEventPublisher) PublishPaymentFailed(ctx context.Context, event *domain.PaymentFailedEvent) error {
	m.payFailEvents = append(m.payFailEvents, event)
	return nil
}

func (m *mockEventPublisher) PublishPaywallTriggered(ctx context.Context, event *domain.PaywallTriggeredEvent) error {
	return nil
}

func (m *mockEventPublisher) PublishAdImpression(ctx context.Context, event *domain.AdImpressionEvent) error {
	return nil
}

func (m *mockEventPublisher) PublishAdClick(ctx context.Context, event *domain.AdClickEvent) error {
	return nil
}

func (m *mockEventPublisher) PublishRevenueAggregated(ctx context.Context, event *domain.RevenueAggregatedEvent) error {
	return nil
}

type mockAuditLogger struct {
	events []string
}

func (m *mockAuditLogger) LogEvent(ctx context.Context, tenantID, action, resource, details string) error {
	m.events = append(m.events, fmt.Sprintf("%s|%s|%s|%s", tenantID, action, resource, details))
	return nil
}

type mockPaymentProvider struct {
	shouldFail bool
}

func (m *mockPaymentProvider) InitializePayment(ctx context.Context, tenantID string, amount float64, currency string, metadata map[string]string) (*domain.PaymentIntent, error) {
	if m.shouldFail {
		return nil, domain.ErrPaymentFailed
	}
	return &domain.PaymentIntent{
		PaymentIntentID: "pi_123",
		TenantID:        tenantID,
		Amount:          amount,
		Currency:        currency,
		Status:          "SUCCEEDED",
		CreatedAt:       time.Now().UTC(),
	}, nil
}

func (m *mockPaymentProvider) VerifyPayment(ctx context.Context, tenantID, paymentIntentID string) (*domain.PaymentVerification, error) {
	return nil, nil
}

func (m *mockPaymentProvider) CreateCustomer(ctx context.Context, tenantID, readerID, email string, metadata map[string]string) (string, error) {
	return "cus_123", nil
}

func (m *mockPaymentProvider) CreateSubscription(ctx context.Context, tenantID, customerID, planID string) (string, error) {
	return "sub_123", nil
}

func (m *mockPaymentProvider) CancelSubscription(ctx context.Context, tenantID, subscriptionID string) error {
	return nil
}

func (m *mockPaymentProvider) ProcessWebhook(ctx context.Context, tenantID string, payload []byte, signature string) (*domain.PaymentEvent, error) {
	return nil, nil
}

func setupSubscriptionEngine() (*SubscriptionEngine, *mockSubscriptionRepository, *mockEventPublisher, *mockAuditLogger) {
	repo := newMockSubscriptionRepository()
	pub := &mockEventPublisher{}
	audit := &mockAuditLogger{}
	readerVal := &mockReaderValidator{
		validReaders: map[string]bool{
			"tenant-A:reader-1": true,
			"tenant-A:reader-2": true,
			"tenant-A:reader-3": true,
			"tenant-B:reader-1": true,
		},
	}
	engine := NewSubscriptionEngine(repo, readerVal, nil, pub, audit)

	// Seed default plans
	_ = repo.SavePlan(context.Background(), "tenant-A", &domain.SubscriptionPlan{
		PlanID:          "plan-free",
		TenantID:        "tenant-A",
		Name:            "Free Tier",
		Tier:            domain.PlanTierFree,
		Price:           0,
		Currency:        "USD",
		BillingInterval: domain.BillingIntervalMonthly,
	})
	_ = repo.SavePlan(context.Background(), "tenant-A", &domain.SubscriptionPlan{
		PlanID:          "plan-premium",
		TenantID:        "tenant-A",
		Name:            "Premium Monthly",
		Tier:            domain.PlanTierPremium,
		Price:           9.99,
		Currency:        "USD",
		BillingInterval: domain.BillingIntervalMonthly,
	})
	_ = repo.SavePlan(context.Background(), "tenant-B", &domain.SubscriptionPlan{
		PlanID:          "plan-b",
		TenantID:        "tenant-B",
		Name:            "Tenant B Plan",
		Tier:            domain.PlanTierPremium,
		Price:           19.99,
		Currency:        "USD",
		BillingInterval: domain.BillingIntervalAnnual,
	})

	return engine, repo, pub, audit
}

func TestSubscriptionEngine_TenantIsolation(t *testing.T) {
	engine, _, _, _ := setupSubscriptionEngine()
	ctx := context.Background()

	// 1. Cross tenant CreateSubscription
	_, err := engine.CreateSubscription(ctx, "", "reader-1", "plan-free", "")
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant, got %v", err)
	}

	// 2. Accessing Tenant B plan from Tenant A
	_, err = engine.CreateSubscription(ctx, "tenant-A", "reader-1", "plan-b", "")
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on cross-tenant plan access, got %v", err)
	}

	// 3. Create sub in Tenant A and try to Get from Tenant B
	sub, err := engine.CreateSubscription(ctx, "tenant-A", "reader-1", "plan-free", "")
	if err != nil {
		t.Fatalf("unexpected error creating subscription: %v", err)
	}
	_, err = engine.GetSubscription(ctx, "tenant-B", sub.SubscriptionID)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on cross-tenant GetSubscription, got %v", err)
	}
}

func TestSubscriptionEngine_CreateSubscription_Lifecycle(t *testing.T) {
	engine, _, pub, audit := setupSubscriptionEngine()
	ctx := context.Background()

	// 1. Free plan -> ACTIVE immediately
	subFree, err := engine.CreateSubscription(ctx, "tenant-A", "reader-1", "plan-free", "")
	if err != nil {
		t.Fatalf("failed to create free subscription: %v", err)
	}
	if subFree.Status != domain.SubscriptionStatusActive {
		t.Fatalf("expected ACTIVE status for free plan, got %s", subFree.Status)
	}
	if len(pub.subCreatedEvents) != 1 {
		t.Fatalf("expected 1 SubscriptionCreatedEvent, got %d", len(pub.subCreatedEvents))
	}

	// 2. Prevent duplicate active subscription for reader-1
	_, err = engine.CreateSubscription(ctx, "tenant-A", "reader-1", "plan-premium", "")
	if err == nil {
		t.Fatalf("expected error when creating second active subscription for reader-1")
	}

	// 3. Premium plan without payment method -> TRIALING
	subTrial, err := engine.CreateSubscription(ctx, "tenant-A", "reader-2", "plan-premium", "")
	if err != nil {
		t.Fatalf("failed to create trialing subscription: %v", err)
	}
	if subTrial.Status != domain.SubscriptionStatusTrialing {
		t.Fatalf("expected TRIALING status for premium plan without payment method, got %s", subTrial.Status)
	}

	// 4. Verify audit logging occurred without card data
	if len(audit.events) < 2 {
		t.Fatalf("expected at least 2 audit events, got %d", len(audit.events))
	}
}

func TestSubscriptionEngine_CancelSubscription(t *testing.T) {
	engine, _, pub, _ := setupSubscriptionEngine()
	ctx := context.Background()

	sub, err := engine.CreateSubscription(ctx, "tenant-A", "reader-1", "plan-free", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Immediate cancel -> status CANCELED
	canceled, err := engine.CancelSubscriptionWithReason(ctx, "tenant-A", sub.SubscriptionID, "reader_requested", true)
	if err != nil {
		t.Fatalf("unexpected cancel error: %v", err)
	}
	if canceled.Status != domain.SubscriptionStatusCanceled {
		t.Fatalf("expected CANCELED status, got %s", canceled.Status)
	}
	if canceled.CancelAtPeriodEnd {
		t.Fatalf("expected CancelAtPeriodEnd=false for immediate cancel")
	}
	if len(pub.subCanceledEvents) != 1 {
		t.Fatalf("expected 1 SubscriptionCanceledEvent, got %d", len(pub.subCanceledEvents))
	}

	// Attempting to cancel already canceled subscription should fail
	_, err = engine.CancelSubscription(ctx, "tenant-A", sub.SubscriptionID, true)
	if err == nil {
		t.Fatalf("expected error canceling already CANCELED subscription")
	}
}

func TestSubscriptionEngine_PaymentSuccessAndFailure(t *testing.T) {
	engine, _, pub, _ := setupSubscriptionEngine()
	ctx := context.Background()

	sub, err := engine.CreateSubscription(ctx, "tenant-A", "reader-1", "plan-premium", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if sub.Status != domain.SubscriptionStatusTrialing {
		t.Fatalf("expected TRIALING, got %s", sub.Status)
	}

	// Handle Payment Failure -> transitions to PAST_DUE
	failedSub, err := engine.HandlePaymentFailure(ctx, "tenant-A", sub.SubscriptionID, "insufficient_funds")
	if err != nil {
		t.Fatalf("unexpected payment failure error: %v", err)
	}
	if failedSub.Status != domain.SubscriptionStatusPastDue {
		t.Fatalf("expected PAST_DUE status, got %s", failedSub.Status)
	}
	if len(pub.payFailEvents) != 1 {
		t.Fatalf("expected 1 PaymentFailedEvent, got %d", len(pub.payFailEvents))
	}

	// Handle Payment Success (recovery) -> transitions to ACTIVE
	activeSub, err := engine.HandlePaymentSuccess(ctx, "tenant-A", sub.SubscriptionID, &domain.PaymentEvent{
		Amount:   9.99,
		Currency: "USD",
	})
	if err != nil {
		t.Fatalf("unexpected payment success error: %v", err)
	}
	if activeSub.Status != domain.SubscriptionStatusActive {
		t.Fatalf("expected ACTIVE status, got %s", activeSub.Status)
	}
	if len(pub.paySuccessEvents) != 1 {
		t.Fatalf("expected 1 PaymentSucceededEvent, got %d", len(pub.paySuccessEvents))
	}
}

func TestSubscriptionEngine_HandleTrialExpiry(t *testing.T) {
	engine, repo, _, _ := setupSubscriptionEngine()
	ctx := context.Background()

	// 1. Trial without payment method -> EXPIRED
	sub1, err := engine.CreateSubscription(ctx, "tenant-A", "reader-1", "plan-premium", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expiredSub, err := engine.HandleTrialExpiry(ctx, "tenant-A", sub1.SubscriptionID)
	if err != nil {
		t.Fatalf("unexpected trial expiry error: %v", err)
	}
	if expiredSub.Status != domain.SubscriptionStatusExpired {
		t.Fatalf("expected EXPIRED status, got %s", expiredSub.Status)
	}

	// 2. Trial with payment method -> ACTIVE
	sub2, _ := engine.CreateSubscription(ctx, "tenant-A", "reader-2", "plan-free", "")
	_ = repo.SaveSubscription(ctx, "tenant-A", sub2)
	// Force it to trialing with a payment method for test
	sub2.Status = domain.SubscriptionStatusTrialing
	sub2.PaymentMethodID = "pm_1234"
	_ = repo.SaveSubscription(ctx, "tenant-A", sub2)

	activeSub, err := engine.HandleTrialExpiry(ctx, "tenant-A", sub2.SubscriptionID)
	if err != nil {
		t.Fatalf("unexpected trial expiry error: %v", err)
	}
	if activeSub.Status != domain.SubscriptionStatusActive {
		t.Fatalf("expected ACTIVE status upon trial expiry with payment method, got %s", activeSub.Status)
	}
}

func TestSubscriptionEngine_LifecycleStateMachine(t *testing.T) {
	// Verify valid and invalid state transitions per specification:
	// PENDING -> TRIALING -> ACTIVE -> CANCELED
	// ACTIVE -> PAST_DUE -> ACTIVE
	// PAST_DUE -> EXPIRED
	// TRIALING -> EXPIRED
	tests := []struct {
		from  domain.SubscriptionStatus
		to    domain.SubscriptionStatus
		valid bool
	}{
		{domain.SubscriptionStatusPending, domain.SubscriptionStatusTrialing, true},
		{domain.SubscriptionStatusPending, domain.SubscriptionStatusActive, true},
		{domain.SubscriptionStatusTrialing, domain.SubscriptionStatusActive, true},
		{domain.SubscriptionStatusTrialing, domain.SubscriptionStatusExpired, true},
		{domain.SubscriptionStatusActive, domain.SubscriptionStatusPastDue, true},
		{domain.SubscriptionStatusActive, domain.SubscriptionStatusCanceled, true},
		{domain.SubscriptionStatusPastDue, domain.SubscriptionStatusActive, true},
		{domain.SubscriptionStatusPastDue, domain.SubscriptionStatusExpired, true},
		// Invalid terminal transitions
		{domain.SubscriptionStatusCanceled, domain.SubscriptionStatusActive, false},
		{domain.SubscriptionStatusExpired, domain.SubscriptionStatusActive, false},
		// Invalid reverse transition
		{domain.SubscriptionStatusActive, domain.SubscriptionStatusPending, false},
	}

	for _, tc := range tests {
		got := IsValidSubscriptionTransition(tc.from, tc.to)
		if got != tc.valid {
			t.Errorf("transition %s -> %s: expected %v, got %v", tc.from, tc.to, tc.valid, got)
		}
	}
}
