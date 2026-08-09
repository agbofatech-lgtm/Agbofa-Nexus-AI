package application

import (
	"context"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type AdService interface {
	CreateCampaign(ctx context.Context, tenantID string, campaign *domain.AdCampaign) error
	GetCampaign(ctx context.Context, tenantID, campaignID string) (*domain.AdCampaign, error)
	ListActiveCampaigns(ctx context.Context, tenantID string) ([]*domain.AdCampaign, error)
	SelectPlacement(ctx context.Context, tenantID, contentID, platform string, readerTopics []string) (*domain.AdPlacement, error)
	RecordImpression(ctx context.Context, tenantID, placementID, readerID string) (*domain.AdImpression, error)
	RecordClick(ctx context.Context, tenantID, impressionID string) (*domain.AdImpression, error)
}
