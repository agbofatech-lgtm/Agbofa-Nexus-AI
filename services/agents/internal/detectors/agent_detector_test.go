package detectors

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockAIGateway struct {
	err            error
	confidence     float64
	classification string
}

func (m *mockAIGateway) SummarizeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (string, float64, error) {
	return "summary", 1.0, nil
}

func (m *mockAIGateway) ScoreTrendingTopic(ctx context.Context, tenantID, agentID string, topic *domain.TrendingTopic) (float64, error) {
	return 1.0, nil
}

func (m *mockAIGateway) AnalyzeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (*domain.DetectionResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.DetectionResult{
		ResultID:        "res-mock",
		TenantID:        tenantID,
		SignalID:        signal.SignalID,
		DetectorID:      agentID,
		DetectorName:    "Mock Detector",
		Classification:  m.classification,
		ConfidenceScore: m.confidence,
		Evidence: []domain.EvidenceItem{
			{EvidenceID: "ev-1", Type: "MOCK_EVIDENCE", Confidence: m.confidence},
		},
		DetectedAt: time.Now(),
	}, nil
}

func TestContentDetectorAgentDetectSuccess(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGateway{confidence: 0.94, classification: "BREAKING_NEWS"}

	detector := NewBreakingNewsDetector(tenantID, aiGateway)
	signal := domain.MonitorSignal{
		SignalID: "sig-1",
		TenantID: tenantID,
		Content:  "Breaking story",
	}

	res, err := detector.Detect(context.Background(), signal)
	if err != nil {
		t.Fatalf("expected detect success, got %v", err)
	}
	if res.ConfidenceScore != 0.94 || res.Classification != "BREAKING_NEWS" {
		t.Fatalf("unexpected detection result: %v", res)
	}
	if detector.Confidence() != 0.94 || len(detector.Evidence()) != 1 {
		t.Fatalf("confidence or evidence getter mismatch")
	}
}

func TestContentDetectorAgentCrossTenantViolation(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGateway{}

	detector := NewTrendIdentificationDetector(tenantID, aiGateway)
	signal := domain.MonitorSignal{
		SignalID: "sig-1",
		TenantID: "different-tenant",
	}

	_, err := detector.Detect(context.Background(), signal)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
}

func TestContentDetectorAgentAIGatewayError(t *testing.T) {
	tenantID := "tenant-test"
	expectedErr := errors.New("ai gateway offline")
	aiGateway := &mockAIGateway{err: expectedErr}

	detector := NewSentimentAnalysisDetector(tenantID, aiGateway)
	signal := domain.MonitorSignal{
		SignalID: "sig-1",
		TenantID: tenantID,
	}

	_, err := detector.Detect(context.Background(), signal)
	if err == nil {
		t.Fatalf("expected error from detect when ai gateway fails")
	}
	if detector.Status() != domain.AgentStatusError {
		t.Fatalf("expected ERROR status after detection failure, got %s", detector.Status())
	}
}

func TestCreateAllDetectorsCount(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGateway{}

	all := CreateAllDetectors(tenantID, aiGateway)
	if len(all) != 8 {
		t.Fatalf("expected 8 content detectors (AGT-009 to AGT-016), got %d", len(all))
	}
	expectedIDs := []string{"AGT-009", "AGT-010", "AGT-011", "AGT-012", "AGT-013", "AGT-014", "AGT-015", "AGT-016"}
	for _, id := range expectedIDs {
		if _, ok := all[id]; !ok {
			t.Fatalf("expected detector ID %s in registry map", id)
		}
	}
}
