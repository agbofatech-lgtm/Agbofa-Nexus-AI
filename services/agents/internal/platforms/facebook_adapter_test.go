package platforms

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestFacebookAdapter_PlatformConnectorMethods(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewFacebookAdapter(ai, bus, limiter, logger)

	if adapter.PlatformName() != "Facebook" {
		t.Errorf("expected PlatformName Facebook, got %s", adapter.PlatformName())
	}
	if adapter.ConnectorVersion() != "1.0.0" {
		t.Errorf("expected version 1.0.0, got %s", adapter.ConnectorVersion())
	}
	types := adapter.SupportedContentTypes()
	if len(types) != 4 || types[0] != ContentTypeText {
		t.Errorf("expected 4 supported content types starting with TEXT, got %v", types)
	}

	// 1. Initialize with missing credentials
	err := adapter.Initialize(ctx, ConnectorConfig{"tenant_id": "tenant-fb"})
	if !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials on missing access_token/app_id, got %v", err)
	}

	// 2. Initialize with valid credentials
	err = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-fb",
		"access_token": "fb-access-token",
	})
	if err != nil {
		t.Fatalf("unexpected error initializing FacebookAdapter: %v", err)
	}

	// 3. HealthCheck
	health, err := adapter.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Publish
	pubRes, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Hello Facebook from Agbofa Nexus AI",
		TenantID: "tenant-fb",
		Platform: "Facebook",
	})
	if err != nil || pubRes.Status != "PUBLISHED" {
		t.Fatalf("expected published FB post result, got %v (err=%v)", pubRes, err)
	}
	if adapter.GetRemainingQuota() != 199 {
		t.Errorf("expected quota decremented to 199, got %d", adapter.GetRemainingQuota())
	}

	// 5. Update
	upRes, err := adapter.Update(ctx, pubRes.PostID, &PlatformContent{
		Content:  "Updated Facebook copy",
		TenantID: "tenant-fb",
		Platform: "Facebook",
	})
	if err != nil || upRes.Status != "UPDATED" {
		t.Fatalf("expected updated FB post result, got %v (err=%v)", upRes, err)
	}

	// 6. Delete
	err = adapter.Delete(ctx, pubRes.PostID)
	if err != nil {
		t.Fatalf("unexpected error deleting FB post: %v", err)
	}

	// 7. GetStatus
	status, err := adapter.GetStatus(ctx, pubRes.PostID)
	if err != nil || status.Metrics["likes"] != 350 {
		t.Fatalf("expected post metrics with 350 likes, got %v (err=%v)", status, err)
	}
}

func TestFacebookAdapter_TenantIsolationAndRateLimiting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewFacebookAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-fb",
		"access_token": "fb-access-token",
	})

	// 1. Cross-tenant violation
	_, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Cross-tenant FB attempt",
		TenantID: "tenant-intruder",
		Platform: "Facebook",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	// 2. Quota exhaustion
	adapter.SetRemainingQuota(0)
	_, err = adapter.Publish(ctx, &PlatformContent{
		Content:  "Quota exhausted post",
		TenantID: "tenant-fb",
		Platform: "Facebook",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded, got %v", err)
	}

	// 3. Fetch with rate limiter denial
	adapter.SetRemainingQuota(200)
	limiter.allow = false
	_, err = adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-fb",
		SourceID: "Facebook",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded on Fetch denial, got %v", err)
	}
}

func TestFacebookAdapter_FetchAndAIGatewayRouting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewFacebookAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-fb",
		"access_token": "fb-access-token",
	})

	res, err := adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-fb",
		SourceID: "Facebook",
		Limit:    5,
	})
	if err != nil || res == nil || len(res.Documents) != 1 {
		t.Fatalf("expected 1 monitoring document from FacebookAdapter Fetch, got res=%v (err=%v)", res, err)
	}

	if ai.summarized != 1 {
		t.Errorf("expected AIGatewayService SummarizeSignal called once, got %d", ai.summarized)
	}
	if bus.signals != 1 {
		t.Errorf("expected EventPublisher PublishSignalDetected called once, got %d", bus.signals)
	}
	if res.Documents[0].Metadata["ai_summary"] != "AI Summary of Tweet" {
		t.Errorf("expected ai_summary metadata set, got %s", res.Documents[0].Metadata["ai_summary"])
	}
}
