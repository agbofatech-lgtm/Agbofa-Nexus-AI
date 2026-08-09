package platforms

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestRSSAdapter_PlatformConnectorMethods(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewRSSAdapter(ai, bus, limiter, logger)

	if adapter.PlatformName() != "RSS" {
		t.Errorf("expected PlatformName RSS, got %s", adapter.PlatformName())
	}
	if adapter.ConnectorVersion() != "1.0.0" {
		t.Errorf("expected version 1.0.0, got %s", adapter.ConnectorVersion())
	}
	types := adapter.SupportedContentTypes()
	if len(types) != 1 || types[0] != ContentTypeText {
		t.Errorf("expected 1 supported content type TEXT, got %v", types)
	}

	// 1. Initialize with valid feed URL
	err := adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id": "tenant-rss",
		"feed_url":  "https://news.ycombinator.com/rss",
	})
	if err != nil {
		t.Fatalf("unexpected error initializing RSSAdapter: %v", err)
	}

	// 2. HealthCheck
	health, err := adapter.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 3. Publish (unsupported by RSS)
	_, err = adapter.Publish(ctx, &PlatformContent{
		Content:  "Hello RSS from Agbofa Nexus AI",
		TenantID: "tenant-rss",
		Platform: "RSS",
	})
	if err == nil || err.Error() != "publish not supported by RSS protocol" {
		t.Fatalf("expected unsupported error on publish, got %v", err)
	}

	// 4. Update (unsupported by RSS)
	_, err = adapter.Update(ctx, "post-100", &PlatformContent{TenantID: "tenant-rss"})
	if err == nil || err.Error() != "update not supported by RSS protocol" {
		t.Fatalf("expected unsupported error on update, got %v", err)
	}

	// 5. Delete (unsupported by RSS)
	err = adapter.Delete(ctx, "post-100")
	if err == nil || err.Error() != "delete not supported by RSS protocol" {
		t.Fatalf("expected unsupported error on delete, got %v", err)
	}

	// 6. GetStatus
	status, err := adapter.GetStatus(ctx, "rss-item-1")
	if err != nil || status.Metrics["items"] != 1 {
		t.Fatalf("expected feed metrics with 1 item, got %v (err=%v)", status, err)
	}
}

func TestRSSAdapter_TenantIsolationAndRateLimiting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewRSSAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id": "tenant-rss",
		"feed_url":  "https://news.ycombinator.com/rss",
	})

	// 1. Cross-tenant violation
	_, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Cross-tenant RSS attempt",
		TenantID: "tenant-intruder",
		Platform: "RSS",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	// 2. Fetch with rate limiter denial
	adapter.SetRemainingQuota(60)
	limiter.allow = false
	_, err = adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-rss",
		SourceID: "RSS",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded on Fetch denial, got %v", err)
	}
}

func TestRSSAdapter_FetchAndAIGatewayRouting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewRSSAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id": "tenant-rss",
		"feed_url":  "https://news.ycombinator.com/rss",
	})

	res, err := adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-rss",
		SourceID: "RSS",
		Limit:    5,
	})
	if err != nil || res == nil || len(res.Documents) != 1 {
		t.Fatalf("expected 1 monitoring document from RSSAdapter Fetch, got res=%v (err=%v)", res, err)
	}

	if ai.summarized != 1 {
		t.Errorf("expected AIGatewayService SummarizeSignal called once, got %d", ai.summarized)
	}
	if bus.signals != 1 {
		t.Errorf("expected EventPublisher PublishSignalDetected called once, got %d", bus.signals)
	}
	if res.Documents[0].Metadata["protocol"] != "RSS-2.0" {
		t.Errorf("expected protocol metadata set, got %s", res.Documents[0].Metadata["protocol"])
	}
}
