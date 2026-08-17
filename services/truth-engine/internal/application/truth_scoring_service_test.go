package application_test

import (
	"context"
	"testing"

	"github.com/agbofa/nexus/services/truth-engine/internal/application"
	"github.com/agbofa/nexus/services/truth-engine/internal/domain"
)

type inMemMisinfoRepo struct {
	reports map[string]domain.MisinfoReport
}

func newInMemMisinfoRepo() *inMemMisinfoRepo {
	return &inMemMisinfoRepo{reports: make(map[string]domain.MisinfoReport)}
}

func (r *inMemMisinfoRepo) SaveMisinfoReport(m domain.MisinfoReport) error {
	r.reports[m.StoryID] = m
	return nil
}

func (r *inMemMisinfoRepo) GetMisinfoReport(storyID string) (*domain.MisinfoReport, error) {
	rep, ok := r.reports[storyID]
	if !ok {
		return nil, domain.ErrMisinfoReportNotFound
	}
	return &rep, nil
}

func TestTruthScoringService_ScoreConfidence(t *testing.T) {
	misinfo := newInMemMisinfoRepo()
	ledger := newInMemLedgerRepo()
	pub := &mockPublisher{}

	svc := application.NewTruthScoringService(misinfo, ledger, nil, pub, nil)

	score, tier, err := svc.ScoreConfidence(context.Background(), "tenant-1", "story-200", 0.90, 0.90, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if score < 0.88 || tier != domain.ConfidenceTierVerifiedTruth {
		t.Fatalf("expected VERIFIED_TRUTH, got score=%.2f tier=%s", score, tier)
	}
}

func TestTruthScoringService_DetectMisinformation(t *testing.T) {
	misinfo := newInMemMisinfoRepo()
	ledger := newInMemLedgerRepo()
	provider := &mockLLMProvider{id: "ai-misinfo", name: "MisinfoDetector", content: "MISINFO detected"}
	pub := &mockPublisher{}

	svc := application.NewTruthScoringService(misinfo, ledger, provider, pub, nil)

	rep, err := svc.DetectMisinformation(
		context.Background(),
		"tenant-1",
		"story-300",
		"Sensational Title",
		"Content with synthetic narrative markers...",
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !rep.IsMisinfo || rep.RiskScore < 0.90 {
		t.Fatalf("expected misinfo flagged with high risk, got isMisinfo=%v risk=%.2f", rep.IsMisinfo, rep.RiskScore)
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected truth_engine.misinfo.detected event published")
	}
}
