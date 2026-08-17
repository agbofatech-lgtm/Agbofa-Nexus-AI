package application

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type mockAdRepository struct {
	mu         sync.Mutex
	campaigns  map[string]*domain.AdCampaign
	placements map[string]*domain.AdPlacement
	impressions map[string]*domain.AdImpression
}

func newMockAdRepository() *mockAdRepository {
	return &mockAdRepository{
		campaigns:   make(map[string]*domain.AdCampaign),
		placements:  make(map[string]*domain.AdPlacement),
		impressions: make(map[string]*domain.AdImpression),
	}
}

func (m *mockAdRepository) SaveCampaign(ctx context.Context, tenantID string, campaign *domain.AdCampaign) error {
	if tenantID == "" || campaign.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.campaigns[campaign.CampaignID] = campaign
	return nil
}

func (m *mockAdRepository) GetCampaign(ctx context.Context, tenantID, campaignID string) (*domain.AdCampaign, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	camp, ok := m.campaigns[campaignID]
	if !ok {
		return nil, domain.ErrAdCampaignNotFound
	}
	if camp.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return camp, nil
}

func (m *mockAdRepository) ListActiveCampaigns(ctx context.Context, tenantID string) ([]*domain.AdCampaign, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var list []*domain.AdCampaign
	for _, c := range m.campaigns {
		if c.TenantID == tenantID && c.Status == domain.CampaignStatusActive {
			list = append(list, c)
		}
	}
	return list, nil
}

func (m *mockAdRepository) SavePlacement(ctx context.Context, tenantID string, placement *domain.AdPlacement) error {
	if tenantID == "" || placement.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.placements[placement.PlacementID] = placement
	return nil
}

func (m *mockAdRepository) GetPlacement(ctx context.Context, tenantID, placementID string) (*domain.AdPlacement, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.placements[placementID]
	if !ok {
		return nil, domain.ErrAdPlacementNotFound
	}
	if p.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return p, nil
}

func (m *mockAdRepository) RecordImpression(ctx context.Context, tenantID string, imp *domain.AdImpression) error {
	if tenantID == "" || imp.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.impressions[imp.ImpressionID] = imp
	return nil
}

func (m *mockAdRepository) GetImpression(ctx context.Context, tenantID, impressionID string) (*domain.AdImpression, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	imp, ok := m.impressions[impressionID]
	if !ok {
		return nil, errors.New("impression not found")
	}
	if imp.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return imp, nil
}

func (m *mockAdRepository) GetRecentImpression(ctx context.Context, tenantID, placementID, readerID string, since time.Time) (*domain.AdImpression, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, imp := range m.impressions {
		if imp.TenantID == tenantID && imp.PlacementID == placementID && imp.ReaderID == readerID {
			if imp.ServedAt.After(since) {
				return imp, nil
			}
		}
	}
	return nil, nil
}

type mockAdEventPublisher struct {
	impressions []*domain.AdImpressionEvent
	clicks      []*domain.AdClickEvent
}

func (m *mockAdEventPublisher) PublishSubscriptionCreated(ctx context.Context, event *domain.SubscriptionCreatedEvent) error { return nil }
func (m *mockAdEventPublisher) PublishSubscriptionCanceled(ctx context.Context, event *domain.SubscriptionCanceledEvent) error { return nil }
func (m *mockAdEventPublisher) PublishPaymentSucceeded(ctx context.Context, event *domain.PaymentSucceededEvent) error     { return nil }
func (m *mockAdEventPublisher) PublishPaymentFailed(ctx context.Context, event *domain.PaymentFailedEvent) error        { return nil }
func (m *mockAdEventPublisher) PublishPaywallTriggered(ctx context.Context, event *domain.PaywallTriggeredEvent) error  { return nil }
func (m *mockAdEventPublisher) PublishAdImpression(ctx context.Context, event *domain.AdImpressionEvent) error {
	m.impressions = append(m.impressions, event)
	return nil
}
func (m *mockAdEventPublisher) PublishAdClick(ctx context.Context, event *domain.AdClickEvent) error {
	m.clicks = append(m.clicks, event)
	return nil
}
func (m *mockAdEventPublisher) PublishRevenueAggregated(ctx context.Context, event *domain.RevenueAggregatedEvent) error { return nil }

func setupAdvertisingEngine() (*AdvertisingEngine, *mockAdRepository, *mockAdEventPublisher, *mockAuditLogger) {
	repo := newMockAdRepository()
	pub := &mockAdEventPublisher{}
	audit := &mockAuditLogger{}
	engine := NewAdvertisingEngine(repo, nil, pub, audit)
	return engine, repo, pub, audit
}

func TestAdvertisingEngine_TenantIsolation(t *testing.T) {
	engine, _, _, _ := setupAdvertisingEngine()
	ctx := context.Background()

	err := engine.CreateCampaign(ctx, "", &domain.AdCampaign{Name: "Camp 1", Budget: 100})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant, got %v", err)
	}

	_, err = engine.GetCampaign(ctx, "tenant-B", "camp-123")
	if !errors.Is(err, domain.ErrAdCampaignNotFound) {
		t.Fatalf("expected ErrAdCampaignNotFound on non-existent campaign, got %v", err)
	}
}

