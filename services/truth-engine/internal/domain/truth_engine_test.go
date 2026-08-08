package domain_test

import (
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/truth-engine/internal/domain"
)

func TestTruthStatePolicy_ValidTransitions(t *testing.T) {
	policy := domain.TruthStatePolicy{}

	validPairs := [][2]domain.TruthState{
		{domain.TruthStateSubmitted, domain.TruthStateInReview},
		{domain.TruthStateInReview, domain.TruthStateVerified},
		{domain.TruthStateInReview, domain.TruthStateDisputed},
		{domain.TruthStateDisputed, domain.TruthStateInReview},
		{domain.TruthStateVerified, domain.TruthStateDisputed},
		{domain.TruthStateSubmitted, domain.TruthStateRejected},
	}

	for _, pair := range validPairs {
		if err := policy.ValidateTransition(pair[0], pair[1]); err != nil {
			t.Fatalf("expected valid transition from %s to %s, got %v", pair[0], pair[1], err)
		}
	}
}

func TestTruthStatePolicy_InvalidTransitions(t *testing.T) {
	policy := domain.TruthStatePolicy{}

	invalidPairs := [][2]domain.TruthState{
		{domain.TruthStateSubmitted, domain.TruthStateVerified},
		{domain.TruthStateRejected, domain.TruthStateVerified},
	}

	for _, pair := range invalidPairs {
		if err := policy.ValidateTransition(pair[0], pair[1]); !errors.Is(err, domain.ErrInvalidTruthTransition) {
			t.Fatalf("expected ErrInvalidTruthTransition from %s to %s, got %v", pair[0], pair[1], err)
		}
	}
}

func TestConfidencePolicy_CalculateConfidence(t *testing.T) {
	policy := domain.ConfidencePolicy{}

	score, tier := policy.CalculateConfidence(0.9, 0.9, false)
	if score < 0.88 || tier != domain.ConfidenceTierVerifiedTruth {
		t.Fatalf("expected verified truth tier with high score, got score=%.2f tier=%s", score, tier)
	}

	score, tier = policy.CalculateConfidence(0.5, 0.6, false)
	if tier != domain.ConfidenceTierProvisional {
		t.Fatalf("expected provisional tier, got score=%.2f tier=%s", score, tier)
	}

	score, tier = policy.CalculateConfidence(0.9, 0.9, true)
	if score != 0.15 || tier != domain.ConfidenceTierMisinformation {
		t.Fatalf("expected misinfo tier and capped score 0.15, got score=%.2f tier=%s", score, tier)
	}
}

func TestGenerateProvenanceHash(t *testing.T) {
	ts := time.Now().Unix()
	h1 := domain.GenerateProvenanceHash("tenant-1", "story-1", "claim-1", "VERIFY_CLAIM", "agent-1", ts)
	h2 := domain.GenerateProvenanceHash("tenant-1", "story-1", "claim-1", "VERIFY_CLAIM", "agent-1", ts)
	if h1 != h2 || len(h1) != 64 {
		t.Fatalf("expected deterministic 64-char sha256 hex hash, got %s", h1)
	}
}
