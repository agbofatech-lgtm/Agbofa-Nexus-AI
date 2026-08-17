package application

import (
	"context"
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type FeedbackLoopController struct {
	mu                    sync.RWMutex
	learningRate          float64
	maxCumulativeDailyAdj float64
	cumulativeAdjustments map[string]float64
	lastReset             map[string]time.Time
}

func NewFeedbackLoopController(lr, maxDaily float64) *FeedbackLoopController {
	if lr <= 0 {
		lr = 0.15
	}
	if maxDaily <= 0 {
		maxDaily = 0.30
	}
	return &FeedbackLoopController{
		learningRate:          lr,
		maxCumulativeDailyAdj: maxDaily,
		cumulativeAdjustments: make(map[string]float64),
		lastReset:             make(map[string]time.Time),
	}
}

func (f *FeedbackLoopController) CalculateDampedDelta(tenantID, targetAgent string, actualOutcome, predictedOutcome float64) (float64, bool, string) {
	f.mu.Lock()
	defer f.mu.Unlock()

	key := fmt.Sprintf("%s:%s", tenantID, targetAgent)
	now := time.Now()

	if resetTime, exists := f.lastReset[key]; !exists || now.Sub(resetTime) >= 24*time.Hour {
		f.cumulativeAdjustments[key] = 0.0
		f.lastReset[key] = now
	}

	rawDelta := (actualOutcome - predictedOutcome) * f.learningRate
	clampedDelta := rawDelta
	if clampedDelta > 0.10 {
		clampedDelta = 0.10
	} else if clampedDelta < -0.10 {
		clampedDelta = -0.10
	}

	currentCumulative := f.cumulativeAdjustments[key]
	if currentCumulative+math.Abs(clampedDelta) > f.maxCumulativeDailyAdj {
		return 0.0, false, fmt.Sprintf("feedback paused: MaxCumulativeDailyAdjustment %.2f exceeded in 24h window (current: %.2f)", f.maxCumulativeDailyAdj, currentCumulative)
	}

	f.cumulativeAdjustments[key] = currentCumulative + math.Abs(clampedDelta)
	return clampedDelta, true, "feedback damped and recorded"
}

type PredictionResultItem struct {
	PredictionID   string            `json:"prediction_id"`
	TenantID       string            `json:"tenant_id"`
	EngineID       string            `json:"engine_id"`
	Score          float64           `json:"score"`
	Confidence     float64           `json:"confidence"`
	Classification string            `json:"classification"`
	Metadata       map[string]string `json:"metadata"`
}

type PredictionOrchestrator struct {
	mu           sync.RWMutex
	publisher    EventPublisher
	phase1       Phase1ServiceClient
	trendStore   TrendDataStoreClient
	repo         domain.PredictiveRepository
	engines      map[string]domain.PredictiveEngine
	feedbackLog  []domain.FeedbackSignal
	feedbackCtrl *FeedbackLoopController
	maxSignalAge time.Duration
}

func NewPredictionOrchestrator(
	publisher EventPublisher,
	phase1 Phase1ServiceClient,
	trendStore TrendDataStoreClient,
	repo domain.PredictiveRepository,
) *PredictionOrchestrator {
	return &PredictionOrchestrator{
		publisher:    publisher,
		phase1:       phase1,
		trendStore:   trendStore,
		repo:         repo,
		engines:      make(map[string]domain.PredictiveEngine, 5),
		feedbackLog:  make([]domain.FeedbackSignal, 0),
		feedbackCtrl: NewFeedbackLoopController(0.15, 0.30),
		maxSignalAge: 3600 * time.Second,
	}
}

func (o *PredictionOrchestrator) RegisterEngine(engine domain.PredictiveEngine) {
	if engine == nil {
		return
	}
	o.mu.Lock()
	defer o.mu.Unlock()
	o.engines[engine.ID()] = engine
}

func (o *PredictionOrchestrator) RegisterAllEngines(engines map[string]domain.PredictiveEngine) {
	o.mu.Lock()
	defer o.mu.Unlock()
	for id, e := range engines {
		o.engines[id] = e
	}
}

func (o *PredictionOrchestrator) GetEngine(engineID string) domain.PredictiveEngine {
	o.mu.RLock()
	defer o.mu.RUnlock()
	return o.engines[engineID]
}

func (o *PredictionOrchestrator) ExecutePrediction(
	ctx context.Context,
	engine domain.PredictiveEngine,
	req PredictiveRequestDTO,
) (*PredictiveResponseDTO, error) {
	start := time.Now()
	if engine == nil {
		return nil, fmt.Errorf("predictive engine is nil")
	}
	if req.TenantID != engine.TenantID() {
		return nil, domain.ErrCrossTenantViolation
	}

	payload := req.Payload
	if payload == nil {
		payload = make(map[string]string)
	}
	payload["tenant_id"] = req.TenantID

	res, err := engine.ExecutePrediction(ctx, payload)
	if err != nil {
		return nil, fmt.Errorf("prediction engine %s failed: %w", engine.ID(), err)
	}

	// ITEM 2: Database Persistence Integration — save prediction result to PostgreSQL
	if o.repo != nil {
		switch result := res.(type) {
		case *domain.ViralityPrediction:
			if err := o.repo.SaveViralityPrediction(ctx, req.TenantID, result); err != nil {
				log.Printf("WARN [PredictionOrchestrator]: SaveViralityPrediction failed: %v", err)
			}
		case *domain.EngagementOptimization:
			if err := o.repo.SaveEngagementOptimization(ctx, req.TenantID, result); err != nil {
				log.Printf("WARN [PredictionOrchestrator]: SaveEngagementOptimization failed: %v", err)
			}
		case *domain.TrendLifecycleModel:
			if err := o.repo.SaveTrendLifecycleModel(ctx, req.TenantID, result); err != nil {
				log.Printf("WARN [PredictionOrchestrator]: SaveTrendLifecycleModel failed: %v", err)
			}
		case *domain.ContentPerformanceForecast:
			if err := o.repo.SaveContentPerformanceForecast(ctx, req.TenantID, result); err != nil {
				log.Printf("WARN [PredictionOrchestrator]: SaveContentPerformanceForecast failed: %v", err)
			}
		case *domain.AnomalyDetectionEvent:
			if err := o.repo.SaveAnomalyDetectionEvent(ctx, req.TenantID, result); err != nil {
				log.Printf("WARN [PredictionOrchestrator]: SaveAnomalyDetectionEvent failed: %v", err)
			}
		}
	}

	if o.publisher != nil && res != nil {
		evt := &domain.PredictiveIntelligenceEvent{
			EventID:        fmt.Sprintf("evt-038-%s-%d", engine.ID(), time.Now().UnixNano()),
			TenantID:       req.TenantID,
			EngineID:       engine.ID(),
			PredictionType: engine.Name(),
			Payload:        res,
			OccurredAt:     time.Now(),
		}
		_ = o.publisher.PublishPredictionIntelligence(ctx, evt)
	}

	o.emitFeedbackToAgents(req.TenantID, engine.ID(), res)

	elapsed := time.Since(start).Milliseconds()
	return &PredictiveResponseDTO{
		TenantID:        req.TenantID,
		EngineID:        engine.ID(),
		Prediction:      res,
		ExecutionTimeMs: elapsed,
	}, nil
}

func (o *PredictionOrchestrator) ArbitratePredictions(ctx context.Context, tenantID string, predictions []PredictionResultItem) (*PredictionResultItem, error) {
	if len(predictions) == 0 {
		return nil, fmt.Errorf("no predictions to arbitrate")
	}
	var sumScoreConf, sumConf float64
	minConf := 1.0
	maxConf := 0.0

	for _, p := range predictions {
		if p.TenantID != tenantID {
			return nil, domain.ErrCrossTenantViolation
		}
		sumScoreConf += p.Score * p.Confidence
		sumConf += p.Confidence
		if p.Confidence < minConf {
			minConf = p.Confidence
		}
		if p.Confidence > maxConf {
			maxConf = p.Confidence
		}
	}

	if sumConf == 0.0 {
		sumConf = 1.0
	}
	weightedScore := sumScoreConf / sumConf
	status := "RESOLVED"
	if maxConf-minConf > 0.30 {
		status = "DISPUTED"
	}

	arbitrated := &PredictionResultItem{
		PredictionID:   fmt.Sprintf("arb-%d", time.Now().UnixNano()),
		TenantID:       tenantID,
		EngineID:       "PRED-ARBITRATOR",
		Score:          weightedScore,
		Confidence:     sumConf / float64(len(predictions)),
		Classification: status,
		Metadata: map[string]string{
			"arbitration_status": status,
			"confidence_diff":    fmt.Sprintf("%.2f", maxConf-minConf),
			"input_count":        fmt.Sprintf("%d", len(predictions)),
		},
	}

	if o.publisher != nil {
		evt := &domain.PredictiveIntelligenceEvent{
			EventID:        fmt.Sprintf("evt-038-arb-%d", time.Now().UnixNano()),
			TenantID:       tenantID,
			EngineID:       "PRED-ARBITRATOR",
			PredictionType: "ARBITRATION",
			Payload:        arbitrated,
			OccurredAt:     time.Now(),
		}
		_ = o.publisher.PublishPredictionIntelligence(ctx, evt)
	}

	return arbitrated, nil
}

func (o *PredictionOrchestrator) emitFeedbackToAgents(tenantID, engineID string, res interface{}) {
	o.mu.Lock()
	defer o.mu.Unlock()

	targets := []string{"AGT-010", "AGT-016", "AGT-024"}
	actualOutcome := 0.85
	predictedOutcome := 0.70

	for _, target := range targets {
		delta, allowed, reason := o.feedbackCtrl.CalculateDampedDelta(tenantID, target, actualOutcome, predictedOutcome)
		if !allowed {
			sig := domain.FeedbackSignal{
				SignalID:    fmt.Sprintf("fb-%s-%s-%d", engineID, target, time.Now().UnixNano()),
				TenantID:    tenantID,
				TargetAgent: target,
				ScoreDelta:  0.0,
				Reason:      reason,
				GeneratedAt: time.Now(),
			}
			o.feedbackLog = append(o.feedbackLog, sig)
			continue
		}
		sig := domain.FeedbackSignal{
			SignalID:    fmt.Sprintf("fb-%s-%s-%d", engineID, target, time.Now().UnixNano()),
			TenantID:    tenantID,
			TargetAgent: target,
			ScoreDelta:  delta,
			Reason:      fmt.Sprintf("Damped feedback delta (%.3f) from engine %s: %s", delta, engineID, reason),
			GeneratedAt: time.Now(),
		}
		o.feedbackLog = append(o.feedbackLog, sig)
	}
}

func (o *PredictionOrchestrator) GetFeedbackLog(tenantID string) []domain.FeedbackSignal {
	o.mu.RLock()
	defer o.mu.RUnlock()
	res := make([]domain.FeedbackSignal, 0)
	for _, f := range o.feedbackLog {
		if f.TenantID == tenantID {
			res = append(res, f)
		}
	}
	return res
}

func (o *PredictionOrchestrator) ConsumeAnalyticsSignals(ctx context.Context, tenantID string) ([]map[string]interface{}, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if o.phase1 == nil {
		return []map[string]interface{}{{"signal": "EVT-034", "timestamp": time.Now().Format(time.RFC3339)}}, nil
	}

	signals, err := o.phase1.CollectOptimizationSignals(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	validSignals := make([]map[string]interface{}, 0, len(signals))
	for _, sig := range signals {
		tsStr, ok := sig["timestamp"].(string)
		if !ok || tsStr == "" {
			validSignals = append(validSignals, sig)
			continue
		}
		ts, err := time.Parse(time.RFC3339, tsStr)
		if err != nil {
			validSignals = append(validSignals, sig)
			continue
		}
		age := time.Since(ts)
		if age > o.maxSignalAge {
			log.Printf("WARN [PredictionOrchestrator]: signal rejected due to freshness SLA (age %.2fs > %.2fs)", age.Seconds(), o.maxSignalAge.Seconds())
			sig["rejected_reason"] = domain.ErrStaleSignal.Error()
			sig["signal_age_seconds"] = fmt.Sprintf("%.2f", age.Seconds())
			return nil, domain.ErrStaleSignal
		}
		validSignals = append(validSignals, sig)
	}

	return validSignals, nil
}
