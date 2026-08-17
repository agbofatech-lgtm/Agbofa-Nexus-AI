package application

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

var _ AdService = (*AdvertisingEngine)(nil)

// AdImpressionRepository defines an optional repository contract to fetch an existing impression by ID
// or look up recent impressions for deduplication.
type AdImpressionRepository interface {
	GetImpression(ctx context.Context, tenantID, impressionID string) (*domain.AdImpression, error)
	GetRecentImpression(ctx context.Context, tenantID, placementID, readerID string, since time.Time) (*domain.AdImpression, error)
}

// AdvertisingEngine implements the Ad Placement Engine for IMP-021 Batch 3.
// It manages ad campaigns, placement matching, deduplicated impression/click tracking,
// and revenue calculation (CPM/CPC) with strict tenant isolation.
type AdvertisingEngine struct {
	repo       AdRepository
	revService RevenueAnalyticsService
	pub        EventPublisher
	audit      AuditLogger
	mu         sync.RWMutex
	imprCache  map[string]*domain.AdImpression // memory fallback for deduplication: key = impID and tenant:placement:reader
}

// NewAdvertisingEngine creates a new AdvertisingEngine instance.
func NewAdvertisingEngine(
	repo AdRepository,
	revService RevenueAnalyticsService,
	pub EventPublisher,
	audit AuditLogger,
) *AdvertisingEngine {
	return &AdvertisingEngine{
		repo:       repo,
		revService: revService,
		pub:        pub,
		audit:      audit,
		imprCache:  make(map[string]*domain.AdImpression),
	}
}

// CreateCampaign creates a new ad campaign with DRAFT status after validation.
func (e *AdvertisingEngine) CreateCampaign(ctx context.Context, tenantID string, campaign *domain.AdCampaign) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	if campaign == nil {
		return errors.New("campaign cannot be nil")
	}
	if campaign.Budget <= 0 {
		return errors.New("campaign budget must be positive")
	}
	if !campaign.EndDate.IsZero() && campaign.EndDate.Before(campaign.StartDate) {
		return errors.New("campaign end date cannot be before start date")
	}

	campaign.TenantID = tenantID
	if campaign.CampaignID == "" {
		campaign.CampaignID = fmt.Sprintf("camp-%d", time.Now().UTC().UnixNano())
	}
	campaign.Status = domain.CampaignStatusDraft

	if err := e.repo.SaveCampaign(ctx, tenantID, campaign); err != nil {
		return err
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "CAMPAIGN_CREATED", campaign.CampaignID, fmt.Sprintf("budget=%.2f,currency=%s", campaign.Budget, campaign.Currency))
	}

	return nil
}

// ActivateCampaign transitions a campaign from DRAFT to ACTIVE status.
func (e *AdvertisingEngine) ActivateCampaign(ctx context.Context, tenantID, campaignID string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	campaign, err := e.GetCampaign(ctx, tenantID, campaignID)
	if err != nil {
		return err
	}
	if campaign.Status != domain.CampaignStatusDraft {
		return fmt.Errorf("campaign status must be DRAFT to activate, got %s", campaign.Status)
	}

	campaign.Status = domain.CampaignStatusActive
	if err := e.repo.SaveCampaign(ctx, tenantID, campaign); err != nil {
		return err
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "CAMPAIGN_ACTIVATED", campaignID, "")
	}
	return nil
}

// PauseCampaign transitions an ACTIVE campaign to PAUSED status.
func (e *AdvertisingEngine) PauseCampaign(ctx context.Context, tenantID, campaignID string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	campaign, err := e.GetCampaign(ctx, tenantID, campaignID)
	if err != nil {
		return err
	}
	if campaign.Status != domain.CampaignStatusActive {
		return fmt.Errorf("campaign status must be ACTIVE to pause, got %s", campaign.Status)
	}

	campaign.Status = domain.CampaignStatusPaused
	if err := e.repo.SaveCampaign(ctx, tenantID, campaign); err != nil {
		return err
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "CAMPAIGN_PAUSED", campaignID, "")
	}
	return nil
}

