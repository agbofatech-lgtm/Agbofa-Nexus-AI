package application

import (
	"context"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type AdRepository interface {
	SaveCampaign(ctx context.Context, tenantID string, campaign *domain.AdCampaign) error
	GetCampaign(ctx context.Context, tenantID, campaignID string) (*domain.AdCampaign, error)
	ListActiveCampaigns(ctx context.Context, tenantID string) ([]*domain.AdCampaign, error)
	SavePlacement(ctx context.Context, tenantID string, placement *domain.AdPlacement) error
	GetPlacement(ctx context.Context, tenantID, placementID string) (*domain.AdPlacement, error)
	RecordImpression(ctx context.Context, tenantID string, imp *domain.AdImpression) error
}
