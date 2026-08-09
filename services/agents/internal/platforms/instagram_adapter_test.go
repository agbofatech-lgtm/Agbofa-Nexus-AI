package platforms

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestInstagramAdapter_PlatformConnectorMethods(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewInstagramAdapter(ai, bus, limiter, logger)

	if adapter.PlatformName() != "Instagram" {
		t.Errorf("expected PlatformName Instagram, got %s", adapter.PlatformName())
	}
	if adapter.ConnectorVersion() != "1.0.0" {
		t.Errorf("expected version 1.0.0, got %s", adapter.ConnectorVersion())
	}
	types := adapter.SupportedContentTypes()
	if len(types) != 2 || types[0] != ContentTypeImage {
		t.Errorf("expected 2 supported content types starting with IMAGE, got %v", types)
	}

	// 1. Initialize with missing credentials
	err := adapter.Initialize(ctx, ConnectorConfig{"tenant_id": "tenant-ig"})
	if !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials on missing access_token, got %v", err)
	}

	// 2. Initialize with valid credentials
	err = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-ig",
		"access_token": "ig-access-token",
	})
	if err != nil {
		t.Fatalf("unexpected error initializing InstagramAdapter: %v", err)
	}

	// 3. HealthCheck
	health, err := adapter.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Publish
	pubRes, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Hello Instagram from Agbofa Nexus AI",
		TenantID: "tenant-ig",
		Platform: "Instagram",
	})
	if err != nil || pubRes.Status != "PUBLISHED" {
		t.Fatalf("expected published IG media result, got %v (err=%v)", pubRes, err)
	}
	if adapter.GetRemainingQuota() != 199 {
		t.Errorf("expected quota decremented to 199, got %d", adapter.GetRemainingQuota())
	}

	// 5. Update caption
	upRes, err := adapter.Update(ctx, pubRes.PostID, &PlatformContent{
		Content:  "Updated Instagram copy",
		TenantID: "tenant-ig",
		Platform: "Instagram",
	})
	if err != nil || upRes.Status != "UPDATED" {
		t.Fatalf("expected updated IG media result, got %v (err=%v)", upRes, err)
	}

	// 6. Delete
	err = adapter.Delete(ctx, pubRes.PostID)
	if err != nil {
		t.Fatalf("unexpected error deleting IG media: %v", err)
	}

	// 7. GetStatus
	status, err := adapter.GetStatus(ctx, pubRes.PostID)
	if err != nil || status.Metrics["likes"] != 420 {
		t.Fatalf("expected media metrics with 420 likes, got %v (err=%v)", status, err)
	}
}

func TestInstagramAdapter_TenantIsolationAndRateLimiting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewInstagramAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-ig",
		"access_token": "ig-access-token",
	})

	// 1. Cross-tenant violation
	_, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Cross-tenant IG attempt",
		TenantID: "tenant-intruder",
		Platform: "Instagram",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	// 2. Quota exhaustion
	adapter.SetRemainingQuota(0)
	_, err = adapter.Publish(ctx, &PlatformContent{
		Content:  "Quota exhausted post",
		TenantID: "tenant-ig",
		Platform: "Instagram",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded, got %v", err)
	}

	// 3. Fetch with rate limiter denial
	adapter.SetRemainingQuota(200)
	limiter.allow = false
	_, err = adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-ig",
		SourceID: "Instagram",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded on Fetch denial, got %v", err)
	}
}

func TestInstagramAdapter_FetchAndAIGatewayRouting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewInstagramAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-ig",
		"access_token": "ig-access-token",
	})

	res, err := adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-ig",
		SourceID: "Instagram",
		Limit:    5,
	})
	if err != nil || res == nil || len(res.Documents) != 1 {
		t.Fatalf("expected 1 monitoring document from InstagramAdapter Fetch, got res=%v (err=%v)", res, err)
	}

	if ai.summarized != 1 {
		t.Errorf("expected AIGatewayService SummarizeSignal called once, got %d", ai.summarized)
	}
	if bus.signals != 1 {
		t.Errorf("expected EventPublisher PublishSignalDetected called once, got %d", bus.signals)
	}
	if res.Documents[0].Metadata["story_expiry_hours"] != "24" {
		t.Errorf("expected story_expiry_hours metadata set, got %s", res.Documents[0].Metadata["story_expiry_hours"])
	}
}
