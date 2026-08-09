package interfaces

import (
	"context"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type dummyMonitorAgent struct {
	id       string
	tenantID string
}

func (d *dummyMonitorAgent) ID() string                    { return d.id }
func (d *dummyMonitorAgent) Name() string                  { return "Dummy Agent" }
func (d *dummyMonitorAgent) TenantID() string              { return d.tenantID }
func (d *dummyMonitorAgent) Status() domain.AgentStatus    { return domain.AgentStatusActive }
func (d *dummyMonitorAgent) Platform() domain.PlatformSource { return domain.PlatformTwitter }
func (d *dummyMonitorAgent) Scan(ctx context.Context, tenantID string, keywords []string) ([]domain.MonitorSignal, error) {
	return []domain.MonitorSignal{
		{SignalID: "sig-dummy", TenantID: tenantID, Author: "@dummy", DetectedAt: time.Now()},
	}, nil
}
func (d *dummyMonitorAgent) GetRateLimitStatus(ctx context.Context) (int, error) { return 1000, nil }
func (d *dummyMonitorAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	return nil
}

type dummyDetectorAgent struct {
	id       string
	tenantID string
}

func (d *dummyDetectorAgent) ID() string                 { return d.id }
func (d *dummyDetectorAgent) Name() string               { return "Dummy Detector" }
func (d *dummyDetectorAgent) TenantID() string           { return d.tenantID }
func (d *dummyDetectorAgent) Status() domain.AgentStatus { return domain.AgentStatusActive }
func (d *dummyDetectorAgent) Detect(ctx context.Context, signal domain.MonitorSignal) (*domain.DetectionResult, error) {
	return &domain.DetectionResult{
		ResultID:        "res-dummy",
		TenantID:        d.tenantID,
		SignalID:        signal.SignalID,
		DetectorID:      d.id,
		DetectorName:    "Dummy Detector",
		Classification:  "BREAKING_NEWS",
		ConfidenceScore: 0.95,
	}, nil
}
func (d *dummyDetectorAgent) Confidence() float64       { return 0.95 }
func (d *dummyDetectorAgent) Evidence() []domain.EvidenceItem { return nil }
func (d *dummyDetectorAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	return nil
}

type dummyVerificationAgent struct {
	id       string
	tenantID string
}

func (d *dummyVerificationAgent) ID() string                     { return d.id }
func (d *dummyVerificationAgent) Name() string                   { return "Dummy Verifier" }
func (d *dummyVerificationAgent) TenantID() string               { return d.tenantID }
func (d *dummyVerificationAgent) Status() domain.VerificationStatus {
	return domain.VerificationStatusVerified
}
func (d *dummyVerificationAgent) Verify(ctx context.Context, detection domain.DetectionResult) (*domain.VerificationResult, error) {
	return &domain.VerificationResult{
		VerificationID:  "ver-dummy",
		TenantID:        d.tenantID,
		SignalID:        detection.SignalID,
		DetectionID:     detection.ResultID,
		AgentID:         d.id,
		Status:          domain.VerificationStatusVerified,
		ConfidenceScore: 0.96,
	}, nil
}
func (d *dummyVerificationAgent) Confidence() float64       { return 0.96 }
func (d *dummyVerificationAgent) Evidence() []domain.EvidenceItem { return nil }
func (d *dummyVerificationAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	return nil
}

type dummyPipelineAgent struct {
	id       string
	tenantID string
}

func (d *dummyPipelineAgent) ID() string                 { return d.id }
func (d *dummyPipelineAgent) Name() string               { return "Dummy Pipeline" }
func (d *dummyPipelineAgent) TenantID() string           { return d.tenantID }
func (d *dummyPipelineAgent) Status() domain.AgentStatus { return domain.AgentStatusActive }
func (d *dummyPipelineAgent) Stage() domain.PipelineStage { return domain.PipelineStageIngestion }
func (d *dummyPipelineAgent) UpstreamAgents() []string   { return nil }
func (d *dummyPipelineAgent) DownstreamAgents() []string { return nil }
func (d *dummyPipelineAgent) ExecutePipeline(ctx context.Context, payload map[string]string) (*domain.PipelineResult, error) {
	return &domain.PipelineResult{
		ExecutionID:   "exec-dummy",
		TenantID:      d.tenantID,
		AgentID:       d.id,
		Stage:         domain.PipelineStageIngestion,
		Status:        domain.PipelineStatusSuccess,
		OutputPayload: "Executed dummy pipeline",
	}, nil
}
func (d *dummyPipelineAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	return nil
}

type dummyPredictiveEngine struct {
	id       string
	tenantID string
}

func (d *dummyPredictiveEngine) ID() string       { return d.id }
func (d *dummyPredictiveEngine) Name() string     { return "Dummy Predictor" }
func (d *dummyPredictiveEngine) TenantID() string { return d.tenantID }
func (d *dummyPredictiveEngine) ExecutePrediction(ctx context.Context, payload map[string]string) (interface{}, error) {
	return &domain.ViralityPrediction{
		PredictionID:  "pred-dummy",
		TenantID:      d.tenantID,
		StoryID:       "story-dummy",
		ViralityScore: 0.95,
	}, nil
}

func TestGRPCServerScanAndHealthHandshake(t *testing.T) {
	orchestrator := application.NewMonitorOrchestrator(nil, nil)
	detectorOrch := application.NewDetectorOrchestrator(nil, nil)
	verificationOrch := application.NewVerificationOrchestrator(nil, nil)
	pipelineOrch := application.NewPipelineOrchestrator(nil, nil, nil)
	predictionOrch := application.NewPredictionOrchestrator(nil, nil, nil)
	server := NewGRPCServer(orchestrator, detectorOrch, verificationOrch, pipelineOrch, predictionOrch, "9090")
	server.running = true

	agent := &dummyMonitorAgent{id: "AGT-001", tenantID: "tenant-dummy"}

	req := application.ScanRequestDTO{
		TenantID: "tenant-dummy",
		AgentID:  "AGT-001",
		Keywords: []string{"test"},
	}
	resp, err := server.HandleScanRequest(context.Background(), agent, req)
	if err != nil {
		t.Fatalf("expected successful scan request, got %v", err)
	}
	if resp.SignalsCount != 1 || resp.Signals[0].SignalID != "sig-dummy" {
		t.Fatalf("unexpected scan response: %v", resp)
	}

	healthResp, err := server.HandleHealthRequest(context.Background(), agent)
	if err != nil {
		t.Fatalf("expected health request success, got %v", err)
	}
	if healthResp.RemainingQuota != 1000 {
		t.Fatalf("unexpected health quota: %d", healthResp.RemainingQuota)
	}

	// Test Detector Request Handshake
	detAgent := &dummyDetectorAgent{id: "AGT-009", tenantID: "tenant-dummy"}
	detReq := application.DetectionRequestDTO{
		TenantID: "tenant-dummy",
		AgentID:  "AGT-009",
		Signal:   domain.MonitorSignal{SignalID: "sig-dummy", TenantID: "tenant-dummy"},
	}
	detResp, err := server.HandleDetectionRequest(context.Background(), detAgent, detReq)
	if err != nil {
		t.Fatalf("expected successful detection request, got %v", err)
	}
	if detResp.Result.Classification != "BREAKING_NEWS" || detResp.Result.ConfidenceScore != 0.95 {
		t.Fatalf("unexpected detection response: %v", detResp)
	}

	// Test Verification Request Handshake
	verAgent := &dummyVerificationAgent{id: "AGT-017", tenantID: "tenant-dummy"}
	verReq := application.VerificationRequestDTO{
		TenantID:  "tenant-dummy",
		AgentID:   "AGT-017",
		Detection: *detResp.Result,
	}
	verResp, err := server.HandleVerificationRequest(context.Background(), verAgent, verReq)
	if err != nil {
		t.Fatalf("expected successful verification request, got %v", err)
	}
	if verResp.Result.Status != domain.VerificationStatusVerified || verResp.Result.ConfidenceScore != 0.96 {
		t.Fatalf("unexpected verification response: %v", verResp)
	}

	// Test Pipeline Request Handshake
	pipeAgent := &dummyPipelineAgent{id: "AGT-025", tenantID: "tenant-dummy"}
	pipeReq := application.PipelineRequestDTO{
		TenantID: "tenant-dummy",
		AgentID:  "AGT-025",
		Stage:    "INGESTION",
		Payload:  map[string]string{},
	}
	pipeResp, err := server.HandlePipelineRequest(context.Background(), pipeAgent, pipeReq)
	if err != nil {
		t.Fatalf("expected successful pipeline request, got %v", err)
	}
	if pipeResp.Result.ExecutionID != "exec-dummy" {
		t.Fatalf("unexpected pipeline response: %v", pipeResp)
	}

	fleetHealth, err := server.HandleFleetHealthRequest(context.Background(), "tenant-dummy")
	if err != nil {
		t.Fatalf("expected successful fleet health request, got %v", err)
	}
	if fleetHealth.TotalAgents != 0 || !fleetHealth.Phase1ServicesOK {
		t.Fatalf("unexpected fleet health report: %v", fleetHealth)
	}

	// Test Predictive Request Handshake
	predEngine := &dummyPredictiveEngine{id: "PRED-001", tenantID: "tenant-dummy"}
	predReq := application.PredictiveRequestDTO{
		TenantID: "tenant-dummy",
		EngineID: "PRED-001",
		Payload:  map[string]string{"story_id": "story-dummy"},
	}
	predResp, err := server.HandlePredictiveRequest(context.Background(), predEngine, predReq)
	if err != nil {
		t.Fatalf("expected successful predictive request, got %v", err)
	}
	if predResp.EngineID != "PRED-001" {
		t.Fatalf("unexpected predictive response: %v", predResp)
	}

	if err := server.Stop(context.Background()); err != nil {
		t.Fatalf("expected clean server stop, got %v", err)
	}
}

type dummyPersonalizationEngine struct {
	id       string
	name     string
	tenantID string
}

func (e *dummyPersonalizationEngine) ID() string       { return e.id }
func (e *dummyPersonalizationEngine) Name() string     { return e.name }
func (e *dummyPersonalizationEngine) TenantID() string { return e.tenantID }
func (e *dummyPersonalizationEngine) ExecutePersonalization(ctx context.Context, payload map[string]string) (interface{}, error) {
	if tenant, ok := payload["tenant_id"]; !ok || tenant != e.tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return map[string]string{"result": "personalized-dummy"}, nil
}

func TestAgentGRPCServer_PersonalizationAndHealthEndpoints(t *testing.T) {
	ctx := context.Background()
	persOrch := application.NewPersonalizationOrchestrator(nil, nil)
	server := NewGRPCServer(nil, nil, nil, nil, nil, "9090").WithPersonalization(persOrch)
	server.mu.Lock()
	server.running = true
	server.mu.Unlock()

	// 1. Test HandlePersonalizationRequest routing and tenant isolation
	eng := &dummyPersonalizationEngine{id: "PERS-001", name: "Reader Feed", tenantID: "tenant-f5"}
	_, err := server.HandlePersonalizationRequest(ctx, eng, application.PersonalizationRequestDTO{
		TenantID: "wrong-tenant",
		EngineID: "PERS-001",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	resp, err := server.HandlePersonalizationRequest(ctx, eng, application.PersonalizationRequestDTO{
		TenantID: "tenant-f5",
		EngineID: "PERS-001",
		ReaderID: "reader-1",
	})
	if err != nil || resp == nil || resp.EngineID != "PERS-001" {
		t.Fatalf("expected successful personalization response, got resp=%v err=%v", resp, err)
	}

	// 2. Test HandleBatchPersonalizationRequest routing and tenant isolation
	persOrch.RegisterDefaultEngines("tenant-f5", nil)
	batchResp, err := server.HandleBatchPersonalizationRequest(ctx, persOrch, application.BatchPersonalizationRequestDTO{
		TenantID:  "tenant-f5",
		ReaderID:  "reader-batch",
		EngineIDs: []string{"PERS-001", "PERS-002"},
	})
	if err != nil || batchResp == nil || batchResp.EnginesExecuted != 2 {
		t.Fatalf("expected successful batch personalization response, got resp=%v err=%v", batchResp, err)
	}

	// 3. Test HealthChecker SERVING vs NOT_SERVING
	hc := server.GetHealthChecker()
	status, err := hc.Check(ctx, "personalization")
	if status != HealthStatusNotServing || err == nil {
		t.Fatalf("expected NOT_SERVING when fewer than 5 engines registered, got status=%s err=%v", status, err)
	}

	for _, id := range []string{"PERS-001", "PERS-002", "PERS-003", "PERS-004", "PERS-005"} {
		if e, err := persOrch.GetEngine(id); err == nil && e != nil {
			hc.RegisterPersonalizationEngine(e)
		}
	}

	status, err = hc.Check(ctx, "personalization")
	if status != HealthStatusServing || err != nil {
		t.Fatalf("expected SERVING when all 5 engines registered, got status=%s err=%v", status, err)
	}

	// 4. Test HandleFleetHealthRequest enrichment
	report, err := server.HandleFleetHealthRequest(ctx, "tenant-f5")
	if err != nil || report == nil {
		t.Fatalf("expected fleet health report, got %v", err)
	}
	if report.PersonalizationCount != "5" || len(report.PersonalizationEngines) != 5 {
		t.Fatalf("expected personalization_count=5 and 5 engines in map, got count=%s mapLen=%d", report.PersonalizationCount, len(report.PersonalizationEngines))
	}
}
