package verification

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockFactCheckAIGateway struct {
	verifyCalled bool
	err          error
	customRes    *domain.VerificationResult
}

func (m *mockFactCheckAIGateway) SummarizeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (string, float64, error) {
	return "summary", 0.9, nil
}
func (m *mockFactCheckAIGateway) ScoreTrendingTopic(ctx context.Context, tenantID, agentID string, topic *domain.TrendingTopic) (float64, error) {
	return 0.8, nil
}
func (m *mockFactCheckAIGateway) AnalyzeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (*domain.DetectionResult, error) {
	return &domain.DetectionResult{}, nil
}
func (m *mockFactCheckAIGateway) VerifyDetection(ctx context.Context, tenantID, agentID string, detection *domain.DetectionResult) (*domain.VerificationResult, error) {
	m.verifyCalled = true
	if m.err != nil {
		return nil, m.err
	}
	if m.customRes != nil {
		return m.customRes, nil
	}
	return &domain.VerificationResult{
		VerificationID:  "ver-ai-1",
		TenantID:        tenantID,
		AgentID:         agentID,
		Status:          domain.VerificationStatusVerified,
		ConfidenceScore: 0.93,
		Evidence: []domain.EvidenceItem{
			{
				EvidenceID:  "ev-ai-1",
				Type:        "LLM_VERIFICATION",
				Description: "Verified via AIGatewayService",
				Confidence:  0.93,
			},
		},
	}, nil
}
func (m *mockFactCheckAIGateway) PredictVirality(ctx context.Context, tenantID, storyID string, metadata map[string]string) (*domain.ViralityPrediction, error) {
	return &domain.ViralityPrediction{}, nil
}
func (m *mockFactCheckAIGateway) OptimizeEngagement(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.EngagementOptimization, error) {
	return &domain.EngagementOptimization{}, nil
}
func (m *mockFactCheckAIGateway) ModelTrendLifecycle(ctx context.Context, tenantID, topicID string, metadata map[string]string) (*domain.TrendLifecycleModel, error) {
	return &domain.TrendLifecycleModel{}, nil
}
func (m *mockFactCheckAIGateway) ForecastPerformance(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.ContentPerformanceForecast, error) {
	return &domain.ContentPerformanceForecast{}, nil
}
func (m *mockFactCheckAIGateway) DetectAnomalies(ctx context.Context, tenantID string, platform domain.PlatformSource, metadata map[string]string) (*domain.AnomalyDetectionEvent, error) {
	return &domain.AnomalyDetectionEvent{}, nil
}

func TestFactCheckAgentLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewFactCheckAgent(nil)
	ctx := context.Background()

	if agent.ID() != "AGT-017" || agent.Name() != "Fact-Check Agent" {
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

func TestFactCheckAgentVerifyKnownFacts(t *testing.T) {
	agent := NewFactCheckAgent(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	testCases := []struct {
		claimText   string
		wantVerdict string
		minConf     float64
	}{
		{"gdp grew by 4% in q2", "TRUE", 0.90},
		{"unemployment dropped to 0%", "FALSE", 0.95},
		{"new tax bill doubles revenue", "HALF_TRUE", 0.80},
		{"election results manipulated by 50%", "FALSE", 0.95},
	}

	for _, tc := range testCases {
		claim := &domain.Claim{
			ClaimID:      "clm-test-" + tc.wantVerdict,
			TenantID:     "tenant-XYZ",
			ClaimText:    tc.claimText,
			ClaimType:    "STATEMENT_OF_FACT",
			IsVerifiable: true,
		}

		res, err := agent.Verify(ctx, claim)
		if err != nil {
			t.Fatalf("unexpected error verifying known claim %q: %v", tc.claimText, err)
		}
		if res.Verdict != tc.wantVerdict {
			t.Fatalf("for claim %q: expected verdict %s, got %s", tc.claimText, tc.wantVerdict, res.Verdict)
		}
		if res.ConfidenceScore < tc.minConf {
			t.Fatalf("for claim %q: expected confidence >= %.2f, got %.2f", tc.claimText, tc.minConf, res.ConfidenceScore)
		}
		if len(res.Sources) == 0 {
			t.Fatalf("for claim %q: expected cited sources in result", tc.claimText)
		}
		if len(res.Evidence) == 0 {
			t.Fatalf("for claim %q: expected evidence items in result", tc.claimText)
		}
	}
}

func TestFactCheckAgentVerifyWithAIGateway(t *testing.T) {
	mockAI := &mockFactCheckAIGateway{}
	agent := NewFactCheckAgent(mockAI)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	claim := &domain.Claim{
		ClaimID:      "clm-uncatalogued-1",
		TenantID:     "tenant-XYZ",
		ClaimText:    "New solar panels operate with zero percent loss",
		ClaimType:    "STATEMENT_OF_FACT",
		IsVerifiable: true,
	}

	res, err := agent.Verify(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on uncatalogued claim verification: %v", err)
	}

	if !mockAI.verifyCalled {
		t.Fatalf("expected AIGatewayService VerifyDetection to be called")
	}
	if res.Verdict != "FALSE" { // matched semantic pattern 'zero percent' -> FALSE
		t.Fatalf("expected verdict FALSE, got %s", res.Verdict)
	}
	if res.ConfidenceScore != 0.93 { // from mockAI
		t.Fatalf("expected confidence 0.93 from AI Gateway, got %.2f", res.ConfidenceScore)
	}
	if len(res.Evidence) == 0 {
		t.Fatalf("expected evidence items combining local and AI Gateway evidence")
	}
}

func TestFactCheckAgentCorroborateAndAssess(t *testing.T) {
	agent := NewFactCheckAgent(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	claim := &domain.Claim{
		ClaimID:      "clm-cor-1",
		TenantID:     "tenant-XYZ",
		ClaimText:    "gdp grew by 4% in q2",
		ClaimType:    "STATEMENT_OF_FACT",
		IsVerifiable: true,
	}

	corrob, err := agent.Corroborate(ctx, claim, nil)
	if err != nil {
		t.Fatalf("unexpected error on Corroborate: %v", err)
	}
	if !corrob.Corroborated || corrob.IndependentSourceCount < 2 {
		t.Fatalf("expected claim to be corroborated by independent fact sources")
	}

	assess, err := agent.Assess(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on Assess: %v", err)
	}
	if assess.AssessmentType != "FACT_CHECK" || assess.Classification != "TRUE" {
		t.Fatalf("unexpected assessment classification: %s", assess.Classification)
	}
	if assess.ConfidenceScore < 0.90 {
		t.Fatalf("unexpected assessment confidence: %.2f", assess.ConfidenceScore)
	}
}
