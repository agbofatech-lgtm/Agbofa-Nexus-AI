package predictive

import (
	"context"
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type BasePredictiveEngine struct {
	mu             sync.RWMutex
	engineID       string
	engineName     string
	tenantUUID     string
	aiGateway      application.AIGatewayClient
	predictionType string
}

func (b *BasePredictiveEngine) ID() string {
	return b.engineID
}

func (b *BasePredictiveEngine) Name() string {
	return b.engineName
}

func (b *BasePredictiveEngine) TenantID() string {
	return b.tenantUUID
}

// FIX 3: Trend Lifecycle Deterministic State Machine
type TrendLifecycleStateMachine struct {
	mu            sync.RWMutex
	velocityHist  map[string][]float64
	currentPhases map[string]domain.TrendPhase
	alpha         float64
}

func NewTrendLifecycleStateMachine() *TrendLifecycleStateMachine {
	return &TrendLifecycleStateMachine{
		velocityHist:  make(map[string][]float64),
		currentPhases: make(map[string]domain.TrendPhase),
		alpha:         0.3,
	}
}

func (s *TrendLifecycleStateMachine) CalculateNextPhase(tenantID, topicID string, rawVelocity float64) (domain.TrendPhase, float64, float64) {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := fmt.Sprintf("%s:%s", tenantID, topicID)
	hist := s.velocityHist[key]
	hist = append(hist, rawVelocity)
	if len(hist) > 5 {
		hist = hist[len(hist)-5:]
	}
	s.velocityHist[key] = hist

	ema := hist[0]
	for i := 1; i < len(hist); i++ {
		ema = s.alpha*hist[i] + (1.0-s.alpha)*ema
	}

	acceleration := 0.0
	if len(hist) >= 2 {
		emaPrev := hist[0]
		for i := 1; i < len(hist)-1; i++ {
			emaPrev = s.alpha*hist[i] + (1.0-s.alpha)*emaPrev
		}
		acceleration = ema - emaPrev
	}

	currPhase, exists := s.currentPhases[key]
	if !exists {
		currPhase = domain.TrendPhaseEmergence
	}

	var nextPhase domain.TrendPhase
	if currPhase == domain.TrendPhaseDecay && ema > 10.0 {
		nextPhase = domain.TrendPhaseResurgence
	} else if ema >= 10.0 && acceleration > 0.0 {
		nextPhase = domain.TrendPhaseAcceleration
	} else if acceleration < 0.0 && ema > 5.0 {
		nextPhase = domain.TrendPhasePeak
	} else if ema < 5.0 && acceleration < 0.0 {
		nextPhase = domain.TrendPhaseDecay
	} else if ema < 10.0 {
		nextPhase = domain.TrendPhaseEmergence
	} else {
		nextPhase = currPhase
	}

	s.currentPhases[key] = nextPhase
	return nextPhase, ema, acceleration
}

// FIX 4: Statistical Anomaly Detector (Z-Score & Velocity Ratio)
type StatisticalAnomalyDetector struct {
	mu           sync.RWMutex
	engagement   map[string][]float64
	velocityBase map[string]float64
}

func NewStatisticalAnomalyDetector() *StatisticalAnomalyDetector {
	return &StatisticalAnomalyDetector{
		engagement:   make(map[string][]float64),
		velocityBase: make(map[string]float64),
	}
}

func (s *StatisticalAnomalyDetector) Evaluate(tenantID string, platform domain.PlatformSource, currEng, currVel float64) (bool, float64, float64) {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := fmt.Sprintf("%s:%s", tenantID, platform)
	window := s.engagement[key]
	window = append(window, currEng)
	if len(window) > 168 {
		window = window[1:]
	}
	s.engagement[key] = window

	mean := 0.0
	for _, v := range window {
		mean += v
	}
	mean /= float64(len(window))

	variance := 0.0
	for _, v := range window {
		variance += (v - mean) * (v - mean)
	}
	stddev := math.Sqrt(variance / float64(len(window)))
	if stddev == 0.0 {
		stddev = 1.0
	}

	zscore := (currEng - mean) / stddev

	baseVel, ok := s.velocityBase[key]
	if !ok || baseVel == 0.0 {
		baseVel = 10.0
	}
	s.velocityBase[key] = (baseVel * 0.9) + (currVel * 0.1)
	velRatio := currVel / baseVel

	statTriggered := zscore > 3.0 || velRatio > 5.0
	return statTriggered, zscore, velRatio
}

// M5: Industry Prior Virality Baselines
type IndustryPrior struct {
	Baselines map[string]float64
}

func NewIndustryPrior() *IndustryPrior {
	return &IndustryPrior{
		Baselines: map[string]float64{
			"news":          0.45,
			"entertainment": 0.55,
			"sports":        0.40,
			"default":       0.45,
		},
	}
}

func (p *IndustryPrior) GetBaseline(category string) float64 {
	if val, ok := p.Baselines[category]; ok {
		return val
	}
	return p.Baselines["default"]
}

type ViralityPredictor struct {
	BasePredictiveEngine
	prior      *IndustryPrior
	tenantHist map[string][]float64
}

func NewViralityPredictor(tenantID string, aiGateway application.AIGatewayClient) *ViralityPredictor {
	return &ViralityPredictor{
		BasePredictiveEngine: BasePredictiveEngine{
			engineID:       "PRED-001",
			engineName:     "Story Virality Prediction Engine",
			tenantUUID:     tenantID,
			aiGateway:      aiGateway,
			predictionType: "VIRALITY",
		},
		prior:      NewIndustryPrior(),
		tenantHist: make(map[string][]float64),
	}
}

func (v *ViralityPredictor) ExecutePrediction(ctx context.Context, payload map[string]string) (interface{}, error) {
	tenantID, ok := payload["tenant_id"]
	if !ok || tenantID != v.tenantUUID {
		return nil, domain.ErrCrossTenantViolation
	}
	if v.aiGateway == nil {
		return nil, fmt.Errorf("AIGatewayService client not configured for %s", v.engineID)
	}
	storyID := payload["story_id"]
	res, err := v.aiGateway.PredictVirality(ctx, tenantID, storyID, payload)
	if err != nil {
		return nil, err
	}

	category := payload["category"]
	if category == "" {
		category = "news"
	}
	priorScore := v.prior.GetBaseline(category)

	v.mu.Lock()
	hist := v.tenantHist[tenantID]
	n := len(hist)

	// M5: Cold Start blending
	var llmWeight float64
	if n < 10 {
		llmWeight = 0.30
	} else if n < 50 {
		llmWeight = 0.30 + 0.70*float64(n-10)/40.0
	} else {
		llmWeight = 1.0
	}
	blendedScore := (res.ViralityScore * llmWeight) + (priorScore * (1.0 - llmWeight))
	res.ViralityScore = blendedScore

	// M7: Confidence Interval Dynamism
	var interval float64
	if n < 5 {
		interval = 0.12 // wider default for small sample sizes
	} else {
		mean := 0.0
		for _, s := range hist {
			mean += s
		}
		mean /= float64(n)
		variance := 0.0
		for _, s := range hist {
			variance += (s - mean) * (s - mean)
		}
		stddev := math.Sqrt(variance / float64(n))
		varCoeff := 0.0
		if mean > 0 {
			varCoeff = stddev / mean
		}
		interval = 0.08 * (1.0 + varCoeff)
		if interval < 0.05 {
			interval = 0.05
		} else if interval > 0.25 {
			interval = 0.25
		}
	}
	res.ConfidenceInterval = interval

	v.tenantHist[tenantID] = append(hist, blendedScore)
	v.mu.Unlock()

	if res.Metadata == nil {
		res.Metadata = make(map[string]string)
	}
	res.Metadata["cold_start_blended"] = fmt.Sprintf("%v", n < 50)
	res.Metadata["llm_weight"] = fmt.Sprintf("%.2f", llmWeight)
	res.Metadata["dynamic_interval"] = fmt.Sprintf("%.3f", interval)
	return res, nil
}

type EngagementOptimizer struct {
	BasePredictiveEngine
	rateLimiter application.RateLimiter
}

func NewEngagementOptimizer(tenantID string, aiGateway application.AIGatewayClient, limiter application.RateLimiter) *EngagementOptimizer {
	return &EngagementOptimizer{
		BasePredictiveEngine: BasePredictiveEngine{
			engineID:       "PRED-002",
			engineName:     "Audience Engagement Optimization Engine",
			tenantUUID:     tenantID,
			aiGateway:      aiGateway,
			predictionType: "ENGAGEMENT",
		},
		rateLimiter: limiter,
	}
}

func (e *EngagementOptimizer) ExecutePrediction(ctx context.Context, payload map[string]string) (interface{}, error) {
	tenantID, ok := payload["tenant_id"]
	if !ok || tenantID != e.tenantUUID {
		return nil, domain.ErrCrossTenantViolation
	}
	if e.aiGateway == nil {
		return nil, fmt.Errorf("AIGatewayService client not configured for %s", e.engineID)
	}
	contentID := payload["content_id"]
	res, err := e.aiGateway.OptimizeEngagement(ctx, tenantID, contentID, payload)
	if err != nil {
		return nil, err
	}

	// M8: Rate limit check on target platforms before recommending burst scheduling
	if e.rateLimiter != nil {
		validPlatforms := make([]domain.PlatformSource, 0, len(res.TargetPlatforms))
		if res.Metadata == nil {
			res.Metadata = make(map[string]string)
		}
		for _, p := range res.TargetPlatforms {
			rem, err := e.rateLimiter.Remaining(ctx, tenantID, p)
			if err == nil && rem >= 10 {
				validPlatforms = append(validPlatforms, p)
				res.Metadata[fmt.Sprintf("rate_limit_remaining_%s", p)] = fmt.Sprintf("%d", rem)
			} else {
				log.Printf("WARN [PRED-002]: filtering out platform %s due to low rate limit quota (%d < 10)", p, rem)
			}
		}
		if len(validPlatforms) == 0 {
			return nil, domain.ErrAllPlatformsRateLimited
		}
		res.TargetPlatforms = validPlatforms
	}

	return res, nil
}

type TrendLifecycleModeler struct {
	BasePredictiveEngine
	stateMachine *TrendLifecycleStateMachine
}

func NewTrendLifecycleModeler(tenantID string, aiGateway application.AIGatewayClient) *TrendLifecycleModeler {
	return &TrendLifecycleModeler{
		BasePredictiveEngine: BasePredictiveEngine{
			engineID:       "PRED-003",
			engineName:     "Trend Lifecycle Modeling Engine",
			tenantUUID:     tenantID,
			aiGateway:      aiGateway,
			predictionType: "TREND_LIFECYCLE",
		},
		stateMachine: NewTrendLifecycleStateMachine(),
	}
}

func (m *TrendLifecycleModeler) ExecutePrediction(ctx context.Context, payload map[string]string) (interface{}, error) {
	tenantID, ok := payload["tenant_id"]
	if !ok || tenantID != m.tenantUUID {
		return nil, domain.ErrCrossTenantViolation
	}
	if m.aiGateway == nil {
		return nil, fmt.Errorf("AIGatewayService client not configured for %s", m.engineID)
	}
	topicID := payload["topic_id"]

	rawVel := 15.0
	if val, ok := payload["velocity"]; ok && val != "" {
		var parsed float64
		if _, err := fmt.Sscanf(val, "%f", &parsed); err == nil {
			rawVel = parsed
		}
	}

	phase, ema, accel := m.stateMachine.CalculateNextPhase(tenantID, topicID, rawVel)
	res, err := m.aiGateway.ModelTrendLifecycle(ctx, tenantID, topicID, payload)
	if err != nil {
		return nil, err
	}
	res.CurrentPhase = phase
	res.Velocity = ema
	if res.Metadata == nil {
		res.Metadata = make(map[string]string)
	}
	res.Metadata["acceleration"] = fmt.Sprintf("%.2f", accel)
	res.Metadata["state_machine"] = "DETERMINISTIC_EMA_v1"
	return res, nil
}

// M9: MAPE Calibration Tracking Ledger
type CalibrationLedger struct {
	mu         sync.RWMutex
	records    map[string]*domain.ContentPerformanceForecast
	tenantMAPE map[string][]float64
}

func NewCalibrationLedger() *CalibrationLedger {
	return &CalibrationLedger{
		records:    make(map[string]*domain.ContentPerformanceForecast),
		tenantMAPE: make(map[string][]float64),
	}
}

func (l *CalibrationLedger) RecordForecast(f *domain.ContentPerformanceForecast) {
	if f == nil {
		return
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	l.records[f.ForecastID] = f
}

func (l *CalibrationLedger) RecordActual(tenantID, forecastID string, actualViews, actualEngagement int64) (float64, error) {
	l.mu.Lock()
	defer l.mu.Unlock()

	f, ok := l.records[forecastID]
	if !ok {
		return 0, fmt.Errorf("forecast %s not found in calibration ledger", forecastID)
	}
	if f.TenantID != tenantID {
		return 0, domain.ErrCrossTenantViolation
	}

	if f.PredictedViews == 0 {
		return 0, nil
	}

	mape := math.Abs(float64(actualViews-f.PredictedViews)) / float64(actualViews) * 100.0
	hist := l.tenantMAPE[tenantID]
	hist = append(hist, mape)
	l.tenantMAPE[tenantID] = hist

	avgMAPE := 0.0
	for _, m := range hist {
		avgMAPE += m
	}
	avgMAPE /= float64(len(hist))

	if avgMAPE > 30.0 {
		log.Printf("WARN [CalibrationLedger]: tenant %s average MAPE %.2f%% exceeds 30%% threshold!", tenantID, avgMAPE)
	}
	return mape, nil
}

type ContentPerformanceForecaster struct {
	BasePredictiveEngine
	ledger *CalibrationLedger
}

func NewContentPerformanceForecaster(tenantID string, aiGateway application.AIGatewayClient, ledger *CalibrationLedger) *ContentPerformanceForecaster {
	return &ContentPerformanceForecaster{
		BasePredictiveEngine: BasePredictiveEngine{
			engineID:       "PRED-004",
			engineName:     "Content Performance Forecasting Engine",
			tenantUUID:     tenantID,
			aiGateway:      aiGateway,
			predictionType: "FORECAST",
		},
		ledger: ledger,
	}
}

func (f *ContentPerformanceForecaster) ExecutePrediction(ctx context.Context, payload map[string]string) (interface{}, error) {
	tenantID, ok := payload["tenant_id"]
	if !ok || tenantID != f.tenantUUID {
		return nil, domain.ErrCrossTenantViolation
	}
	if f.aiGateway == nil {
		return nil, fmt.Errorf("AIGatewayService client not configured for %s", f.engineID)
	}
	contentID := payload["content_id"]
	res, err := f.aiGateway.ForecastPerformance(ctx, tenantID, contentID, payload)
	if err != nil {
		return nil, err
	}
	if f.ledger != nil {
		f.ledger.RecordForecast(res)
	}
	return res, nil
}

type AnomalyDetector struct {
	BasePredictiveEngine
	statDetector *StatisticalAnomalyDetector
}

func NewAnomalyDetector(tenantID string, aiGateway application.AIGatewayClient) *AnomalyDetector {
	return &AnomalyDetector{
		BasePredictiveEngine: BasePredictiveEngine{
			engineID:       "PRED-005",
			engineName:     "Anomaly Detection Engine",
			tenantUUID:     tenantID,
			aiGateway:      aiGateway,
			predictionType: "ANOMALY",
		},
		statDetector: NewStatisticalAnomalyDetector(),
	}
}

func (a *AnomalyDetector) ExecutePrediction(ctx context.Context, payload map[string]string) (interface{}, error) {
	tenantID, ok := payload["tenant_id"]
	if !ok || tenantID != a.tenantUUID {
		return nil, domain.ErrCrossTenantViolation
	}
	if a.aiGateway == nil {
		return nil, fmt.Errorf("AIGatewayService client not configured for %s", a.engineID)
	}
	platform := domain.PlatformSource(payload["platform"])
	if !platform.IsValid() {
		platform = domain.PlatformTwitter
	}

	currEng := 1000.0
	currVel := 50.0
	if val, ok := payload["engagement"]; ok {
		var parsed float64
		if _, err := fmt.Sscanf(val, "%f", &parsed); err == nil {
			currEng = parsed
		}
	}
	if val, ok := payload["velocity"]; ok {
		var parsed float64
		if _, err := fmt.Sscanf(val, "%f", &parsed); err == nil {
			currVel = parsed
		}
	}

	statTriggered, zscore, velRatio := a.statDetector.Evaluate(tenantID, platform, currEng, currVel)
	res, err := a.aiGateway.DetectAnomalies(ctx, tenantID, platform, payload)
	if err != nil {
		return nil, err
	}

	if !statTriggered {
		res.SeverityScore = 0.20
		res.Description = fmt.Sprintf("Benign signal: LLM flagged but statistical Z-score (%.2f) and velocity ratio (%.2f) within normal baseline", zscore, velRatio)
	} else {
		res.SeverityScore = math.Max(0.85, res.SeverityScore)
		res.Description = fmt.Sprintf("CONFIRMED ANOMALY: Z-score (%.2f) or velocity ratio (%.2f) exceeded threshold + LLM confirmed", zscore, velRatio)
	}

	if res.Metadata == nil {
		res.Metadata = make(map[string]string)
	}
	res.Metadata["acceptable_fpr"] = "0.001"
	res.Metadata["zscore"] = fmt.Sprintf("%.2f", zscore)
	res.Metadata["velocity_ratio"] = fmt.Sprintf("%.2f", velRatio)
	return res, nil
}

func CreateAllPredictiveEngines(tenantID string, aiGateway application.AIGatewayClient, limiter application.RateLimiter, ledger *CalibrationLedger) map[string]domain.PredictiveEngine {
	m := make(map[string]domain.PredictiveEngine, 5)
	m["PRED-001"] = NewViralityPredictor(tenantID, aiGateway)
	m["PRED-002"] = NewEngagementOptimizer(tenantID, aiGateway, limiter)
	m["PRED-003"] = NewTrendLifecycleModeler(tenantID, aiGateway)
	m["PRED-004"] = NewContentPerformanceForecaster(tenantID, aiGateway, ledger)
	m["PRED-005"] = NewAnomalyDetector(tenantID, aiGateway)
	_ = time.Now()
	return m
}
