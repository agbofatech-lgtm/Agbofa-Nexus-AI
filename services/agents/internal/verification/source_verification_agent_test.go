package verification

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestSourceVerificationAgentLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewSourceVerifier(nil)
	ctx := context.Background()

	if agent.ID() != "AGT-019" || agent.Name() != "Source Verification Agent" {
		t.Fatalf("unexpected agent identity: %s / %s", agent.ID(), agent.Name())
	}

	// Uninitialized health check should fail
	if _, err := agent.HealthCheck(ctx); err == nil {
		t.Fatalf("expected error on uninitialized health check")
	}

	// Empty tenant ID should return ErrCrossTenantViolation
	if err := agent.Initialize(ctx, "", nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	// Initialize with tenant-A
	if err := agent.Initialize(ctx, "tenant-A", nil); err != nil {
		t.Fatalf("unexpected initialization error: %v", err)
	}

	if health, err := agent.HealthCheck(ctx); err != nil || health.Status != "HEALTHY" {
		t.Fatalf("expected HEALTHY health check after initialize")
	}

	// Cross-tenant verification should be rejected
	crossClaim := &domain.Claim{
		ClaimID:  "clm-1",
		TenantID: "tenant-B",
	}
	if _, err := agent.Verify(ctx, crossClaim); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for cross-tenant claim")
	}

	// Shutdown
	_ = agent.Shutdown(ctx)
	if _, err := agent.HealthCheck(ctx); err == nil {
		t.Fatalf("expected error on health check after shutdown")
	}
}

func TestSourceVerificationAgentVerifyClassifications(t *testing.T) {
	agent := NewSourceVerifier(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	testCases := []struct {
		url          string
		author       string
		wantClass    string
		minAuthority float64
	}{
		{"https://stats.gov/report-1", "Official Bureau", "AUTHENTICATED", 0.90},
		{"https://reuterz-news.cn/story", "@reuters_real_official", "IMPERSONATING", 0.10},
		{"https://bot-syndicate.net/post-99", "@auto_bot_poster", "BOT", 0.15},
		{"https://questionable-news.xyz/gossip", "Anonymous Gossip", "SUSPICIOUS", 0.25},
		{"https://unknown-blog.io/article", "Some Author", "UNVERIFIED", 0.50},
	}

	for _, tc := range testCases {
		claim := &domain.Claim{
			ClaimID:      "clm-test-" + tc.wantClass,
			TenantID:     "tenant-XYZ",
			SourceURL:    tc.url,
			Author:       tc.author,
			ClaimText:    "Test claim from " + tc.author,
			IsVerifiable: true,
		}

		res, err := agent.Verify(ctx, claim)
		if err != nil {
			t.Fatalf("unexpected error verifying source %s: %v", tc.url, err)
		}
		if res.Verdict != tc.wantClass || res.Classification != tc.wantClass {
			t.Fatalf("for url %s / author %s: expected classification %s, got %s / %s",
				tc.url, tc.author, tc.wantClass, res.Verdict, res.Classification)
		}
		if res.ConfidenceScore < tc.minAuthority {
			t.Fatalf("for url %s: expected authority >= %.2f, got %.2f", tc.url, tc.minAuthority, res.ConfidenceScore)
		}
		if len(res.Sources) != 1 || res.Sources[0].URL != tc.url {
			t.Fatalf("expected source in result sources list")
		}
		if len(res.Evidence) == 0 {
			t.Fatalf("expected evidence items for source verification")
		}
	}
}

func TestSourceVerificationAgentCorroborateAndAssess(t *testing.T) {
	agent := NewSourceVerifier(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	claim := &domain.Claim{
		ClaimID:      "clm-src-test",
		TenantID:     "tenant-XYZ",
		SourceURL:    "https://stats.gov/data",
		Author:       "Official Bureau",
		ClaimText:    "GDP rose 3%",
		IsVerifiable: true,
	}

	corrob, err := agent.Corroborate(ctx, claim, nil)
	if err != nil {
		t.Fatalf("unexpected error on Corroborate: %v", err)
	}
	if !corrob.Corroborated || len(corrob.CorroboratingSources) == 0 {
		t.Fatalf("expected trusted consistent corroboration")
	}

	assess, err := agent.Assess(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on Assess: %v", err)
	}
	if assess.AssessmentType != "SOURCE_VERIFICATION" || assess.Classification != "TRUSTED" {
		t.Fatalf("expected SOURCE_VERIFICATION / TRUSTED assessment, got %s / %s", assess.AssessmentType, assess.Classification)
	}
	if assess.ConfidenceScore < 0.90 {
		t.Fatalf("unexpected assessment confidence score: %.2f", assess.ConfidenceScore)
	}

	// Assess suspicious source -> SUSPICIOUS classification (<0.40)
	susClaim := &domain.Claim{
		ClaimID:   "clm-sus",
		TenantID:  "tenant-XYZ",
		SourceURL: "https://questionable-news.xyz/gossip",
		Author:    "Anonymous Gossip",
	}
	susAssess, _ := agent.Assess(ctx, susClaim)
	if susAssess.Classification != "SUSPICIOUS" {
		t.Fatalf("expected SUSPICIOUS classification for questionable source, got %s", susAssess.Classification)
	}
}
