package interfaces

import (
	"context"
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type AgentGRPCServer struct {
	mu                          sync.Mutex
	monitorOrchestrator         *application.MonitorOrchestrator
	detectorOrchestrator        *application.DetectorOrchestrator
	verificationOrchestrator    *application.VerificationOrchestrator
	pipelineOrchestrator        *application.PipelineOrchestrator
	predictionOrchestrator      *application.PredictionOrchestrator
	personalizationOrchestrator *application.PersonalizationOrchestrator
	port                        string
	running                     bool
	health                      *HealthChecker
}

func NewGRPCServer(
	monitorOrch *application.MonitorOrchestrator,
	detectorOrch *application.DetectorOrchestrator,
	verificationOrch *application.VerificationOrchestrator,
	pipelineOrch *application.PipelineOrchestrator,
	predictionOrch *application.PredictionOrchestrator,
	port string,
) *AgentGRPCServer {
	return &AgentGRPCServer{
		monitorOrchestrator:      monitorOrch,
		detectorOrchestrator:     detectorOrch,
		verificationOrchestrator: verificationOrch,
		pipelineOrchestrator:     pipelineOrch,
		predictionOrchestrator:   predictionOrch,
		port:                     port,
		health:                   NewHealthChecker(),
	}
}

func (s *AgentGRPCServer) WithPersonalization(persOrch *application.PersonalizationOrchestrator) *AgentGRPCServer {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.personalizationOrchestrator = persOrch
	return s
}

func (s *AgentGRPCServer) GetHealthChecker() *HealthChecker {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.health
}

func (s *AgentGRPCServer) Serve(listener net.Listener) error {
	s.mu.Lock()
	s.running = true
	s.health.SetStatus(HealthStatusServing)
	s.mu.Unlock()

	for {
		s.mu.Lock()
		if !s.running {
			s.mu.Unlock()
			break
		}
		s.mu.Unlock()
		time.Sleep(100 * time.Millisecond)
	}
	return nil
}

func (s *AgentGRPCServer) Stop(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.running {
		return nil
	}
	s.running = false
	s.health.SetStatus(HealthStatusNotServing)
	return nil
}

func (s *AgentGRPCServer) HandleScanRequest(ctx context.Context, agent domain.MonitorAgent, req application.ScanRequestDTO) (*application.ScanResponseDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	return s.monitorOrchestrator.ExecuteScan(ctx, agent, req)
}

func (s *AgentGRPCServer) HandleHealthRequest(ctx context.Context, agent domain.MonitorAgent) (*application.AgentHealthReportDTO, error) {
	return s.monitorOrchestrator.CheckHealth(ctx, agent)
}

func (s *AgentGRPCServer) HandleDetectionRequest(ctx context.Context, detector domain.DetectorAgent, req application.DetectionRequestDTO) (*application.DetectionResponseDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	if s.detectorOrchestrator == nil {
		return nil, fmt.Errorf("detector orchestrator is not initialized")
	}
	return s.detectorOrchestrator.ExecuteDetection(ctx, detector, req)
}

func (s *AgentGRPCServer) HandleBatchDetectionRequest(ctx context.Context, detector domain.DetectorAgent, req application.BatchDetectionRequestDTO) (*application.BatchDetectionResponseDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	if s.detectorOrchestrator == nil {
		return nil, fmt.Errorf("detector orchestrator is not initialized")
	}
	return s.detectorOrchestrator.ExecuteBatchDetection(ctx, detector, req)
}

func (s *AgentGRPCServer) HandleVerificationRequest(ctx context.Context, verifier domain.VerificationAgent, req application.VerificationRequestDTO) (*application.VerificationResponseDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	if s.verificationOrchestrator == nil {
		return nil, fmt.Errorf("verification orchestrator is not initialized")
	}
	return s.verificationOrchestrator.ExecuteVerification(ctx, verifier, req)
}

func (s *AgentGRPCServer) HandleBatchVerificationRequest(ctx context.Context, verifier domain.VerificationAgent, req application.BatchVerificationRequestDTO) (*application.BatchVerificationResponseDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	if s.verificationOrchestrator == nil {
		return nil, fmt.Errorf("verification orchestrator is not initialized")
	}
	return s.verificationOrchestrator.ExecuteBatchVerification(ctx, verifier, req)
}

func (s *AgentGRPCServer) HandleConfidenceAggregationRequest(ctx context.Context, scorer application.AggregatingScorer, req application.ConfidenceAggregationRequestDTO) (*application.ConfidenceAggregationResponseDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	if s.verificationOrchestrator == nil {
		return nil, fmt.Errorf("verification orchestrator is not initialized")
	}
	return s.verificationOrchestrator.ExecuteConfidenceAggregation(ctx, scorer, req)
}

func (s *AgentGRPCServer) HandlePipelineRequest(ctx context.Context, agent domain.PipelineAgent, req application.PipelineRequestDTO) (*application.PipelineResponseDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	if s.pipelineOrchestrator == nil {
		return nil, fmt.Errorf("pipeline orchestrator is not initialized")
	}
	return s.pipelineOrchestrator.ExecutePipelineStage(ctx, agent, req)
}

func (s *AgentGRPCServer) HandleFleetHealthRequest(ctx context.Context, tenantID string) (*application.PipelineHealthReportDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	if s.pipelineOrchestrator == nil {
		return nil, fmt.Errorf("pipeline orchestrator is not initialized")
	}
	report, err := s.pipelineOrchestrator.CheckFleetHealth(ctx, tenantID)
	if err != nil || report == nil {
		return report, err
	}
	if s.health != nil {
		persEngines := s.health.GetPersonalizationEngineStatus()
		report.PersonalizationCount = fmt.Sprintf("%d", len(persEngines))
		report.PersonalizationEngines = persEngines
		if report.Details == nil {
			report.Details = make(map[string]string)
		}
		report.Details["personalization_count"] = fmt.Sprintf("%d", len(persEngines))
	}
	return report, nil
}

func (s *AgentGRPCServer) HandlePredictiveRequest(ctx context.Context, engine domain.PredictiveEngine, req application.PredictiveRequestDTO) (*application.PredictiveResponseDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	if s.predictionOrchestrator == nil {
		return nil, fmt.Errorf("prediction orchestrator is not initialized")
	}
	return s.predictionOrchestrator.ExecutePrediction(ctx, engine, req)
}

// HandlePersonalizationRequest executes a single Personalization Engine gRPC endpoint on port 9090.
//
// Authoritative Spec Quotation:
// Source: Arena.txt, Section 18.2, line 194002 (gRPC port alignment); IMP-017/018 established patterns
func (s *AgentGRPCServer) HandlePersonalizationRequest(
	ctx context.Context,
	engine domain.PersonalizationEngine,
	req application.PersonalizationRequestDTO,
) (*application.PersonalizationResponseDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	if engine == nil {
		return nil, fmt.Errorf("personalization engine is nil")
	}
	if req.TenantID == "" || req.TenantID != engine.TenantID() {
		return nil, domain.ErrCrossTenantViolation
	}

	payload := make(map[string]string)
	for k, v := range req.Payload {
		payload[k] = v
	}
	payload["tenant_id"] = req.TenantID
	if req.ReaderID != "" {
		payload["reader_id"] = req.ReaderID
	}

	var res interface{}
	err := domain.RetryWithBackoff(ctx, func() error {
		var execErr error
		res, execErr = engine.ExecutePersonalization(ctx, payload)
		return execErr
	})
	if err != nil {
		return nil, err
	}

	return &application.PersonalizationResponseDTO{
		TenantID: req.TenantID,
		EngineID: req.EngineID,
		Result:   res,
		Status:   "COMPLETED",
	}, nil
}

// HandleBatchPersonalizationRequest executes multi-strategy parallel personalization
// across multiple engines via PersonalizationOrchestrator on port 9090.
func (s *AgentGRPCServer) HandleBatchPersonalizationRequest(
	ctx context.Context,
	orchestrator *application.PersonalizationOrchestrator,
	req application.BatchPersonalizationRequestDTO,
) (*application.BatchPersonalizationResponseDTO, error) {
	if !s.running {
		return nil, fmt.Errorf("gRPC server is not serving")
	}
	if orchestrator == nil {
		return nil, fmt.Errorf("personalization orchestrator is nil")
	}
	if req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	var res *application.BatchPersonalizationResponseDTO
	err := domain.RetryWithBackoff(ctx, func() error {
		var execErr error
		res, execErr = orchestrator.ExecuteBatchPersonalization(ctx, req)
		return execErr
	})
	if err != nil {
		return nil, err
	}

	return res, nil
}
