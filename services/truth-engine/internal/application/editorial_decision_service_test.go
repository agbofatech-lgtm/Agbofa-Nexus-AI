package application_test

import (
	"context"
	"testing"

	"github.com/agbofa/nexus/services/truth-engine/internal/application"
)

func TestEditorialDecisionService_ValidateEditorialDecision(t *testing.T) {
	ledger := newInMemLedgerRepo()
	pub := &mockPublisher{}

	svc := application.NewEditorialDecisionService(ledger, pub, nil)

	dec, err := svc.ValidateEditorialDecision(context.Background(), "tenant-1", "story-400", 0.90, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !dec.Approved {
		t.Fatalf("expected decision approved")
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected truth_engine.story.verified event published")
	}

	dec, _ = svc.ValidateEditorialDecision(context.Background(), "tenant-1", "story-401", 0.70, false)
	if dec.Approved {
		t.Fatalf("expected decision rejected for low confidence")
	}
}