func TestAdvertisingEngine_CampaignLifecycle(t *testing.T) {
	engine, _, _, _ := setupAdvertisingEngine()
	ctx := context.Background()

	camp := &domain.AdCampaign{
		Name:     "Q3 Launch",
		Budget:   1000,
		Currency: "USD",
	}
	err := engine.CreateCampaign(ctx, "tenant-A", camp)
	if err != nil {
		t.Fatalf("unexpected CreateCampaign error: %v", err)
	}
	if camp.Status != domain.CampaignStatusDraft {
		t.Fatalf("expected DRAFT status, got %s", camp.Status)
	}

	err = engine.ActivateCampaign(ctx, "tenant-A", camp.CampaignID)
	if err != nil {
		t.Fatalf("unexpected activate error: %v", err)
	}
	got, _ := engine.GetCampaign(ctx, "tenant-A", camp.CampaignID)
	if got.Status != domain.CampaignStatusActive {
		t.Fatalf("expected ACTIVE status, got %s", got.Status)
	}

	err = engine.PauseCampaign(ctx, "tenant-A", camp.CampaignID)
	if err != nil {
		t.Fatalf("unexpected pause error: %v", err)
	}
	got, _ = engine.GetCampaign(ctx, "tenant-A", camp.CampaignID)
	if got.Status != domain.CampaignStatusPaused {
		t.Fatalf("expected PAUSED status, got %s", got.Status)
	}
}

func TestAdvertisingEngine_PlacementSelection(t *testing.T) {
	engine, repo, _, _ := setupAdvertisingEngine()
	ctx := context.Background()

	// Active campaign target_platforms=[web], excluded_topics=[gambling]
	camp := &domain.AdCampaign{
		CampaignID:      "camp-safe",
		TenantID:        "tenant-A",
		Name:            "Safe Ads",
		Budget:          500,
		TargetPlatforms: []string{"web"},
		Constraints: domain.AdvertiserConstraints{
			ExcludedTopics: []string{"gambling"},
		},
		Status: domain.CampaignStatusActive,
	}
	_ = repo.SaveCampaign(ctx, "tenant-A", camp)

	// 1. Excluded topic -> should return nil
	placementExcluded, err := engine.SelectPlacement(ctx, "tenant-A", "content-1", "web", []string{"news", "gambling"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if placementExcluded != nil {
		t.Fatalf("expected nil placement when excluded topic matches, got %v", placementExcluded)
	}

	// 2. Matching platform and topics -> should select placement
	placementMatch, err := engine.SelectPlacement(ctx, "tenant-A", "content-2", "web", []string{"tech"})
	if err != nil || placementMatch == nil {
		t.Fatalf("expected placement selection, got err=%v placement=%v", err, placementMatch)
	}
	if placementMatch.CampaignID != "camp-safe" {
		t.Fatalf("expected campaign camp-safe, got %s", placementMatch.CampaignID)
	}
}

func TestAdvertisingEngine_ImpressionAndClickDeduplication(t *testing.T) {
	engine, repo, pub, _ := setupAdvertisingEngine()
	ctx := context.Background()

	placement := &domain.AdPlacement{
		PlacementID: "place-1",
		TenantID:    "tenant-A",
		CampaignID:  "camp-1",
		CPM:         10.00, // CPM = 10 -> impression revenue = 0.01
		CPC:         0.50,  // CPC = 0.50
	}
	_ = repo.SavePlacement(ctx, "tenant-A", placement)

	// 1. First impression -> recorded
	imp1, err := engine.RecordImpression(ctx, "tenant-A", "place-1", "reader-10")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if imp1.Revenue != 0.01 {
		t.Fatalf("expected revenue 0.01 (CPM/1000), got %f", imp1.Revenue)
	}
	if len(pub.impressions) != 1 {
		t.Fatalf("expected 1 AdImpressionEvent, got %d", len(pub.impressions))
	}

	// 2. Duplicate impression within 1 hour -> deduplicated (returns existing)
	imp2, err := engine.RecordImpression(ctx, "tenant-A", "place-1", "reader-10")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if imp2.ImpressionID != imp1.ImpressionID {
		t.Fatalf("expected deduplication to return identical impression ID")
	}
	if len(pub.impressions) != 1 {
		t.Fatalf("expected no additional AdImpressionEvent on duplicate, got %d", len(pub.impressions))
	}

	// 3. Record Click -> adds CPC
	click1, err := engine.RecordClick(ctx, "tenant-A", imp1.ImpressionID)
	if err != nil {
		t.Fatalf("unexpected click error: %v", err)
	}
	if !click1.Clicked {
		t.Fatalf("expected Clicked=true")
	}
	if click1.Revenue != 0.51 { // 0.01 + 0.50 CPC
		t.Fatalf("expected revenue 0.51, got %f", click1.Revenue)
	}

	// 4. Duplicate Click -> deduplicated
	click2, err := engine.RecordClick(ctx, "tenant-A", imp1.ImpressionID)
	if err != nil {
		t.Fatalf("unexpected duplicate click error: %v", err)
	}
	if click2.Revenue != 0.51 {
		t.Fatalf("expected revenue to remain 0.51 on duplicate click, got %f", click2.Revenue)
	}
}
