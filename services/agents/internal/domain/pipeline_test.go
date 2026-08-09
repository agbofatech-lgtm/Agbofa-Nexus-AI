package domain

import (
	"testing"
	"time"
)

func TestPipelineResultProperties(t *testing.T) {
	res := &PipelineResult{
		ExecutionID:   "exec-100",
		TenantID:      "tenant-xyz",
		AgentID:       "AGT-025",
		Stage:         PipelineStageIngestion,
		Status:        PipelineStatusSuccess,
		OutputPayload: "Ingested monitor signals",
		ExecutedAt:    time.Now(),
	}

	if res.ExecutionID != "exec-100" || res.AgentID != "AGT-025" {
		t.Fatalf("unexpected pipeline result properties")
	}
	if res.Stage != PipelineStageIngestion || res.Status != PipelineStatusSuccess {
		t.Fatalf("unexpected pipeline stage or status")
	}
}

func TestPipelineStateAndFeedbackSignalProperties(t *testing.T) {
	state := &PipelineState{
		StateID:      "st-1",
		TenantID:     "tenant-xyz",
		AgentID:      "AGT-026",
		CurrentStage: PipelineStageStoryGraph,
		LastStatus:   PipelineStatusSuccess,
	}
	if state.CurrentStage != PipelineStageStoryGraph {
		t.Fatalf("unexpected pipeline state stage")
	}

	signal := &FeedbackSignal{
		SignalID:    "fb-1",
		TenantID:    "tenant-xyz",
		TargetAgent: "AGT-009",
		ScoreDelta:  0.05,
		Reason:      "Positive downstream virality",
	}
	if signal.TargetAgent != "AGT-009" || signal.ScoreDelta != 0.05 {
		t.Fatalf("unexpected feedback signal properties")
	}
}

func TestPipelineEventConstantDefinitions(t *testing.T) {
	if EventTypeComplianceClearance != "EVT-025" {
		t.Fatalf("expected EVT-025, got %s", EventTypeComplianceClearance)
	}
	if EventTypePipelineExecutionCompleted != "EVT-045" {
		t.Fatalf("expected EVT-045, got %s", EventTypePipelineExecutionCompleted)
	}
}

func TestIMP017DPipelineDomainProperties(t *testing.T) {
	payload := &PipelinePayload{
		PayloadID:       "pay-001",
		TenantID:        "tenant-xyz",
		SignalID:        "sig-100",
		ClaimID:         "clm-100",
		Content:         "Verified breaking news story",
		ConfidenceScore: 0.92,
		ConfidenceTier:  "VERIFIED_TRUTH",
		Verdict:         "TRUE",
	}
	if payload.PayloadID != "pay-001" || payload.ConfidenceTier != "VERIFIED_TRUTH" {
		t.Fatalf("unexpected pipeline payload properties")
	}

	res := &PipelineResult{
		ResultID:       "res-001",
		TenantID:       "tenant-xyz",
		PayloadID:      "pay-001",
		Status:         PipelineStatusSuccess,
		TargetPipeline: "CONTENT_FACTORY",
		Priority:       "HIGH",
		RoutedAt:       time.Now(),
	}
	if res.ResultID != "res-001" || res.TargetPipeline != "CONTENT_FACTORY" {
		t.Fatalf("unexpected pipeline result properties")
	}

	report := &PipelineReport{
		ReportID:    "rep-001",
		TenantID:    "tenant-xyz",
		PayloadID:   "pay-001",
		AgentID:     "AGT-025",
		Metrics:     map[string]interface{}{"processed": 100},
		Anomalies:   []string{"none"},
		GeneratedAt: time.Now(),
	}
	if report.ReportID != "rep-001" || report.AgentID != "AGT-025" {
		t.Fatalf("unexpected pipeline report properties")
	}
}
