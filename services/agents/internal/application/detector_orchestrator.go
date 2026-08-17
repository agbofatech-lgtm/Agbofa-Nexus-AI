package application

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type DetectorOrchestrator struct {
	publisher EventPublisher
	aiGateway AIGatewayClient
}

func NewDetectorOrchestrator(publisher EventPublisher, aiGateway AIGatewayClient) *DetectorOrchestrator {
	return &DetectorOrchestrator{
		publisher: publisher,
		aiGateway: aiGateway,
	}
}

func (o *DetectorOrchestrator) ExecuteDetection(
	ctx context.Context,
	detector domain.DetectorAgent,
	req DetectionRequestDTO,
) (*DetectionResponseDTO, error) {
	start := time.Now()
	if detector == nil {
		return nil, fmt.Errorf("detector agent is nil")
	}
	if req.TenantID != detector.TenantID() {
		return nil, domain.ErrCrossTenantViolation
	}
	if req.Signal.TenantID != req.TenantID {
		return nil, domain.ErrCrossTenantViolation
	}

	result, err := detector.Detect(ctx, req.Signal)
	if err != nil {
		return nil, fmt.Errorf("detector %s execution error: %w", detector.ID(), err)
	}

	// Publish EVT-020 event for downstream IMP-017-C verification agents
	if o.publisher != nil && result != nil {
		evt := &domain.DetectionResultReadyEvent{
			EventID:    fmt.Sprintf("evt-020-%s-%d", result.ResultID, time.Now().UnixNano()),
			TenantID:   req.TenantID,
			AgentID:    detector.ID(),
			SignalID:   req.Signal.SignalID,
			Result:     *result,
			OccurredAt: time.Now(),
		}
		_ = o.publisher.PublishDetectionResult(ctx, evt)
	}

	elapsed := time.Since(start).Milliseconds()
	return &DetectionResponseDTO{
		TenantID:        req.TenantID,
		AgentID:         detector.ID(),
		Result:          result,
		ExecutionTimeMs: elapsed,
	}, nil
}

// ITEM 3: Detector Conflict Arbitration Engine
func (o *DetectorOrchestrator) ArbitrateDetections(
	ctx context.Context,
	tenantID, signalID string,
	results []domain.DetectionResult,
) (*domain.DetectionResult, error) {
	if len(results) == 0 {
		return nil, fmt.Errorf("no detection results to arbitrate")
	}

	// Group results by classification label
	labelScores := make(map[string]float64)
	labelCounts := make(map[string]int)
	contributingDetectors := make([]string, 0, len(results))
	allEvidence := make([]domain.EvidenceItem, 0)
	var flagPenalty float64 = 1.0

	for _, res := range results {
		if res.TenantID != tenantID {
			return nil, domain.ErrCrossTenantViolation
		}
		contributingDetectors = append(contributingDetectors, res.DetectorID)
		allEvidence = append(allEvidence, res.Evidence...)

		// Rule: AGT-015 (Duplicate) conflicts with any positive classification -> trust AGT-015 if similarity > 0.90
		if res.DetectorID == "AGT-015" && res.Classification == "DUPLICATE" && res.ConfidenceScore > 0.90 {
			return &domain.DetectionResult{
				ResultID:        fmt.Sprintf("res-arb-%d", time.Now().UnixNano()),
				TenantID:        tenantID,
				SignalID:        signalID,
				DetectorID:      "AGT-ARBITRATOR",
				DetectorName:    "Detector Conflict Arbitrator",
				Classification:  "DUPLICATE",
				ConfidenceScore: res.ConfidenceScore,
				Evidence:        res.Evidence,
				DetectedAt:      time.Now(),
				Metadata: map[string]string{
					"arbitration_status":     "RESOLVED",
					"contributing_detectors": strings.Join(contributingDetectors, ","),
					"resolution_rule":        "AGT-015 duplicate override (> 0.90 similarity)",
				},
			}, nil
		}

		// Rule: AGT-012 (Credibility) with history_rating == "FLAGGED" -> downgrade all classifications by 0.3x
		if res.DetectorID == "AGT-012" {
			if rating, ok := res.Metadata["history_rating"]; ok && rating == "FLAGGED" {
				flagPenalty = 0.7 // downgrade by 0.3x
			}
		}

		labelScores[res.Classification] += res.ConfidenceScore
		labelCounts[res.Classification]++
	}

	// Calculate weighted average confidence per unique label
	labelAvg := make(map[string]float64)
	var maxLabel, secondLabel string
	var maxScore, secondScore float64

	for lbl, sum := range labelScores {
		avg := (sum / float64(labelCounts[lbl])) * flagPenalty
		labelAvg[lbl] = avg
		if avg > maxScore {
			secondScore = maxScore
			secondLabel = maxLabel
			maxScore = avg
			maxLabel = lbl
		} else if avg > secondScore {
			secondScore = avg
			secondLabel = lbl
		}
	}

	// Rule: AGT-016 (Virality) + AGT-009 (Breaking) -> compatible, merge with multiplicative boost
	var finalClass string
	var finalScore float64
	var status string
	conflictingLabels := ""

	if len(labelAvg) == 1 {
		finalClass = maxLabel
		finalScore = maxScore
		status = "RESOLVED"
	} else if (maxLabel == "BREAKING_NEWS" && secondLabel == "VIRALITY_FORECAST") ||
		(maxLabel == "VIRALITY_FORECAST" && secondLabel == "BREAKING_NEWS") {
		finalClass = "BREAKING_NEWS_VIRAL"
		finalScore = math.Min(1.0, maxScore*1.15) // multiplicative boost
		status = "RESOLVED"
	} else if maxScore-secondScore < 0.20 {
		finalClass = maxLabel
		finalScore = maxScore
		status = "AMBIGUOUS"
		conflictingLabels = fmt.Sprintf("%s vs %s", maxLabel, secondLabel)
	} else {
		finalClass = maxLabel
		finalScore = maxScore
		status = "RESOLVED"
	}

	arbitrated := &domain.DetectionResult{
		ResultID:        fmt.Sprintf("res-arb-%d", time.Now().UnixNano()),
		TenantID:        tenantID,
		SignalID:        signalID,
		DetectorID:      "AGT-ARBITRATOR",
		DetectorName:    "Detector Conflict Arbitrator",
		Classification:  finalClass,
		ConfidenceScore: finalScore,
		Evidence:        allEvidence,
		DetectedAt:      time.Now(),
		Metadata: map[string]string{
			"arbitration_status":     status,
			"contributing_detectors": strings.Join(contributingDetectors, ","),
			"conflicting_labels":     conflictingLabels,
		},
	}

	return arbitrated, nil
}

