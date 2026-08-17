package detectors

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockCredRepo struct {
	scores map[string]*domain.SourceCredibilityScore
}

func (m *mockCredRepo) SaveCredibility(ctx context.Context, tenantID string, score *domain.SourceCredibilityScore) error {
	return nil
}

func (m *mockCredRepo) GetCredibility(ctx context.Context, tenantID, sourceID string) (*domain.SourceCredibilityScore, error) {
	s, ok := m.scores[sourceID]
	if !ok {
		return nil, errors.New("source credibility not found")
	}
	return s, nil
}

func (m *mockCredRepo) UpsertCredibility(ctx context.Context, tenantID string, score *domain.SourceCredibilityScore) error {
	return nil
}

func TestSourceCredibilityAssessor_InterfaceAndUnknownSource(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	repo := &mockCredRepo{scores: make(map[string]*domain.SourceCredibilityScore)}

	assessor := NewSourceCredibilityAssessor(ai, bus, repo)

	if assessor.ID() != "AGT-012" {
		t.Errorf("expected ID AGT-012, got %s", assessor.ID())
	}
	if assessor.Name() != "Source Credibility Assessor" {
		t.Errorf("expected Name Source Credibility Assessor, got %s", assessor.Name())
	}
	if assessor.Version() != "1.0.0" {
		t.Errorf("expected Version 1.0.0, got %s", assessor.Version())
	}

	// 1. Cross-tenant Initialize check
	err := assessor.Initialize(ctx, "", nil)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenantID, got %v", err)
	}

	// 2. Valid Initialize
	err = assessor.Initialize(ctx, "tenant-cred-1", map[string]string{"env": "test"})
	if err != nil {
		t.Fatalf("unexpected error initializing SourceCredibilityAssessor: %v", err)
	}

	// 3. HealthCheck
	health, err := assessor.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Detect unknown source starts at 0.5 neutral baseline
	sigUnknown := &domain.MonitorSignal{
		SignalID: "sig-unknown-1",
		TenantID: "tenant-cred-1",
		Author:   "unknown_source_01",
		URL:      "https://example.com/news/1",
	}
	resUnknown, err := assessor.Detect(ctx, sigUnknown)
	if err != nil || resUnknown.Metadata["is_unknown_source"] != "true" {
		t.Fatalf("expected unknown source=true, got %v (err=%v)", resUnknown.Metadata["is_unknown_source"], err)
	}
	tier, score, evidence, errClass := assessor.Classify(ctx, sigUnknown)
	if errClass != nil || len(evidence) == 0 {
		t.Fatalf("unexpected error on Classify: %v", errClass)
	}
	if tier != "UNKNOWN" && tier != "MEDIUM" {
		t.Errorf("expected UNKNOWN/MEDIUM tier for first-time source, got %s", tier)
	}
	if score < 0.45 || score > 0.55 {
		t.Errorf("expected score around 0.5 neutral baseline, got %f", score)
	}
}

func TestSourceCredibilityAssessor_WeightedFactorsAndTiers(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	repo := &mockCredRepo{
		scores: map[string]*domain.SourceCredibilityScore{
			"reuters.gov": {
				SourceID:   "reuters.gov",
				TenantID:   "tenant-cred-1",
				TrustScore: 0.95,
			},
		},
	}

	assessor := NewSourceCredibilityAssessor(ai, bus, repo)
	_ = assessor.Initialize(ctx, "tenant-cred-1", nil)

	// 1. High credibility source with .gov domain authority and verification counts
	sigHigh := &domain.MonitorSignal{
		SignalID: "sig-high-1",
		TenantID: "tenant-cred-1",
		Author:   "reuters.gov",
		URL:      "https://reuters.gov/article/1",
	}
	resHigh, _ := assessor.Detect(ctx, sigHigh)
	if resHigh.Metadata["is_unknown_source"] != "false" {
		t.Errorf("expected is_unknown_source=false for repo source")
	}

	for i := 0; i < 5; i++ {
		_, _ = assessor.Detect(ctx, sigHigh)
	}
	tierHigh, scoreHigh, _, _ := assessor.Classify(ctx, sigHigh)
	if tierHigh != "HIGH" || scoreHigh <= 0.80 {
		t.Errorf("expected HIGH tier >0.8 for verified .gov source, got tier=%s score=%f", tierHigh, scoreHigh)
	}

	// 2. Low credibility source with repeated corrections
	sigLow := &domain.MonitorSignal{
		SignalID: "sig-low-1",
		TenantID: "tenant-cred-1",
		Author:   "unverified_blog",
		URL:      "https://randomblog.com/post/1",
		Content:  "CORRECTION: previous claim retracted due to error",
	}
	for i := 0; i < 4; i++ {
		_, _ = assessor.Detect(ctx, sigLow)
	}
	tierLow, scoreLow, _, _ := assessor.Classify(ctx, sigLow)
	if scoreLow >= 0.80 {
		t.Errorf("expected correction rate to lower score below 0.80, got %f (tier=%s)", scoreLow, tierLow)
	}

	// 3. Analyze routes complex assessments through AIGatewayService
	resAnalyze, err := assessor.Analyze(ctx, sigHigh)
	if err != nil || resAnalyze == nil {
		t.Fatalf("unexpected error on Analyze: %v", err)
	}
	if resAnalyze.Metadata["ai_credibility_assessment"] != "AI Summarized Breaking Event" {
		t.Errorf("expected AI assessment from gateway, got %s", resAnalyze.Metadata["ai_credibility_assessment"])
	}
}
