package application

import (
	"context"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type PaywallService interface {
	CheckEntitlement(ctx context.Context, tenantID, readerID, contentID string, isPremium bool) (*domain.EntitlementCheck, error)
	GetMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error)
	IncrementMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error)
}
