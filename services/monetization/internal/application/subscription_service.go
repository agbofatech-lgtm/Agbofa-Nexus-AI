package application

import (
	"context"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type SubscriptionService interface {
	CreateSubscription(ctx context.Context, tenantID, readerID, planID, paymentMethodID string) (*domain.ReaderSubscription, error)
	GetSubscription(ctx context.Context, tenantID, subscriptionID string) (*domain.ReaderSubscription, error)
	GetActiveSubscriptionByReader(ctx context.Context, tenantID, readerID string) (*domain.ReaderSubscription, error)
	CancelSubscription(ctx context.Context, tenantID, subscriptionID string, immediate bool) (*domain.ReaderSubscription, error)
	ListPlans(ctx context.Context, tenantID string) ([]*domain.SubscriptionPlan, error)
	GetPlan(ctx context.Context, tenantID, planID string) (*domain.SubscriptionPlan, error)
}
