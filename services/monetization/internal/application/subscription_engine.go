package application

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

var _ SubscriptionService = (*SubscriptionEngine)(nil)

// SubscriptionEngine implements the core Subscription Management Engine for IMP-021 Batch 2.
// It manages reader subscriptions, billing periods, and lifecycle state transitions while
// enforcing tenant isolation and publishing events without storing raw payment credentials.
type SubscriptionEngine struct {
	repo            SubscriptionRepository
	readerVal       ReaderValidator
	paymentProvider domain.PaymentProvider
	pub             EventPublisher
	audit           AuditLogger
}

// NewSubscriptionEngine creates a new SubscriptionEngine instance.
func NewSubscriptionEngine(
	repo SubscriptionRepository,
	readerVal ReaderValidator,
	paymentProvider domain.PaymentProvider,
	pub EventPublisher,
	audit AuditLogger,
) *SubscriptionEngine {
	return &SubscriptionEngine{
		repo:            repo,
		readerVal:       readerVal,
		paymentProvider: paymentProvider,
		pub:             pub,
		audit:           audit,
	}
}

// IsValidSubscriptionTransition verifies if a status change follows the authoritative state machine:
//
//	PENDING → TRIALING → ACTIVE → CANCELED
//	ACTIVE → PAST_DUE → ACTIVE (on payment recovery)
//	PAST_DUE → EXPIRED (after grace period)
//	TRIALING → EXPIRED (no payment method at expiry)
func IsValidSubscriptionTransition(from, to domain.SubscriptionStatus) bool {
	if from == to {
		return true
	}
	switch from {
	case domain.SubscriptionStatusPending:
		return to == domain.SubscriptionStatusTrialing ||
			to == domain.SubscriptionStatusActive ||
			to == domain.SubscriptionStatusCanceled
	case domain.SubscriptionStatusTrialing:
		return to == domain.SubscriptionStatusActive ||
			to == domain.SubscriptionStatusExpired ||
			to == domain.SubscriptionStatusCanceled ||
			to == domain.SubscriptionStatusPastDue
	case domain.SubscriptionStatusActive:
		return to == domain.SubscriptionStatusPastDue ||
			to == domain.SubscriptionStatusCanceled ||
			to == domain.SubscriptionStatusExpired
	case domain.SubscriptionStatusPastDue:
		return to == domain.SubscriptionStatusActive ||
			to == domain.SubscriptionStatusExpired ||
			to == domain.SubscriptionStatusCanceled
	case domain.SubscriptionStatusCanceled:
		return false
	case domain.SubscriptionStatusExpired:
		return false
	default:
		return false
	}
}

// CreateSubscription creates a new ReaderSubscription in TRIALING or ACTIVE state.
func (e *SubscriptionEngine) CreateSubscription(ctx context.Context, tenantID, readerID, planID, paymentMethodID string) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if readerID == "" {
		return nil, errors.New("reader_id cannot be empty")
	}
	if e.readerVal != nil {
		if err := e.readerVal.ValidateReaderIdentity(ctx, tenantID, readerID); err != nil {
			return nil, fmt.Errorf("reader identity validation failed: %w", err)
		}
	}

	existing, err := e.GetActiveSubscriptionByReader(ctx, tenantID, readerID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("reader already has an active subscription")
	}

	plan, err := e.GetPlan(ctx, tenantID, planID)
	if err != nil {
		return nil, err
	}

	status := domain.SubscriptionStatusActive
	if plan.Price > 0 && paymentMethodID == "" {
		status = domain.SubscriptionStatusTrialing
	}

	now := time.Now().UTC()
	periodStart := now
	var periodEnd time.Time
	if plan.BillingInterval == domain.BillingIntervalAnnual {
		periodEnd = now.AddDate(1, 0, 0)
	} else {
		periodEnd = now.AddDate(0, 1, 0)
	}

	subID := fmt.Sprintf("sub-%d", now.UnixNano())
	sub := &domain.ReaderSubscription{
		SubscriptionID:     subID,
		TenantID:           tenantID,
		ReaderID:           readerID,
		PlanID:             planID,
		Status:             status,
		CurrentPeriodStart: periodStart,
		CurrentPeriodEnd:   periodEnd,
		CancelAtPeriodEnd:  false,
		PaymentMethodID:    paymentMethodID,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	if err := e.repo.SaveSubscription(ctx, tenantID, sub); err != nil {
		return nil, err
	}

	if e.pub != nil {
		event := &domain.SubscriptionCreatedEvent{
			EventID:        fmt.Sprintf("evt-%d", now.UnixNano()),
			TenantID:       tenantID,
			SubscriptionID: sub.SubscriptionID,
			ReaderID:       readerID,
			PlanID:         planID,
			Tier:           plan.Tier,
			Amount:         plan.Price,
			Currency:       plan.Currency,
			OccurredAt:     now,
		}
		_ = e.pub.PublishSubscriptionCreated(ctx, event)
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "SUBSCRIPTION_CREATED", sub.SubscriptionID, fmt.Sprintf("reader_id=%s,plan_id=%s,status=%s,amount=%.2f,currency=%s", readerID, planID, status, plan.Price, plan.Currency))
	}

	return sub, nil
}

