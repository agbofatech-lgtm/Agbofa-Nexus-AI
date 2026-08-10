package verification

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockAIGateway struct {
	err         error
	confidence  float64
	status      domain.VerificationStatus
	uncertainty float64
}

func (m *mockAIGateway) SummarizeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (string, float64, error) {
	return "summary", 1.0, nil
}

func (m *mockAIGateway) ScoreTrendingTopic(ctx context.Context, tenantID, agentID string, topic *domain.TrendingTopic) (float64, error) {
	return 1.0, nil
}

func (m *mockAIGateway) AnalyzeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (*domain.DetectionResult, error) {
	return &domain.DetectionResult{}, nil
}

func (m *mockAIGateway) VerifyDetection(ctx context.Context, tenantID, agentID string, detection *domain.DetectionResult) (*domain.VerificationResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.VerificationResult{
		VerificationID:    "ver-mock",
		TenantID:          tenantID,
		SignalID:          detection.SignalID,
		DetectionID:       detection.ResultID,
		AgentID:           agentID,
		AgentName:         "Mock Verifier",
		Status:            m.status,
		ConfidenceScore:   m.confidence,
		UncertaintyMetric: m.uncertainty,
		Evidence: []domain.EvidenceItem{
			{EvidenceID: "ev-ver-1", Type: "MOCK_EVIDENCE", Confidence: m.confidence},
		},
		VerifiedAt: time.Now(),
	}, nil
}

func TestContentVerificationAgentVerifySuccess(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGateway{
		confidence:  0.96,
		status:      domain.VerificationStatusVerified,
		uncertainty: 0.04,
	}

	verifier := NewFactCheckingAgent(tenantID, aiGateway)
	detection := domain.DetectionResult{
		ResultID: "det-1",
		TenantID: tenantID,
		SignalID: "sig-1",
	}

	res, err := verifier.Verify(context.Background(), detection)
	if err != nil {
		t.Fatalf("expected verify success, got %v", err)
	}
	if res.ConfidenceScore != 0.96 || res.Status != domain.VerificationStatusVerified {
		t.Fatalf("unexpected verification result: %v", res)
	}
	if verifier.Confidence() != 0.96 || verifier.VerificationStatus() != domain.VerificationStatusVerified {
		t.Fatalf("confidence or status getter mismatch")
	}
	// Verify SHA-256 evidence chain hash
	if res.Metadata["evidence_chain_sha256"] == "" {
		t.Fatalf("expected evidence_chain_sha256 in verification metadata")
	}
}

func TestDebunkedClaimCacheLookup(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGateway{
		err: errors.New("ai gateway should not be called when debunked cache hits"),
	}
	cache := NewDebunkedClaimCache("")

	verifier := NewMisinformationFlaggingAgent(tenantID, aiGateway, cache)
	detection := domain.DetectionResult{
		ResultID:       "det-hoax",
		TenantID:       tenantID,
		SignalID:       "sig-hoax",
		Classification: "fake breaking news sample claim",
	}

	res, err := verifier.Verify(context.Background(), detection)
	if err != nil {
		t.Fatalf("expected debunked cache hit success, got %v", err)
	}
	if res.Status != domain.VerificationStatusDebunked || res.ConfidenceScore != 0.99 {
		t.Fatalf("expected DEBUNKED status with 0.99 confidence, got %v (conf %.2f)", res.Status, res.ConfidenceScore)
	}
	if res.Metadata["debunked_cache_hit"] != "true" || res.Metadata["evidence_chain_sha256"] == "" {
		t.Fatalf("expected debunked_cache_hit and evidence_chain_sha256 in metadata")
	}
}

func TestContentVerificationAgentCrossTenantViolation(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGateway{}

	verifier := NewCrossReferenceAgent(tenantID, aiGateway)
	detection := domain.DetectionResult{
		ResultID: "det-1",
		TenantID: "different-tenant",
	}

	_, err := verifier.Verify(context.Background(), detection)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
}

func TestContentVerificationAgentAIGatewayError(t *testing.T) {
	tenantID := "tenant-test"
	expectedErr := errors.New("ai gateway verifier offline")
	aiGateway := &mockAIGateway{err: expectedErr}

	verifier := NewBiasDetectionAgent(tenantID, aiGateway)
	detection := domain.DetectionResult{
		ResultID: "det-1",
		TenantID: tenantID,
	}

	_, err := verifier.Verify(context.Background(), detection)
	if err == nil {
		t.Fatalf("expected error from verify when ai gateway fails")
	}
	if verifier.VerificationStatus() != domain.VerificationStatusError {
		t.Fatalf("expected ERROR verification status after failure, got %s", verifier.VerificationStatus())
	}
}

func TestConfidenceScoringAgentBayesianAggregationAndQuorum(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGateway{}

	scorer := NewConfidenceScoringAgent(tenantID, aiGateway)
	results := []domain.VerificationResult{
		{
			VerificationID:    "ver-1",
			TenantID:          tenantID,
			AgentID:           "AGT-017", // Weight 1.25
			ConfidenceScore:   0.90,
			Status:            domain.VerificationStatusVerified,
			Evidence: []domain.EvidenceItem{
				{EvidenceID: "ev-1", Confidence: 0.90},
			},
		},
		{
			VerificationID:    "ver-2",
			TenantID:          tenantID,
			AgentID:           "AGT-023", // Weight 1.30
			ConfidenceScore:   0.80,
			Status:            domain.VerificationStatusVerified,
			Evidence: []domain.EvidenceItem{
				{EvidenceID: "ev-2", Confidence: 0.80},
			},
		},
	}

	agg, err := scorer.AggregateConfidence(context.Background(), tenantID, results)
	if err != nil {
		t.Fatalf("expected aggregate success, got %v", err)
	}
	// Weighted average: (0.90*1.25 + 0.80*1.30) / (1.25 + 1.30) = (1.125 + 1.04) / 2.55 = 2.165 / 2.55 = 0.8490...
	if agg.ConfidenceScore < 0.84 || agg.ConfidenceScore > 0.86 {
		t.Fatalf("expected weighted confidence ~0.849, got %.3f", agg.ConfidenceScore)
	}
	if agg.Status != domain.VerificationStatusVerified {
		t.Fatalf("expected quorum VERIFIED status, got %s", agg.Status)
	}
	if agg.Metadata["evidence_chain_sha256"] == "" || agg.Metadata["weighted_formula"] == "" {
		t.Fatalf("expected evidence_chain_sha256 and weighted_formula in metadata")
	}
}

func TestCreateAllVerifiersCount(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGateway{}

	all := CreateAllVerifiers(tenantID, aiGateway)
	if len(all) != 8 {
		t.Fatalf("expected 8 verification agents (AGT-017 to AGT-024), got %d", len(all))
	}
	expectedIDs := []string{"AGT-017", "AGT-018", "AGT-019", "AGT-020", "AGT-021", "AGT-022", "AGT-023", "AGT-024"}
	for _, id := range expectedIDs {
		if _, ok := all[id]; !ok {
			t.Fatalf("expected verifier ID %s in registry map", id)
		}
	}
}
