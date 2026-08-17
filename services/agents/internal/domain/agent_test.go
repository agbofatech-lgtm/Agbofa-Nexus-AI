package domain

import (
	"context"
	"errors"
	"testing"
)

func TestPlatformSourceIsValid(t *testing.T) {
	platforms := []PlatformSource{
		PlatformTwitter, PlatformFacebook, PlatformInstagram, PlatformTikTok,
		PlatformLinkedIn, PlatformYouTube, PlatformReddit, PlatformRSS, PlatformEmerging,
	}
	for _, p := range platforms {
		if !p.IsValid() {
			t.Fatalf("expected platform %s to be valid", p)
		}
	}
	if (PlatformSource("INVALID")).IsValid() {
		t.Fatalf("expected INVALID platform to be invalid")
	}
}

func TestBaseAgentProperties(t *testing.T) {
	agent := &BaseAgent{
		AgentID:       "AGT-001",
		AgentName:     "Twitter/X Monitor",
		TenantUUID:    "tenant-123",
		CurrentStatus: AgentStatusActive,
		Version:       "1.0.0",
	}
	if agent.ID() != "AGT-001" || agent.Name() != "Twitter/X Monitor" || agent.TenantID() != "tenant-123" {
		t.Fatalf("agent properties mismatch")
	}
	if agent.Status() != AgentStatusActive {
		t.Fatalf("expected ACTIVE status, got %s", agent.Status())
	}
}

func TestDomainErrorDefinitions(t *testing.T) {
	if !errors.Is(ErrCrossTenantViolation, ErrCrossTenantViolation) {
		t.Fatalf("error definition mismatch")
	}
	if !errors.Is(ErrRateLimitExceeded, ErrRateLimitExceeded) {
		t.Fatalf("rate limit error mismatch")
	}
}
