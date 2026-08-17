package platforms

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestYouTubeAdapter_PlatformConnectorMethods(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewYouTubeAdapter(ai, bus, limiter, logger)

	if adapter.PlatformName() != "YouTube" {
		t.Errorf("expected PlatformName YouTube, got %s", adapter.PlatformName())
	}
	if adapter.ConnectorVersion() != "1.0.0" {
		t.Errorf("expected version 1.0.0, got %s", adapter.ConnectorVersion())
	}
	types := adapter.SupportedContentTypes()
	if len(types) != 1 || types[0] != ContentTypeVideo {
		t.Errorf("expected 1 supported content type VIDEO, got %v", types)
	}

	// 1. Initialize with missing credentials
	err := adapter.Initialize(ctx, ConnectorConfig{"tenant_id": "tenant-yt"})
	if !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials on missing api_key/access_token, got %v", err)
	}

	// 2. Initialize with valid credentials
	err = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id": "tenant-yt",
		"api_key":   "yt-api-key",
	})
	if err != nil {
		t.Fatalf("unexpected error initializing YouTubeAdapter: %v", err)
	}

	// 3. HealthCheck
	health, err := adapter.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Publish video
	pubRes, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "YouTube video copy",
		TenantID: "tenant-yt",
		Platform: "YouTube",
	})
	if err != nil || pubRes.Status != "PUBLISHED" {
		t.Fatalf("expected published YT video result, got %v (err=%v)", pubRes, err)
	}
	if adapter.GetRemainingQuota() != 99 {
		t.Errorf("expected quota decremented to 99, got %d", adapter.GetRemainingQuota())
	}

	// 5. Update metadata (title, description, tags)
	upRes, err := adapter.Update(ctx, pubRes.PostID, &PlatformContent{
		Content:  "Updated YouTube metadata",
		TenantID: "tenant-yt",
		Platform: "YouTube",
	})
	if err != nil || upRes.Status != "UPDATED" {
		t.Fatalf("expected updated YT video result, got %v (err=%v)", upRes, err)
	}

	// 6. Delete
	err = adapter.Delete(ctx, pubRes.PostID)
	if err != nil {
		t.Fatalf("unexpected error deleting YT video: %v", err)
	}

	// 7. GetStatus
	status, err := adapter.GetStatus(ctx, pubRes.PostID)
	if err != nil || status.Metrics["views"] != 12500 {
		t.Fatalf("expected video metrics with 12500 views, got %v (err=%v)", status, err)
	}
}

func TestYouTubeAdapter_TenantIsolationAndRateLimiting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewYouTubeAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id": "tenant-yt",
		"api_key":   "yt-api-key",
	})

	// 1. Cross-tenant violation
	_, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Cross-tenant YT attempt",
		TenantID: "tenant-intruder",
		Platform: "YouTube",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	// 2. Quota exhaustion
	adapter.SetRemainingQuota(0)
	_, err = adapter.Publish(ctx, &PlatformContent{
		Content:  "Quota exhausted video",
		TenantID: "tenant-yt",
		Platform: "YouTube",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded, got %v", err)
	}

	// 3. Fetch with rate limiter denial
	adapter.SetRemainingQuota(100)
	limiter.allow = false
	_, err = adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-yt",
		SourceID: "YouTube",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded on Fetch denial, got %v", err)
	}
}

func TestYouTubeAdapter_FetchAndAIGatewayRouting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewYouTubeAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id": "tenant-yt",
		"api_key":   "yt-api-key",
	})

	res, err := adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-yt",
		SourceID: "YouTube",
		Limit:    5,
	})
	if err != nil || res == nil || len(res.Documents) != 1 {
		t.Fatalf("expected 1 monitoring document from YouTubeAdapter Fetch, got res=%v (err=%v)", res, err)
	}

	if ai.summarized != 1 {
		t.Errorf("expected AIGatewayService SummarizeSignal called once, got %d", ai.summarized)
	}
	if bus.signals != 1 {
		t.Errorf("expected EventPublisher PublishSignalDetected called once, got %d", bus.signals)
	}
	if res.Documents[0].Metadata["video_type"] != "short" {
		t.Errorf("expected video_type metadata set, got %s", res.Documents[0].Metadata["video_type"])
	}
}