// GetSubscription retrieves a subscription by ID within the tenant context.
func (e *SubscriptionEngine) GetSubscription(ctx context.Context, tenantID, subscriptionID string) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if subscriptionID == "" {
		return nil, domain.ErrSubscriptionNotFound
	}
	sub, err := e.repo.GetSubscription(ctx, tenantID, subscriptionID)
	if err != nil || sub == nil {
		return nil, domain.ErrSubscriptionNotFound
	}
	if sub.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return sub, nil
}

// GetActiveSubscriptionByReader retrieves an ACTIVE or TRIALING subscription for a reader.
// Returns nil without error if no active subscription exists.
func (e *SubscriptionEngine) GetActiveSubscriptionByReader(ctx context.Context, tenantID, readerID string) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if readerID == "" {
		return nil, nil
	}
	sub, err := e.repo.GetActiveSubscriptionByReader(ctx, tenantID, readerID)
	if err != nil || sub == nil {
		return nil, nil
	}
	if sub.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	if sub.Status != domain.SubscriptionStatusActive && sub.Status != domain.SubscriptionStatusTrialing {
		return nil, nil
	}
	return sub, nil
}

// GetLatestSubscriptionStatusByReader retrieves the most recent subscription status for a reader,
// including terminal states such as EXPIRED or CANCELED.
func (e *SubscriptionEngine) GetLatestSubscriptionStatusByReader(ctx context.Context, tenantID, readerID string) (domain.SubscriptionStatus, error) {
	if tenantID == "" {
		return "", domain.ErrCrossTenantViolation
	}
	if readerID == "" {
		return "", nil
	}
	subs, err := e.repo.ListSubscriptions(ctx, tenantID)
	if err != nil {
		return "", err
	}
	var latest *domain.ReaderSubscription
	for _, sub := range subs {
		if sub.TenantID == tenantID && sub.ReaderID == readerID {
			if latest == nil || sub.UpdatedAt.After(latest.UpdatedAt) || sub.CreatedAt.After(latest.CreatedAt) {
				latest = sub
			}
		}
	}
	if latest == nil {
		return "", nil
	}
	return latest.Status, nil
}

// CancelSubscription cancels a subscription either immediately or at period end, using default reason.
func (e *SubscriptionEngine) CancelSubscription(ctx context.Context, tenantID, subscriptionID string, immediate bool) (*domain.ReaderSubscription, error) {
	return e.CancelSubscriptionWithReason(ctx, tenantID, subscriptionID, "user_requested", immediate)
}

// CancelSubscriptionWithReason cancels a subscription with an explicit reason string.
func (e *SubscriptionEngine) CancelSubscriptionWithReason(ctx context.Context, tenantID, subscriptionID, reason string, immediate bool) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	sub, err := e.GetSubscription(ctx, tenantID, subscriptionID)
	if err != nil {
		return nil, err
	}
	if sub.Status != domain.SubscriptionStatusActive &&
		sub.Status != domain.SubscriptionStatusTrialing &&
		sub.Status != domain.SubscriptionStatusPastDue {
		return nil, errors.New("subscription is not in a cancellable state")
	}

	if immediate {
		if !IsValidSubscriptionTransition(sub.Status, domain.SubscriptionStatusCanceled) {
			return nil, errors.New("invalid subscription status transition to CANCELED")
		}
		sub.Status = domain.SubscriptionStatusCanceled
		sub.CancelAtPeriodEnd = false
	} else {
		sub.CancelAtPeriodEnd = true
	}
	sub.UpdatedAt = time.Now().UTC()

	if err := e.repo.SaveSubscription(ctx, tenantID, sub); err != nil {
		return nil, err
	}

	if e.pub != nil {
		event := &domain.SubscriptionCanceledEvent{
			EventID:        fmt.Sprintf("evt-%d", time.Now().UTC().UnixNano()),
			TenantID:       tenantID,
			SubscriptionID: sub.SubscriptionID,
			ReaderID:       sub.ReaderID,
			Reason:         reason,
			OccurredAt:     time.Now().UTC(),
		}
		_ = e.pub.PublishSubscriptionCanceled(ctx, event)
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "SUBSCRIPTION_CANCELED", sub.SubscriptionID, fmt.Sprintf("reader_id=%s,reason=%s,immediate=%v", sub.ReaderID, reason, immediate))
	}

	return sub, nil
}

