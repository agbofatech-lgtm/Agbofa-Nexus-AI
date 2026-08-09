package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type VerificationOrchestrator struct {
	publisher EventPublisher
	aiGateway AIGatewayClient
}

func NewVerificationOrchestrator(publisher EventPublisher, aiGateway AIGatewayClient) *VerificationOrchestrator {
	return &VerificationOrchestrator{
		publisher: publisher,
		aiGateway: aiGateway,
	}
}

func (o *VerificationOrchestrator) ExecuteVerification(
	ctx context.Context,
	verifier domain.VerificationAgent,
	req VerificationRequestDTO,
) (*VerificationResponseDTO, error) {
	start := time.Now()
	if verifier == nil {
		return nil, fmt.Errorf("verifier agent is nil")
	}
	if req.TenantID != verifier.TenantID() {
		return nil, domain.ErrCrossTenantViolation
	}
	if req.Detection.TenantID != req.TenantID {
		return nil, domain.ErrCrossTenantViolation
	}

	result, err := verifier.Verify(ctx, req.Detection)
	if err != nil {
		return nil, fmt.Errorf("verifier %s execution error: %w", verifier.ID(), err)
	}

	// Publish EVT-021 event for downstream IMP-017-D pipeline agents
	if o.publisher != nil && result != nil {
		evt := &domain.VerificationCompletedEvent{
			EventID:      fmt.Sprintf("evt-021-%s-%d", result.VerificationID, time.Now().UnixNano()),
			TenantID:     req.TenantID,
			AgentID:      verifier.ID(),
			SignalID:     result.SignalID,
			Verification: *result,
			OccurredAt:   time.Now(),
		}
		_ = o.publisher.PublishVerificationCompleted(ctx, evt)
	}

	elapsed := time.Since(start).Milliseconds()
	return &VerificationResponseDTO{
		TenantID:        req.TenantID,
		AgentID:         verifier.ID(),
		Result:          result,
		ExecutionTimeMs: elapsed,
	}, nil
}

func (o *VerificationOrchestrator) ExecuteBatchVerification(
	ctx context.Context,
	verifier domain.VerificationAgent,
	req BatchVerificationRequestDTO,
) (*BatchVerificationResponseDTO, error) {
	start := time.Now()
	if verifier == nil {
		return nil, fmt.Errorf("verifier agent is nil")
	}
	if req.TenantID != verifier.TenantID() {
		return nil, domain.ErrCrossTenantViolation
	}

	results := make([]domain.VerificationResult, 0, len(req.Detections))
	for _, det := range req.Detections {
		if det.TenantID != req.TenantID {
			return nil, domain.ErrCrossTenantViolation
		}
		res, err := verifier.Verify(ctx, det)
		if err == nil && res != nil {
			results = append(results, *res)
			if o.publisher != nil {
				evt := &domain.VerificationCompletedEvent{
					EventID:      fmt.Sprintf("evt-021-%s-%d", res.VerificationID, time.Now().UnixNano()),
					TenantID:     req.TenantID,
					AgentID:      verifier.ID(),
					SignalID:     res.SignalID,
					Verification: *res,
					OccurredAt:   time.Now(),
				}
				_ = o.publisher.PublishVerificationCompleted(ctx, evt)
			}
		}
	}

	elapsed := time.Since(start).Milliseconds()
	return &BatchVerificationResponseDTO{
		TenantID:        req.TenantID,
		AgentID:         verifier.ID(),
		ResultsCount:    len(results),
		Results:         results,
		ExecutionTimeMs: elapsed,
	}, nil
}

type AggregatingScorer interface {
	AggregateConfidence(ctx context.Context, tenantID string, results []domain.VerificationResult) (*domain.VerificationResult, error)
}

func (o *VerificationOrchestrator) ExecuteConfidenceAggregation(
	ctx context.Context,
	scorer AggregatingScorer,
	req ConfidenceAggregationRequestDTO,
) (*ConfidenceAggregationResponseDTO, error) {
	start := time.Now()
	if scorer == nil {
		return nil, fmt.Errorf("scorer agent is nil")
	}

	result, err := scorer.AggregateConfidence(ctx, req.TenantID, req.Results)
	if err != nil {
		return nil, fmt.Errorf("confidence aggregation failed: %w", err)
	}

	if o.publisher != nil && result != nil {
		evt := &domain.VerificationCompletedEvent{
			EventID:      fmt.Sprintf("evt-021-%s-%d", result.VerificationID, time.Now().UnixNano()),
			TenantID:     req.TenantID,
			AgentID:      result.AgentID,
			SignalID:     result.SignalID,
			Verification: *result,
			OccurredAt:   time.Now(),
		}
		_ = o.publisher.PublishVerificationCompleted(ctx, evt)
	}

	elapsed := time.Since(start).Milliseconds()
	return &ConfidenceAggregationResponseDTO{
		TenantID:        req.TenantID,
		AgentID:         result.AgentID,
		Result:          result,
		ExecutionTimeMs: elapsed,
	}, nil
}
