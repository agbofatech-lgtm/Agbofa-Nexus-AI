package domain_test

import (
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/analytics/internal/domain"
)

func TestContinuousLearningSafetyPolicy_ValidateLearningAdaptation(t *testing.T) {
	policy := domain.ContinuousLearningSafetyPolicy{}

	auto, status := policy.ValidateLearningAdaptation(0.95, true)
	if auto || status != "GOVERNANCE_APPROVAL_REQUIRED" {
		t.Fatalf("expected governance approval required, got auto=%v status=%s", auto, status)
	}

	auto, status = policy.ValidateLearningAdaptation(0.50, false)
	if auto || status != "GOVERNANCE_APPROVAL_REQUIRED" {
		t.Fatalf("expected governance approval required for low score, got auto=%v status=%s", auto, status)
	}
}

func TestValidateTenantIsolation(t *testing.T) {
	if err := domain.ValidateTenantIsolation("tenant-1", "tenant-1"); err != nil {
		t.Fatalf("expected same tenant to pass, got %v", err)
	}
	if err := domain.ValidateTenantIsolation("tenant-1", "tenant-2"); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
}

func TestGenerateAnalyticsHash(t *testing.T) {
	ts := time.Now().Unix()
	h1 := domain.GenerateAnalyticsHash("tenant-1", "story-1", "OBSERVED_DATA", "COLLECT", ts)
	h2 := domain.GenerateAnalyticsHash("tenant-1", "story-1", "OBSERVED_DATA", "COLLECT", ts)
	if h1 != h2 || len(h1) != 64 {
		t.Fatalf("expected deterministic 64-char sha256 hex hash, got %s", h1)
	}
}