// HandlePaymentSuccess updates subscription status to ACTIVE, advances period, and emits PaymentSucceededEvent.
func (e *SubscriptionEngine) HandlePaymentSuccess(ctx context.Context, tenantID, subscriptionID string, paymentEvent *domain.PaymentEvent) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	sub, err := e.GetSubscription(ctx, tenantID, subscriptionID)
	if err != nil {
		return nil, err
	}
	if !IsValidSubscriptionTransition(sub.Status, domain.SubscriptionStatusActive) {
		return nil, errors.New("invalid subscription status transition to ACTIVE")
	}

	sub.Status = domain.SubscriptionStatusActive
	now := time.Now().UTC()
	sub.CurrentPeriodStart = now
	plan, _ := e.repo.GetPlan(ctx, tenantID, sub.PlanID)
	if plan != nil && plan.BillingInterval == domain.BillingIntervalAnnual {
		sub.CurrentPeriodEnd = now.AddDate(1, 0, 0)
	} else {
		sub.CurrentPeriodEnd = now.AddDate(0, 1, 0)
	}
	sub.UpdatedAt = now

	if err := e.repo.SaveSubscription(ctx, tenantID, sub); err != nil {
		return nil, err
	}

	amount := 0.0
	currency := "USD"
	providerEventID := ""
	if paymentEvent != nil {
		amount = paymentEvent.Amount
		currency = paymentEvent.Currency
		providerEventID = paymentEvent.ProviderEventID
	} else if plan != nil {
		amount = plan.Price
		currency = plan.Currency
	}

	if e.pub != nil {
		evt := &domain.PaymentSucceededEvent{
			EventID:         fmt.Sprintf("evt-%d", now.UnixNano()),
			TenantID:        tenantID,
			SubscriptionID:  sub.SubscriptionID,
			Amount:          amount,
			Currency:        currency,
			ProviderEventID: providerEventID,
			OccurredAt:      now,
		}
		_ = e.pub.PublishPaymentSucceeded(ctx, evt)
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "PAYMENT_SUCCEEDED", sub.SubscriptionID, fmt.Sprintf("amount=%.2f,currency=%s", amount, currency))
	}

	return sub, nil
}

// HandlePaymentFailure transitions status to PAST_DUE and emits PaymentFailedEvent.
func (e *SubscriptionEngine) HandlePaymentFailure(ctx context.Context, tenantID, subscriptionID, failureReason string) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	sub, err := e.GetSubscription(ctx, tenantID, subscriptionID)
	if err != nil {
		return nil, err
	}
	if !IsValidSubscriptionTransition(sub.Status, domain.SubscriptionStatusPastDue) {
		return nil, errors.New("invalid subscription status transition to PAST_DUE")
	}

	sub.Status = domain.SubscriptionStatusPastDue
	sub.UpdatedAt = time.Now().UTC()

	if err := e.repo.SaveSubscription(ctx, tenantID, sub); err != nil {
		return nil, err
	}

	amount := 0.0
	currency := "USD"
	plan, _ := e.repo.GetPlan(ctx, tenantID, sub.PlanID)
	if plan != nil {
		amount = plan.Price
		currency = plan.Currency
	}

	if e.pub != nil {
		evt := &domain.PaymentFailedEvent{
			EventID:        fmt.Sprintf("evt-%d", time.Now().UTC().UnixNano()),
			TenantID:       tenantID,
			SubscriptionID: sub.SubscriptionID,
			Amount:         amount,
			Currency:       currency,
			FailureReason:  failureReason,
			OccurredAt:     time.Now().UTC(),
		}
		_ = e.pub.PublishPaymentFailed(ctx, evt)
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "PAYMENT_FAILED", sub.SubscriptionID, fmt.Sprintf("amount=%.2f,currency=%s,reason=%s", amount, currency, failureReason))
	}

	return sub, nil
}

