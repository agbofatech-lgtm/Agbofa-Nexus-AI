package platforms

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestLinkedInAdapter_PlatformConnectorMethods(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewLinkedInAdapter(ai, bus, limiter, logger)

	if adapter.PlatformName() != "LinkedIn" {
		t.Errorf("expected PlatformName LinkedIn, got %s", adapter.PlatformName())
	}
	if adapter.ConnectorVersion() != "1.0.0" {
		t.Errorf("expected version 1.0.0, got %s", adapter.ConnectorVersion())
	}
	types := adapter.SupportedContentTypes()
	if len(types) != 3 || types[0] != ContentTypeText {
		t.Errorf("expected 3 supported content types starting with TEXT, got %v", types)
	}

	// 1. Initialize with missing credentials
	err := adapter.Initialize(ctx, ConnectorConfig{"tenant_id": "tenant-li"})
	if !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials on missing access_token/client_id, got %v", err)
	}

	// 2. Initialize with valid credentials
	err = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-li",
		"access_token": "li-access-token",
	})
	if err != nil {
		t.Fatalf("unexpected error initializing LinkedInAdapter: %v", err)
	}

	// 3. HealthCheck
	health, err := adapter.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Publish
	pubRes, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Hello LinkedIn from Agbofa Nexus AI",
		TenantID: "tenant-li",
		Platform: "LinkedIn",
	})
	if err != nil || pubRes.Status != "PUBLISHED" {
		t.Fatalf("expected published LI share result, got %v (err=%v)", pubRes, err)
	}
	if adapter.GetRemainingQuota() != 99 {
		t.Errorf("expected quota decremented to 99, got %d", adapter.GetRemainingQuota())
	}

	// 5. Update
	upRes, err := adapter.Update(ctx, pubRes.PostID, &PlatformContent{
		Content:  "Updated LinkedIn copy",
		TenantID: "tenant-li",
		Platform: "LinkedIn",
	})
	if err != nil || upRes.Status != "UPDATED" {
		t.Fatalf("expected updated LI share result, got %v (err=%v)", upRes, err)
	}

	// 6. Delete
	err = adapter.Delete(ctx, pubRes.PostID)
	if err != nil {
		t.Fatalf("unexpected error deleting LI share: %v", err)
	}

	// 7. GetStatus
	status, err := adapter.GetStatus(ctx, pubRes.PostID)
	if err != nil || status.Metrics["likes"] != 180 {
		t.Fatalf("expected share metrics with 180 likes, got %v (err=%v)", status, err)
	}
}

func TestLinkedInAdapter_TenantIsolationAndRateLimiting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewLinkedInAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-li",
		"access_token": "li-access-token",
	})

	// 1. Cross-tenant violation
	_, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Cross-tenant LI attempt",
		TenantID: "tenant-intruder",
		Platform: "LinkedIn",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	// 2. Quota exhaustion
	adapter.SetRemainingQuota(0)
	_, err = adapter.Publish(ctx, &PlatformContent{
		Content:  "Quota exhausted share",
		TenantID: "tenant-li",
		Platform: "LinkedIn",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded, got %v", err)
	}

	// 3. Fetch with rate limiter denial
	adapter.SetRemainingQuota(100)
	limiter.allow = false
	_, err = adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-li",
		SourceID: "LinkedIn",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded on Fetch denial, got %v", err)
	}
}

func TestLinkedInAdapter_FetchAndAIGatewayRouting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewLinkedInAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id":    "tenant-li",
		"access_token": "li-access-token",
	})

	res, err := adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-li",
		SourceID: "LinkedIn",
		Limit:    5,
	})
	if err != nil || res == nil || len(res.Documents) != 1 {
		t.Fatalf("expected 1 monitoring document from LinkedInAdapter Fetch, got res=%v (err=%v)", res, err)
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