func (o *DetectorOrchestrator) ExecuteBatchDetection(
	ctx context.Context,
	detector domain.DetectorAgent,
	req BatchDetectionRequestDTO,
) (*BatchDetectionResponseDTO, error) {
	start := time.Now()
	if detector == nil {
		return nil, fmt.Errorf("detector agent is nil")
	}
	if req.TenantID != detector.TenantID() {
		return nil, domain.ErrCrossTenantViolation
	}

	results := make([]domain.DetectionResult, 0, len(req.Signals))
	for _, sig := range req.Signals {
		if sig.TenantID != req.TenantID {
			return nil, domain.ErrCrossTenantViolation
		}
		res, err := detector.Detect(ctx, sig)
		if err == nil && res != nil {
			results = append(results, *res)
			if o.publisher != nil {
				evt := &domain.DetectionResultReadyEvent{
					EventID:    fmt.Sprintf("evt-020-%s-%d", res.ResultID, time.Now().UnixNano()),
					TenantID:   req.TenantID,
					AgentID:    detector.ID(),
					SignalID:   sig.SignalID,
					Result:     *res,
					OccurredAt: time.Now(),
				}
				_ = o.publisher.PublishDetectionResult(ctx, evt)
			}
		}
	}

	// Integrate Detector Conflict Arbitration Engine across batch results
	if len(results) > 1 {
		arbitrated, err := o.ArbitrateDetections(ctx, req.TenantID, "batch-signal-group", results)
		if err == nil && arbitrated != nil && o.publisher != nil {
			evt := &domain.DetectionResultReadyEvent{
				EventID:    fmt.Sprintf("evt-020-%s-%d", arbitrated.ResultID, time.Now().UnixNano()),
				TenantID:   req.TenantID,
				AgentID:    arbitrated.DetectorID,
				SignalID:   "batch-signal-group",
				Result:     *arbitrated,
				OccurredAt: time.Now(),
			}
			_ = o.publisher.PublishDetectionResult(ctx, evt)
		}
	}

	elapsed := time.Since(start).Milliseconds()
	return &BatchDetectionResponseDTO{
		TenantID:        req.TenantID,
		AgentID:         detector.ID(),
		ResultsCount:    len(results),
		Results:         results,
		ExecutionTimeMs: elapsed,
	}, nil
}
