package application

import (
	"context"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type RevenueAnalyticsService interface {
	RecordRevenueEvent(ctx context.Context, tenantID string, event *domain.RevenueEvent) error
	GetRevenueAggregate(ctx context.Context, tenantID string, period domain.RevenuePeriod) (*domain.RevenueAggregate, error)
	GetMRRData(ctx context.Context, tenantID string) (*domain.MRRData, error)
	GetChurnData(ctx context.Context, tenantID string) (*domain.ChurnData, error)
}
