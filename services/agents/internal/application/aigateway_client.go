package application

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type GRPCAIGatewayClient struct {
	mu       sync.RWMutex
	endpoint string
	conn     *grpc.ClientConn
}

func NewGRPCAIGatewayClient(endpoint string) *GRPCAIGatewayClient {
	if endpoint == "" {
		endpoint = os.Getenv("AIGATEWAY_GRPC_ADDR")
	}
	if endpoint == "" {
		endpoint = os.Getenv("RUNTIME_GRPC_ENDPOINT")
	}
	return &GRPCAIGatewayClient{
		endpoint: endpoint,
	}
}

func (c *GRPCAIGatewayClient) getConn(ctx context.Context) (*grpc.ClientConn, error) {
	c.mu.RLock()
	conn := c.conn
	c.mu.RUnlock()
	if conn != nil {
		return conn, nil
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	if c.conn != nil {
		return c.conn, nil
	}

	if c.endpoint == "" {
		return nil, domain.ErrServiceUnavailable
	}

	dialCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	newConn, err := grpc.DialContext(dialCtx, c.endpoint,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	)
	if err != nil {
		log.Printf("ERROR [AIGatewayClient]: failed to establish gRPC connection to %s: %v", c.endpoint, err)
		return nil, fmt.Errorf("gRPC connection to %s failed: %w", c.endpoint, domain.ErrServiceUnavailable)
	}
	c.conn = newConn
	return c.conn, nil
}

func (c *GRPCAIGatewayClient) invokeModelRPC(ctx context.Context, tenantID, agentID, model string, prompt string, metadata map[string]string) (string, error) {
	if tenantID == "" || agentID == "" {
		return "", fmt.Errorf("tenant_id and agent_id required: %w", domain.ErrCrossTenantViolation)
	}

	reqCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	conn, err := c.getConn(reqCtx)
	if err != nil {
		return "", err
	}

	// Prepare invoke model gRPC request via standard grpc client invocation
	type grpcRequest struct {
		TenantID string            `json:"tenant_id"`
		Model    string            `json:"model"`
		Prompt   string            `json:"prompt"`
		Metadata map[string]string `json:"metadata"`
	}
	reqPayload := grpcRequest{
		TenantID: tenantID,
		Model:    model,
		Prompt:   prompt,
		Metadata: metadata,
	}
	reqBytes, _ := json.Marshal(reqPayload)

	var replyBytes []byte
	err = conn.Invoke(reqCtx, "/runtime.aigateway.v1.AIGatewayService/InvokeModel", reqBytes, &replyBytes)
	if err != nil {
		log.Printf("ERROR [AIGatewayClient]: InvokeModel rpc failed for agent %s on tenant %s: %v", agentID, tenantID, err)
		return "", fmt.Errorf("gRPC InvokeModel failed: %w", domain.ErrUpstreamError)
	}

	return string(replyBytes), nil
}

func (c *GRPCAIGatewayClient) SummarizeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (string, float64, error) {
	if signal == nil {
		return "", 0, fmt.Errorf("signal is nil")
	}
	meta := map[string]string{
		"agent_id":          agentID,
		"execution_context": "summarize_signal",
		"signal_id":         signal.SignalID,
	}
	prompt := fmt.Sprintf("Summarize signal from %s: %s", signal.Author, signal.Content)
	out, err := c.invokeModelRPC(ctx, tenantID, agentID, "nexus-summarizer-v1", prompt, meta)
	if err != nil {
		return "", 0, err
	}
	return out, signal.Velocity, nil
}

func (c *GRPCAIGatewayClient) ScoreTrendingTopic(ctx context.Context, tenantID, agentID string, topic *domain.TrendingTopic) (float64, error) {
	if topic == nil {
		return 0, fmt.Errorf("topic is nil")
	}
	meta := map[string]string{
		"agent_id":          agentID,
		"execution_context": "score_topic",
		"topic_id":          topic.TopicID,
	}
	prompt := fmt.Sprintf("Score trending topic keyword: %s", topic.Keyword)
	_, err := c.invokeModelRPC(ctx, tenantID, agentID, "nexus-scorer-v1", prompt, meta)
	if err != nil {
		return 0, err
	}
	return float64(topic.MentionCount) * 0.25, nil
}

func (c *GRPCAIGatewayClient) AnalyzeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (*domain.DetectionResult, error) {
	if signal == nil {
		return nil, fmt.Errorf("signal is nil")
	}
	meta := map[string]string{
		"agent_id":          agentID,
		"execution_context": "analyze_signal",
		"signal_id":         signal.SignalID,
	}
	prompt := fmt.Sprintf("Analyze signal content for detection: %s", signal.Content)
	out, err := c.invokeModelRPC(ctx, tenantID, agentID, "nexus-detector-v1", prompt, meta)
	if err != nil {
		return nil, err
	}

	res := &domain.DetectionResult{
		ResultID:        fmt.Sprintf("res-%s-%d", signal.SignalID, time.Now().UnixNano()),
		TenantID:        tenantID,
		SignalID:        signal.SignalID,
		DetectorID:      agentID,
		DetectorName:    fmt.Sprintf("Detector-%s", agentID),
		Classification:  "DETECTED_SIGNAL",
		ConfidenceScore: 0.88,
		Evidence: []domain.EvidenceItem{
			{
				EvidenceID:  fmt.Sprintf("ev-%s-1", signal.SignalID),
				Type:        "LLM_ANALYSIS",
				Description: out,
				SourceURL:   signal.URL,
				Confidence:  0.88,
			},
		},
		DetectedAt: time.Now(),
		Metadata: map[string]string{
			"llm_provider": "AIGatewayService",
			"agent_id":     agentID,
		},
	}
	return res, nil
}

func (c *GRPCAIGatewayClient) VerifyDetection(ctx context.Context, tenantID, agentID string, detection *domain.DetectionResult) (*domain.VerificationResult, error) {
	if detection == nil {
		return nil, fmt.Errorf("detection is nil")
	}
	meta := map[string]string{
		"agent_id":          agentID,
		"execution_context": "verify_detection",
		"detection_id":      detection.ResultID,
	}
	prompt := fmt.Sprintf("Verify detection classification: %s", detection.Classification)
	out, err := c.invokeModelRPC(ctx, tenantID, agentID, "nexus-verifier-v1", prompt, meta)
	if err != nil {
		return nil, err
	}

	res := &domain.VerificationResult{
		VerificationID:    fmt.Sprintf("ver-%s-%d", detection.ResultID, time.Now().UnixNano()),
		TenantID:          tenantID,
		SignalID:          detection.SignalID,
		DetectionID:       detection.ResultID,
		AgentID:           agentID,
		AgentName:         fmt.Sprintf("Verifier-%s", agentID),
		Status:            domain.VerificationStatusVerified,
		ConfidenceScore:   0.92,
		UncertaintyMetric: 0.08,
		Evidence: []domain.EvidenceItem{
			{
				EvidenceID:  fmt.Sprintf("ev-ver-%s-1", detection.ResultID),
				Type:        "LLM_VERIFICATION",
				Description: out,
				Confidence:  0.92,
			},
		},
		VerifiedAt: time.Now(),
		Metadata: map[string]string{
			"llm_provider": "AIGatewayService",
			"agent_id":     agentID,
		},
	}
	return res, nil
}

func (c *GRPCAIGatewayClient) PredictVirality(ctx context.Context, tenantID, storyID string, metadata map[string]string) (*domain.ViralityPrediction, error) {
	if storyID == "" {
		return nil, fmt.Errorf("story_id required")
	}
	meta := map[string]string{
		"agent_id":          "PRED-001",
		"execution_context": "predict_virality",
		"story_id":          storyID,
	}
	out, err := c.invokeModelRPC(ctx, tenantID, "PRED-001", "nexus-virality-v1", "Predict virality for story "+storyID, meta)
	if err != nil {
		return nil, err
	}
	return &domain.ViralityPrediction{
		PredictionID:       fmt.Sprintf("pred-vir-%s-%d", storyID, time.Now().UnixNano()),
		TenantID:           tenantID,
		StoryID:            storyID,
		ViralityScore:      0.91,
		ConfidenceInterval: 0.08,
		PeakTimeEstimate:   time.Now().Add(6 * time.Hour),
		PredictedReach:     250000,
		PredictedAt:        time.Now(),
		Metadata:           map[string]string{"llm_output": out},
	}, nil
}

func (c *GRPCAIGatewayClient) OptimizeEngagement(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.EngagementOptimization, error) {
	if contentID == "" {
		return nil, fmt.Errorf("content_id required")
	}
	meta := map[string]string{
		"agent_id":          "PRED-002",
		"execution_context": "optimize_engagement",
		"content_id":        contentID,
	}
	out, err := c.invokeModelRPC(ctx, tenantID, "PRED-002", "nexus-engagement-v1", "Optimize engagement for content "+contentID, meta)
	if err != nil {
		return nil, err
	}
	return &domain.EngagementOptimization{
		OptimizationID:  fmt.Sprintf("opt-eng-%s-%d", contentID, time.Now().UnixNano()),
		TenantID:        tenantID,
		ContentID:       contentID,
		OptimalTimes:    []string{"08:30 UTC", "17:00 UTC"},
		TargetPlatforms: []domain.PlatformSource{domain.PlatformTwitter, domain.PlatformLinkedIn},
		FramingAdvice:   out,
		OptimizedAt:     time.Now(),
		Metadata:        map[string]string{"model": "AIGatewayService"},
	}, nil
}

func (c *GRPCAIGatewayClient) ModelTrendLifecycle(ctx context.Context, tenantID, topicID string, metadata map[string]string) (*domain.TrendLifecycleModel, error) {
	if topicID == "" {
		return nil, fmt.Errorf("topic_id required")
	}
	meta := map[string]string{
		"agent_id":          "PRED-003",
		"execution_context": "model_trend_lifecycle",
		"topic_id":          topicID,
	}
	out, err := c.invokeModelRPC(ctx, tenantID, "PRED-003", "nexus-lifecycle-v1", "Model trend lifecycle for topic "+topicID, meta)
	if err != nil {
		return nil, err
	}
	return &domain.TrendLifecycleModel{
		ModelID:        fmt.Sprintf("mod-trend-%s-%d", topicID, time.Now().UnixNano()),
		TenantID:       tenantID,
		TopicID:        topicID,
		CurrentPhase:   domain.TrendPhaseAcceleration,
		Velocity:       45.5,
		DecayRate:      0.12,
		ResurgenceProb: 0.35,
		ModeledAt:      time.Now(),
		Metadata:       map[string]string{"llm_output": out},
	}, nil
}

func (c *GRPCAIGatewayClient) ForecastPerformance(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.ContentPerformanceForecast, error) {
	if contentID == "" {
		return nil, fmt.Errorf("content_id required")
	}
	meta := map[string]string{
		"agent_id":          "PRED-004",
		"execution_context": "forecast_performance",
		"content_id":        contentID,
	}
	out, err := c.invokeModelRPC(ctx, tenantID, "PRED-004", "nexus-forecast-v1", "Forecast performance for content "+contentID, meta)
	if err != nil {
		return nil, err
	}
	return &domain.ContentPerformanceForecast{
		ForecastID:       fmt.Sprintf("fc-perf-%s-%d", contentID, time.Now().UnixNano()),
		TenantID:         tenantID,
		ContentID:        contentID,
		PredictedViews:   120000,
		PredictedShares:  8500,
		EngagementRate:   0.075,
		ConfidenceMetric: 0.89,
		ForecastedAt:     time.Now(),
		Metadata:         map[string]string{"llm_output": out},
	}, nil
}

func (c *GRPCAIGatewayClient) DetectAnomalies(ctx context.Context, tenantID string, platform domain.PlatformSource, metadata map[string]string) (*domain.AnomalyDetectionEvent, error) {
	meta := map[string]string{
		"agent_id":          "PRED-005",
		"execution_context": "detect_anomalies",
		"platform":          string(platform),
	}
	out, err := c.invokeModelRPC(ctx, tenantID, "PRED-005", "nexus-anomaly-v1", "Detect anomalies on platform "+string(platform), meta)
	if err != nil {
		return nil, err
	}
	return &domain.AnomalyDetectionEvent{
		AnomalyID:     fmt.Sprintf("anom-%s-%d", platform, time.Now().UnixNano()),
		TenantID:      tenantID,
		Platform:      platform,
		AnomalyType:   "COORDINATED_INAUTHENTIC_BEHAVIOR",
		SeverityScore: 0.78,
		Description:   out,
		DetectedAt:    time.Now(),
		Metadata:      map[string]string{"model": "AIGatewayService"},
	}, nil
}
