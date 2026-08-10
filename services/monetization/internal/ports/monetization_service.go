package ports

import (
	"context"
	"errors"

	"github.com/agbofa/nexus/services/monetization/internal/application"
	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

// Request and Response DTOs corresponding to monetization.proto
type CreateSubscriptionRequest struct {
	TenantID        string `json:"tenant_id"`
	ReaderID        string `json:"reader_id"`
	PlanID          string `json:"plan_id"`
	PaymentMethodID string `json:"payment_method_id"`
}

type CreateSubscriptionResponse struct {
	Subscription *domain.ReaderSubscription `json:"subscription"`
}

type GetSubscriptionRequest struct {
	TenantID       string `json:"tenant_id"`
	SubscriptionID string `json:"subscription_id"`
}

type GetSubscriptionResponse struct {
	Subscription *domain.ReaderSubscription `json:"subscription"`
}

type CancelSubscriptionRequest struct {
	TenantID       string `json:"tenant_id"`
	SubscriptionID string `json:"subscription_id"`
	Immediate      bool   `json:"immediate"`
	Reason         string `json:"reason"`
}

type CancelSubscriptionResponse struct {
	Subscription *domain.ReaderSubscription `json:"subscription"`
}

type ListPlansRequest struct {
	TenantID string `json:"tenant_id"`
}

type ListPlansResponse struct {
	Plans []*domain.SubscriptionPlan `json:"plans"`
}

type CheckEntitlementRequest struct {
	TenantID  string `json:"tenant_id"`
	ReaderID  string `json:"reader_id"`
	ContentID string `json:"content_id"`
	IsPremium bool   `json:"is_premium"`
}

type CheckEntitlementResponse struct {
	Entitlement *domain.EntitlementCheck `json:"entitlement"`
}

type GetMeteredAccessRequest struct {
	TenantID string `json:"tenant_id"`
	ReaderID string `json:"reader_id"`
}

type GetMeteredAccessResponse struct {
	MeteredAccess *domain.MeteredAccess `json:"metered_access"`
}

type CreateCampaignRequest struct {
	TenantID        string                       `json:"tenant_id"`
	AdvertiserID    string                       `json:"advertiser_id"`
	Name            string                       `json:"name"`
	Budget          float64                      `json:"budget"`
	Currency        string                       `json:"currency"`
	TargetPlatforms []string                     `json:"target_platforms"`
	TargetTopics    []string                     `json:"target_topics"`
	ExcludedTopics  []string                     `json:"excluded_topics"`
	Constraints     domain.AdvertiserConstraints `json:"constraints"`
}

type CreateCampaignResponse struct {
	Campaign *domain.AdCampaign `json:"campaign"`
}

type RecordImpressionRequest struct {
	TenantID    string `json:"tenant_id"`
	PlacementID string `json:"placement_id"`
	ReaderID    string `json:"reader_id"`
}

type RecordImpressionResponse struct {
	Impression *domain.AdImpression `json:"impression"`
}

type RecordClickRequest struct {
	TenantID     string `json:"tenant_id"`
	ImpressionID string `json:"impression_id"`
}

type RecordClickResponse struct {
	Impression *domain.AdImpression `json:"impression"`
}

type GetRevenueAggregateRequest struct {
	TenantID string               `json:"tenant_id"`
	Period   domain.RevenuePeriod `json:"period"`
}

type GetRevenueAggregateResponse struct {
	Aggregate *domain.RevenueAggregate `json:"aggregate"`
}

type GetMRRDataRequest struct {
	TenantID string `json:"tenant_id"`
	Months   int    `json:"months"`
}

type GetMRRDataResponse struct {
	MRRData *domain.MRRData `json:"mrr_data"`
}

// MonetizationGRPCServer implements the authoritative gRPC MonetizationService for IMP-021 Batch 3.
// Enforces tenant_id validation on every single request and routes to application engines.
type MonetizationGRPCServer struct {
	subService     application.SubscriptionService
	paywallService application.PaywallService
	adService      application.AdService
	revService     application.RevenueAnalyticsService
}

// NewMonetizationGRPCServer initializes a new MonetizationGRPCServer.
func NewMonetizationGRPCServer(
	subService application.SubscriptionService,
	paywallService application.PaywallService,
	adService application.AdService,
	revService application.RevenueAnalyticsService,
) *MonetizationGRPCServer {
	return &MonetizationGRPCServer{
		subService:     subService,
		paywallService: paywallService,
		adService:      adService,
		revService:     revService,
	}
}

// CreateSubscription RPC handler
func (s *MonetizationGRPCServer) CreateSubscription(ctx context.Context, req *CreateSubscriptionRequest) (*CreateSubscriptionResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.subService == nil {
		return nil, errors.New("subscription service uninitialized")
	}
	sub, err := s.subService.CreateSubscription(ctx, req.TenantID, req.ReaderID, req.PlanID, req.PaymentMethodID)
	if err != nil {
		return nil, err
	}
	return &CreateSubscriptionResponse{Subscription: sub}, nil
}

// GetSubscription RPC handler
func (s *MonetizationGRPCServer) GetSubscription(ctx context.Context, req *GetSubscriptionRequest) (*GetSubscriptionResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.subService == nil {
		return nil, errors.New("subscription service uninitialized")
	}
	sub, err := s.subService.GetSubscription(ctx, req.TenantID, req.SubscriptionID)
	if err != nil {
		return nil, err
	}
	return &GetSubscriptionResponse{Subscription: sub}, nil
}

// CancelSubscription RPC handler
func (s *MonetizationGRPCServer) CancelSubscription(ctx context.Context, req *CancelSubscriptionRequest) (*CancelSubscriptionResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.subService == nil {
		return nil, errors.New("subscription service uninitialized")
	}
	sub, err := s.subService.CancelSubscription(ctx, req.TenantID, req.SubscriptionID, req.Immediate)
	if err != nil {
		return nil, err
	}
	return &CancelSubscriptionResponse{Subscription: sub}, nil
}

// ListPlans RPC handler
func (s *MonetizationGRPCServer) ListPlans(ctx context.Context, req *ListPlansRequest) (*ListPlansResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.subService == nil {
		return nil, errors.New("subscription service uninitialized")
	}
	plans, err := s.subService.ListPlans(ctx, req.TenantID)
	if err != nil {
		return nil, err
	}
	return &ListPlansResponse{Plans: plans}, nil
}

// CheckEntitlement RPC handler
func (s *MonetizationGRPCServer) CheckEntitlement(ctx context.Context, req *CheckEntitlementRequest) (*CheckEntitlementResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.paywallService == nil {
		return nil, errors.New("paywall service uninitialized")
	}
	ent, err := s.paywallService.CheckEntitlement(ctx, req.TenantID, req.ReaderID, req.ContentID, req.IsPremium)
	if err != nil {
		return nil, err
	}
	return &CheckEntitlementResponse{Entitlement: ent}, nil
}

// GetMeteredAccess RPC handler
func (s *MonetizationGRPCServer) GetMeteredAccess(ctx context.Context, req *GetMeteredAccessRequest) (*GetMeteredAccessResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.paywallService == nil {
		return nil, errors.New("paywall service uninitialized")
	}
	metered, err := s.paywallService.GetMeteredAccess(ctx, req.TenantID, req.ReaderID)
	if err != nil {
		return nil, err
	}
	return &GetMeteredAccessResponse{MeteredAccess: metered}, nil
}

// CreateCampaign RPC handler
func (s *MonetizationGRPCServer) CreateCampaign(ctx context.Context, req *CreateCampaignRequest) (*CreateCampaignResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.adService == nil {
		return nil, errors.New("ad service uninitialized")
	}
	camp := &domain.AdCampaign{
		TenantID:        req.TenantID,
		AdvertiserID:    req.AdvertiserID,
		Name:            req.Name,
		Budget:          req.Budget,
		Currency:        req.Currency,
		TargetPlatforms: req.TargetPlatforms,
		TargetTopics:    req.TargetTopics,
		Constraints:     req.Constraints,
	}
	if err := s.adService.CreateCampaign(ctx, req.TenantID, camp); err != nil {
		return nil, err
	}
	return &CreateCampaignResponse{Campaign: camp}, nil
}

// RecordImpression RPC handler
func (s *MonetizationGRPCServer) RecordImpression(ctx context.Context, req *RecordImpressionRequest) (*RecordImpressionResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.adService == nil {
		return nil, errors.New("ad service uninitialized")
	}
	imp, err := s.adService.RecordImpression(ctx, req.TenantID, req.PlacementID, req.ReaderID)
	if err != nil {
		return nil, err
	}
	return &RecordImpressionResponse{Impression: imp}, nil
}

// RecordClick RPC handler
func (s *MonetizationGRPCServer) RecordClick(ctx context.Context, req *RecordClickRequest) (*RecordClickResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.adService == nil {
		return nil, errors.New("ad service uninitialized")
	}
	imp, err := s.adService.RecordClick(ctx, req.TenantID, req.ImpressionID)
	if err != nil {
		return nil, err
	}
	return &RecordClickResponse{Impression: imp}, nil
}

// GetRevenueAggregate RPC handler
func (s *MonetizationGRPCServer) GetRevenueAggregate(ctx context.Context, req *GetRevenueAggregateRequest) (*GetRevenueAggregateResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.revService == nil {
		return nil, errors.New("revenue analytics service uninitialized")
	}
	agg, err := s.revService.GetRevenueAggregate(ctx, req.TenantID, req.Period)
	if err != nil {
		return nil, err
	}
	return &GetRevenueAggregateResponse{Aggregate: agg}, nil
}

// GetMRRData RPC handler
func (s *MonetizationGRPCServer) GetMRRData(ctx context.Context, req *GetMRRDataRequest) (*GetMRRDataResponse, error) {
	if req == nil || req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.revService == nil {
		return nil, errors.New("revenue analytics service uninitialized")
	}
	mrr, err := s.revService.GetMRRData(ctx, req.TenantID)
	if err != nil {
		return nil, err
	}
	return &GetMRRDataResponse{MRRData: mrr}, nil
}
