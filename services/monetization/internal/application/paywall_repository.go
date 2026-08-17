package application

import (
	"context"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type PaywallRepository interface {
	SaveEntitlement(ctx context.Context, tenantID string, ent *domain.PaywallEntitlement) error
	GetEntitlement(ctx context.Context, tenantID, readerID, contentID string) (*domain.PaywallEntitlement, error)
	GetMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error)
	IncrementMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error)
}