// GetCampaign retrieves an ad campaign by ID within a tenant context.
func (e *AdvertisingEngine) GetCampaign(ctx context.Context, tenantID, campaignID string) (*domain.AdCampaign, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if campaignID == "" {
		return nil, domain.ErrAdCampaignNotFound
	}
	camp, err := e.repo.GetCampaign(ctx, tenantID, campaignID)
	if err != nil || camp == nil {
		return nil, domain.ErrAdCampaignNotFound
	}
	if camp.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return camp, nil
}

// ListActiveCampaigns returns all campaigns with ACTIVE status for a tenant.
func (e *AdvertisingEngine) ListActiveCampaigns(ctx context.Context, tenantID string) ([]*domain.AdCampaign, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	camps, err := e.repo.ListActiveCampaigns(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	var res []*domain.AdCampaign
	for _, c := range camps {
		if c.TenantID == tenantID && c.Status == domain.CampaignStatusActive {
			res = append(res, c)
		}
	}
	return res, nil
}

// SelectPlacement selects an active ad campaign matching platform and topic constraints,
// creating an AdPlacement with configured CPM and CPC.
func (e *AdvertisingEngine) SelectPlacement(ctx context.Context, tenantID, contentID, platform string, readerTopics []string) (*domain.AdPlacement, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	camps, err := e.ListActiveCampaigns(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	var bestCamp *domain.AdCampaign
	for _, camp := range camps {
		if camp.Budget <= 0 {
			continue
		}
		// Match platform
		if len(camp.TargetPlatforms) > 0 {
			matchedPlatform := false
			for _, p := range camp.TargetPlatforms {
				if p == platform {
					matchedPlatform = true
					break
				}
			}
			if !matchedPlatform {
				continue
			}
		}

		// Excluded topics check
		excluded := false
		for _, ex := range camp.Constraints.ExcludedTopics {
			for _, rt := range readerTopics {
				if ex == rt {
					excluded = true
					break
				}
			}
			if excluded {
				break
			}
		}
		if excluded {
			continue
		}

		// Target topics check
		if len(camp.TargetTopics) > 0 && len(readerTopics) > 0 {
			matchedTopic := false
			for _, tt := range camp.TargetTopics {
				for _, rt := range readerTopics {
					if tt == rt {
						matchedTopic = true
						break
					}
				}
				if matchedTopic {
					break
				}
			}
			if !matchedTopic {
				continue
			}
		}

		bestCamp = camp
		break
	}

	if bestCamp == nil {
		return nil, nil
	}

	now := time.Now().UTC()
	placement := &domain.AdPlacement{
		PlacementID:   fmt.Sprintf("place-%d", now.UnixNano()),
		TenantID:      tenantID,
		CampaignID:    bestCamp.CampaignID,
		ContentID:     contentID,
		Platform:      platform,
		PlacementType: domain.PlacementTypeBanner,
		CPM:           5.00, // Configurable default CPM
		CPC:           0.50, // Configurable default CPC
		Status:        "ACTIVE",
		CreatedAt:     now,
	}

	if err := e.repo.SavePlacement(ctx, tenantID, placement); err != nil {
		return nil, err
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "PLACEMENT_SELECTED", placement.PlacementID, fmt.Sprintf("campaign_id=%s,content_id=%s", bestCamp.CampaignID, contentID))
	}

	return placement, nil
}

// RecordImpression records an ad impression, deduplicating within 1 hour per reader+placement,
// and attributing CPM / 1000 revenue.
func (e *AdvertisingEngine) RecordImpression(ctx context.Context, tenantID, placementID, readerID string) (*domain.AdImpression, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	now := time.Now().UTC()
	oneHourAgo := now.Add(-1 * time.Hour)

	// Deduplication check
	dedupKey := fmt.Sprintf("impr:%s:%s:%s", tenantID, placementID, readerID)
	if ir, ok := e.repo.(AdImpressionRepository); ok {
		if existing, err := ir.GetRecentImpression(ctx, tenantID, placementID, readerID, oneHourAgo); err == nil && existing != nil {
			return existing, nil
		}
	} else {
		e.mu.RLock()
		existing, ok := e.imprCache[dedupKey]
		e.mu.RUnlock()
		if ok && existing.ServedAt.After(oneHourAgo) {
			return existing, nil
		}
	}

	placement, err := e.repo.GetPlacement(ctx, tenantID, placementID)
	if err != nil || placement == nil {
		return nil, domain.ErrAdPlacementNotFound
	}

	revenue := placement.CPM * (1.0 / 1000.0)
	imp := &domain.AdImpression{
		ImpressionID: fmt.Sprintf("imp-%d", now.UnixNano()),
		TenantID:     tenantID,
		PlacementID:  placementID,
		ReaderID:     readerID,
		ServedAt:     now,
		Clicked:      false,
		Revenue:      revenue,
		Currency:     "USD",
	}

	if err := e.repo.RecordImpression(ctx, tenantID, imp); err != nil {
		return nil, err
	}

	e.mu.Lock()
	e.imprCache[dedupKey] = imp
	e.imprCache[imp.ImpressionID] = imp
	e.mu.Unlock()

	if e.pub != nil {
		evt := &domain.AdImpressionEvent{
			EventID:     fmt.Sprintf("evt-%d", now.UnixNano()),
			TenantID:    tenantID,
			PlacementID: placementID,
			CampaignID:  placement.CampaignID,
			ReaderID:    readerID,
			Revenue:     revenue,
			Currency:    "USD",
			OccurredAt:  now,
		}
		_ = e.pub.PublishAdImpression(ctx, evt)
	}

	if e.revService != nil && revenue > 0 {
		_ = e.revService.RecordRevenueEvent(ctx, tenantID, &domain.RevenueEvent{
			EventID:    fmt.Sprintf("rev-%d", now.UnixNano()),
			TenantID:   tenantID,
			EventType:  domain.RevenueEventTypeAdImpression,
			Amount:     revenue,
			Currency:   "USD",
			RelatedID:  placementID,
			OccurredAt: now,
		})
	}

	return imp, nil
}

// RecordClick records a click on an existing impression, deduplicating clicks per impression,
// and attributing CPC revenue.
func (e *AdvertisingEngine) RecordClick(ctx context.Context, tenantID, impressionID string) (*domain.AdImpression, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	var imp *domain.AdImpression
	if ir, ok := e.repo.(AdImpressionRepository); ok {
		var err error
		imp, err = ir.GetImpression(ctx, tenantID, impressionID)
		if err != nil || imp == nil {
			return nil, errors.New("impression not found")
		}
	} else {
		e.mu.RLock()
		cached, exists := e.imprCache[impressionID]
		e.mu.RUnlock()
		if !exists || cached == nil {
			return nil, errors.New("impression not found")
		}
		imp = cached
	}

	if imp.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}

	// Deduplicate: already clicked -> skip
	if imp.Clicked {
		return imp, nil
	}

	placement, err := e.repo.GetPlacement(ctx, tenantID, imp.PlacementID)
	if err != nil || placement == nil {
		return nil, domain.ErrAdPlacementNotFound
	}

	now := time.Now().UTC()
	imp.Clicked = true
	imp.ClickedAt = &now
	imp.Revenue += placement.CPC

	if err := e.repo.RecordImpression(ctx, tenantID, imp); err != nil {
		return nil, err
	}

	e.mu.Lock()
	e.imprCache[imp.ImpressionID] = imp
	e.mu.Unlock()

	if e.pub != nil {
		evt := &domain.AdClickEvent{
			EventID:     fmt.Sprintf("evt-%d", now.UnixNano()),
			TenantID:    tenantID,
			PlacementID: imp.PlacementID,
			CampaignID:  placement.CampaignID,
			ReaderID:    imp.ReaderID,
			Revenue:     placement.CPC,
			Currency:    "USD",
			OccurredAt:  now,
		}
		_ = e.pub.PublishAdClick(ctx, evt)
	}

	if e.revService != nil && placement.CPC > 0 {
		_ = e.revService.RecordRevenueEvent(ctx, tenantID, &domain.RevenueEvent{
			EventID:    fmt.Sprintf("rev-%d", now.UnixNano()),
			TenantID:   tenantID,
			EventType:  domain.RevenueEventTypeAdClick,
			Amount:     placement.CPC,
			Currency:   "USD",
			RelatedID:  imp.PlacementID,
			OccurredAt: now,
		})
	}

	return imp, nil
}
