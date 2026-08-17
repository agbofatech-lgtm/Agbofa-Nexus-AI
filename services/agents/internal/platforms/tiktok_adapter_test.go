package platforms

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestTikTokAdapter_PlatformConnectorMethods(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewTikTokAdapter(ai, bus, limiter, logger)

	if adapter.PlatformName() != "TikTok" {
		t.Errorf("expected PlatformName TikTok, got %s", adapter.PlatformName())
	}
	if adapter.ConnectorVersion() != "1.0.0" {
		t.Errorf("expected version 1.0.0, got %s", adapter.ConnectorVersion())
	}
	types := adapter.SupportedContentTypes()
	if len(types) != 1 || types[0] != ContentTypeVideo {
		t.Errorf("expected 1 supported content type VIDEO, got %v", types)
	}

	// 1. Initialize with missing credentials
	err := adapter.Initialize(ctx, ConnectorConfig{"tenant_id": "tenant-tt"})
	if !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials on missing access_token/creator_id, got %v", err)
	}

	// 2. Initialize with valid credentials
	err = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-tt",
		"access_token": "tt-access-token",
	})
	if err != nil {
		t.Fatalf("unexpected error initializing TikTokAdapter: %v", err)
	}

	// 3. HealthCheck
	health, err := adapter.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Publish video
	pubRes, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "TikTok video copy",
		TenantID: "tenant-tt",
		Platform: "TikTok",
		Metadata: map[string]string{"content_type": "VIDEO"},
	})
	if err != nil || pubRes.Status != "PUBLISHED" {
		t.Fatalf("expected published TT video result, got %v (err=%v)", pubRes, err)
	}
	if adapter.GetRemainingQuota() != 49 {
		t.Errorf("expected quota decremented to 49, got %d", adapter.GetRemainingQuota())
	}

	// 5. Publish non-video (unsupported by TikTok)
	_, err = adapter.Publish(ctx, &PlatformContent{
		Content:  "TikTok text copy",
		TenantID: "tenant-tt",
		Platform: "TikTok",
		Metadata: map[string]string{"content_type": "TEXT"},
	})
	if err == nil || err.Error() != "content type not supported by TikTok" {
		t.Fatalf("expected unsupported content type error, got %v", err)
	}

	// 6. Update (not supported by TikTok)
	_, err = adapter.Update(ctx, pubRes.PostID, &PlatformContent{TenantID: "tenant-tt"})
	if err == nil || err.Error() != "update not supported by TikTok" {
		t.Fatalf("expected unsupported update error, got %v", err)
	}

	// 7. Delete
	err = adapter.Delete(ctx, pubRes.PostID)
	if err != nil {
		t.Fatalf("unexpected error deleting TT video: %v", err)
	}

	// 8. GetStatus
	status, err := adapter.GetStatus(ctx, pubRes.PostID)
	if err != nil || status.Metrics["views"] != 15000 {
		t.Fatalf("expected video metrics with 15000 views, got %v (err=%v)", status, err)
	}
}

func TestTikTokAdapter_TenantIsolationAndRateLimiting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewTikTokAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-tt",
		"access_token": "tt-access-token",
	})

	// 1. Cross-tenant violation
	_, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Cross-tenant TT attempt",
		TenantID: "tenant-intruder",
		Platform: "TikTok",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	// 2. Quota exhaustion
	adapter.SetRemainingQuota(0)
	_, err = adapter.Publish(ctx, &PlatformContent{
		Content:  "Quota exhausted video",
		TenantID: "tenant-tt",
		Platform: "TikTok",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded, got %v", err)
	}

	// 3. Fetch with rate limiter denial
	adapter.SetRemainingQuota(50)
	limiter.allow = false
	_, err = adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-tt",
		SourceID: "TikTok",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded on Fetch denial, got %v", err)
	}
}

func TestTikTokAdapter_FetchAndAIGatewayRouting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewTikTokAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-tt",
		"access_token": "tt-access-token",
	})

	res, err := adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-tt",
		SourceID: "TikTok",
		Limit:    5,
	})
	if err != nil || res == nil || len(res.Documents) != 1 {
		t.Fatalf("expected 1 monitoring document from TikTokAdapter Fetch, got res=%v (err=%v)", res, err)
	}

	if ai.summarized != 1 {
		t.Errorf("expected AIGatewayService SummarizeSignal called once, got %d", ai.summarized)
	}
	if bus.signals != 1 {
		t.Errorf("expected EventPublisher PublishSignalDetected called once, got %d", bus.signals)
	}
	if res.Documents[0].Metadata["analytics_available_hours"] != "24" {
		t.Errorf("expected analytics_available_hours metadata set, got %s", res.Documents[0].Metadata["analytics_available_hours"])
	}
}
