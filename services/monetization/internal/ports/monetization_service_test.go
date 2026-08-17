package ports

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

type mockSubServiceForPorts struct{}

func (m *mockSubServiceForPorts) CreateSubscription(ctx context.Context, tenantID, readerID, planID, paymentMethodID string) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return &domain.ReaderSubscription{SubscriptionID: "sub-p1", TenantID: tenantID}, nil
}
func (m *mockSubServiceForPorts) GetSubscription(ctx context.Context, tenantID, subscriptionID string) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return &domain.ReaderSubscription{SubscriptionID: subscriptionID, TenantID: tenantID}, nil
}
func (m *mockSubServiceForPorts) GetActiveSubscriptionByReader(ctx context.Context, tenantID, readerID string) (*domain.ReaderSubscription, error) {
	return nil, nil
}
func (m *mockSubServiceForPorts) CancelSubscription(ctx context.Context, tenantID, subscriptionID string, immediate bool) (*domain.ReaderSubscription, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return &domain.ReaderSubscription{SubscriptionID: subscriptionID, TenantID: tenantID, Status: domain.SubscriptionStatusCanceled}, nil
}
func (m *mockSubServiceForPorts) ListPlans(ctx context.Context, tenantID string) ([]*domain.SubscriptionPlan, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return []*domain.SubscriptionPlan{{PlanID: "plan-p1", TenantID: tenantID}}, nil
}
func (m *mockSubServiceForPorts) GetPlan(ctx context.Context, tenantID, planID string) (*domain.SubscriptionPlan, error) {
	return nil, nil
}

type mockPaywallServiceForPorts struct{}

func (m *mockPaywallServiceForPorts) CheckEntitlement(ctx context.Context, tenantID, readerID, contentID string, isPremium bool) (*domain.EntitlementCheck, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return &domain.EntitlementCheck{TenantID: tenantID, HasAccess: true, Reason: domain.PaywallReasonMeteredFree}, nil
}
func (m *mockPaywallServiceForPorts) GetMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return &domain.MeteredAccess{TenantID: tenantID, MeteredCount: 1, MeteredLimit: 5}, nil
}
func (m *mockPaywallServiceForPorts) IncrementMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error) {
	return nil, nil
}

type mockAdServiceForPorts struct{}

func (m *mockAdServiceForPorts) CreateCampaign(ctx context.Context, tenantID string, campaign *domain.AdCampaign) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	campaign.TenantID = tenantID
	campaign.CampaignID = "camp-p1"
	return nil
}
func (m *mockAdServiceForPorts) GetCampaign(ctx context.Context, tenantID, campaignID string) (*domain.AdCampaign, error) {
	return nil, nil
}
func (m *mockAdServiceForPorts) ListActiveCampaigns(ctx context.Context, tenantID string) ([]*domain.AdCampaign, error) {
	return nil, nil
}
func (m *mockAdServiceForPorts) SelectPlacement(ctx context.Context, tenantID, contentID, platform string, readerTopics []string) (*domain.AdPlacement, error) {
	return nil, nil
}
func (m *mockAdServiceForPorts) RecordImpression(ctx context.Context, tenantID, placementID, readerID string) (*domain.AdImpression, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return &domain.AdImpression{ImpressionID: "imp-p1", TenantID: tenantID}, nil
}
func (m *mockAdServiceForPorts) RecordClick(ctx context.Context, tenantID, impressionID string) (*domain.AdImpression, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return &domain.AdImpression{ImpressionID: impressionID, TenantID: tenantID, Clicked: true}, nil
}

type mockRevServiceForPorts struct{}

func (m *mockRevServiceForPorts) RecordRevenueEvent(ctx context.Context, tenantID string, event *domain.RevenueEvent) error {
	return nil
}
func (m *mockRevServiceForPorts) GetRevenueAggregate(ctx context.Context, tenantID string, period domain.RevenuePeriod) (*domain.RevenueAggregate, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return &domain.RevenueAggregate{TenantID: tenantID, TotalRevenue: 100.0, CalculatedAt: time.Now().UTC()}, nil
}
func (m *mockRevServiceForPorts) GetMRRData(ctx context.Context, tenantID string) (*domain.MRRData, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return &domain.MRRData{TenantID: tenantID, TotalMRR: 50.0}, nil
}
func (m *mockRevServiceForPorts) GetChurnData(ctx context.Context, tenantID string) (*domain.ChurnData, error) {
	return nil, nil
}

func TestMonetizationGRPCServer_TenantIDValidationAndHandlers(t *testing.T) {
	ctx := context.Background()
	server := NewMonetizationGRPCServer(
		&mockSubServiceForPorts{},
		&mockPaywallServiceForPorts{},
		&mockAdServiceForPorts{},
		&mockRevServiceForPorts{},
	)

	// 1. CreateSubscription without tenant_id -> ErrCrossTenantViolation
	_, err := server.CreateSubscription(ctx, &CreateSubscriptionRequest{TenantID: ""})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant_id, got %v", err)
	}

	// 2. CreateSubscription with tenant_id -> success
	subResp, err := server.CreateSubscription(ctx, &CreateSubscriptionRequest{
		TenantID: "tenant-grpc-1",
		ReaderID: "reader-1",
		PlanID:   "plan-free",
	})
	if err != nil || subResp.Subscription == nil {
		t.Fatalf("expected success, got err=%v resp=%v", err, subResp)
	}

	// 3. CheckEntitlement without tenant_id -> ErrCrossTenantViolation
	_, err = server.CheckEntitlement(ctx, &CheckEntitlementRequest{TenantID: "", ReaderID: "reader-1", ContentID: "content-1"})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant_id, got %v", err)
	}

	// 4. CreateCampaign with valid tenant_id
	campResp, err := server.CreateCampaign(ctx, &CreateCampaignRequest{
		TenantID: "tenant-grpc-1",
		Name:     "Test Ad",
		Budget:   500.0,
	})
	if err != nil || campResp.Campaign == nil {
		t.Fatalf("expected campaign response, got err=%v", err)
	}

	// 5. GetRevenueAggregate with valid tenant_id
	revResp, err := server.GetRevenueAggregate(ctx, &GetRevenueAggregateRequest{
		TenantID: "tenant-grpc-1",
		Period:   domain.RevenuePeriodMonthly,
	})
	if err != nil || revResp.Aggregate == nil {
		t.Fatalf("expected revenue aggregate, got err=%v", err)
	}
}
