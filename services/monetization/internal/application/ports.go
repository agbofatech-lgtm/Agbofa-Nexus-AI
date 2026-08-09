package application

import (
	"context"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

// EventPublisher defines the authoritative event emission contract for monetization events.
type EventPublisher interface {
	PublishSubscriptionCreated(ctx context.Context, event *domain.SubscriptionCreatedEvent) error
	PublishSubscriptionCanceled(ctx context.Context, event *domain.SubscriptionCanceledEvent) error
	PublishPaymentSucceeded(ctx context.Context, event *domain.PaymentSucceededEvent) error
	PublishPaymentFailed(ctx context.Context, event *domain.PaymentFailedEvent) error
	PublishPaywallTriggered(ctx context.Context, event *domain.PaywallTriggeredEvent) error
	PublishAdImpression(ctx context.Context, event *domain.AdImpressionEvent) error
	PublishAdClick(ctx context.Context, event *domain.AdClickEvent) error
	PublishRevenueAggregated(ctx context.Context, event *domain.RevenueAggregatedEvent) error
}

// AuditLogger defines the security and compliance auditing contract for monetization actions.
type AuditLogger interface {
	LogEvent(ctx context.Context, tenantID, action, resource, details string) error
}

// ReaderValidator defines the reader identity validation contract against IMP-019 reader identity
// without duplicating reader profile state or tables.
type ReaderValidator interface {
	ValidateReaderIdentity(ctx context.Context, tenantID, readerID string) error
}
