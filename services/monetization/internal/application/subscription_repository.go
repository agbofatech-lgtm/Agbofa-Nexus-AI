package application

import (
	"context"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type SubscriptionRepository interface {
	SaveSubscription(ctx context.Context, tenantID string, sub *domain.ReaderSubscription) error
	GetSubscription(ctx context.Context, tenantID, subscriptionID string) (*domain.ReaderSubscription, error)
	GetActiveSubscriptionByReader(ctx context.Context, tenantID, readerID string) (*domain.ReaderSubscription, error)
	ListSubscriptions(ctx context.Context, tenantID string) ([]*domain.ReaderSubscription, error)
	SavePlan(ctx context.Context, tenantID string, plan *domain.SubscriptionPlan) error
	GetPlan(ctx context.Context, tenantID, planID string) (*domain.SubscriptionPlan, error)
	ListPlans(ctx context.Context, tenantID string) ([]*domain.SubscriptionPlan, error)
}