// HandleTrialExpiry checks if a payment method exists upon trial expiration.
// If payment method exists: attempt payment, transition to ACTIVE or PAST_DUE.
// If no payment method: transition to EXPIRED.
func (e *SubscriptionEngine) HandleTrialExpiry(ctx context.Context, tenantID, subscriptionID string) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	sub, err := e.GetSubscription(ctx, tenantID, subscriptionID)
	if err != nil {
		return nil, err
	}
	if sub.Status != domain.SubscriptionStatusTrialing {
		return nil, errors.New("subscription is not in TRIALING status")
	}

	now := time.Now().UTC()
	var newStatus domain.SubscriptionStatus
	if sub.PaymentMethodID != "" {
		chargeSuccess := true
		if e.paymentProvider != nil {
			plan, _ := e.repo.GetPlan(ctx, tenantID, sub.PlanID)
			amount := 0.0
			currency := "USD"
			if plan != nil {
				amount = plan.Price
				currency = plan.Currency
			}
			_, err := e.paymentProvider.InitializePayment(ctx, tenantID, amount, currency, map[string]string{
				"subscription_id": sub.SubscriptionID,
				"reader_id":       sub.ReaderID,
			})
			if err != nil {
				chargeSuccess = false
			}
		}
		if chargeSuccess {
			newStatus = domain.SubscriptionStatusActive
			plan, _ := e.repo.GetPlan(ctx, tenantID, sub.PlanID)
			sub.CurrentPeriodStart = now
			if plan != nil && plan.BillingInterval == domain.BillingIntervalAnnual {
				sub.CurrentPeriodEnd = now.AddDate(1, 0, 0)
			} else {
				sub.CurrentPeriodEnd = now.AddDate(0, 1, 0)
			}
		} else {
			newStatus = domain.SubscriptionStatusPastDue
		}
	} else {
		newStatus = domain.SubscriptionStatusExpired
	}

	if !IsValidSubscriptionTransition(sub.Status, newStatus) {
		return nil, fmt.Errorf("invalid subscription status transition from %s to %s", sub.Status, newStatus)
	}

	sub.Status = newStatus
	sub.UpdatedAt = now
	if err := e.repo.SaveSubscription(ctx, tenantID, sub); err != nil {
		return nil, err
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "TRIAL_EXPIRED", sub.SubscriptionID, fmt.Sprintf("new_status=%s", sub.Status))
	}

	return sub, nil
}

// TransitionStatus performs a validated lifecycle status transition.
func (e *SubscriptionEngine) TransitionStatus(ctx context.Context, tenantID, subscriptionID string, newStatus domain.SubscriptionStatus) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	sub, err := e.GetSubscription(ctx, tenantID, subscriptionID)
	if err != nil {
		return nil, err
	}
	if !IsValidSubscriptionTransition(sub.Status, newStatus) {
		return nil, fmt.Errorf("invalid subscription status transition from %s to %s", sub.Status, newStatus)
	}
	sub.Status = newStatus
	sub.UpdatedAt = time.Now().UTC()
	if err := e.repo.SaveSubscription(ctx, tenantID, sub); err != nil {
		return nil, err
	}
	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "SUBSCRIPTION_STATUS_TRANSITIONED", sub.SubscriptionID, fmt.Sprintf("new_status=%s", newStatus))
	}
	return sub, nil
}

// ListPlans lists all active plans for a tenant.
func (e *SubscriptionEngine) ListPlans(ctx context.Context, tenantID string) ([]*domain.SubscriptionPlan, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	plans, err := e.repo.ListPlans(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	var res []*domain.SubscriptionPlan
	for _, p := range plans {
		if p.TenantID == tenantID {
			res = append(res, p)
		}
	}
	return res, nil
}

// GetPlan retrieves a single plan by ID within a tenant context.
func (e *SubscriptionEngine) GetPlan(ctx context.Context, tenantID, planID string) (*domain.SubscriptionPlan, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if planID == "" {
		return nil, domain.ErrPlanNotFound
	}
	plan, err := e.repo.GetPlan(ctx, tenantID, planID)
	if err != nil || plan == nil {
		return nil, domain.ErrPlanNotFound
	}
	if plan.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return plan, nil
}
