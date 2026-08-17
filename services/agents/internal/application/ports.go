package application

import (
	"context"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type PlatformClient interface {
	FetchSignals(ctx context.Context, tenantID string, platform domain.PlatformSource, keywords []string) ([]domain.MonitorSignal, error)
}

type EventPublisher interface {
	PublishSignalDetected(ctx context.Context, event *domain.MonitorSignalDetectedEvent) error
	PublishTrendingTopic(ctx context.Context, event *domain.TrendingTopicFoundEvent) error
	PublishDetectionResult(ctx context.Context, event *domain.DetectionResultReadyEvent) error
	PublishVerificationCompleted(ctx context.Context, event *domain.VerificationCompletedEvent) error
	PublishComplianceClearance(ctx context.Context, event *domain.ComplianceClearanceEvent) error
	PublishPipelineExecution(ctx context.Context, event *domain.PipelineExecutionEvent) error
	PublishPredictionIntelligence(ctx context.Context, event *domain.PredictiveIntelligenceEvent) error
}

type AIGatewayClient interface {
	SummarizeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (string, float64, error)
	ScoreTrendingTopic(ctx context.Context, tenantID, agentID string, topic *domain.TrendingTopic) (float64, error)
	AnalyzeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (*domain.DetectionResult, error)
	VerifyDetection(ctx context.Context, tenantID, agentID string, detection *domain.DetectionResult) (*domain.VerificationResult, error)
	PredictVirality(ctx context.Context, tenantID, storyID string, metadata map[string]string) (*domain.ViralityPrediction, error)
	OptimizeEngagement(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.EngagementOptimization, error)
	ModelTrendLifecycle(ctx context.Context, tenantID, topicID string, metadata map[string]string) (*domain.TrendLifecycleModel, error)
	ForecastPerformance(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.ContentPerformanceForecast, error)
	DetectAnomalies(ctx context.Context, tenantID string, platform domain.PlatformSource, metadata map[string]string) (*domain.AnomalyDetectionEvent, error)
}

type RateLimiter interface {
	Allow(ctx context.Context, platform domain.PlatformSource, tenantID string) (bool, error)
	Remaining(ctx context.Context, platform domain.PlatformSource, tenantID string) (int, error)
}

type Neo4jClient interface {
	UpdateStoryGraph(ctx context.Context, tenantID, storyID string, verification domain.VerificationResult) error
	RollbackStoryGraph(ctx context.Context, tenantID, storyID string) error
}

type Phase1ServiceClient interface {
	RouteToContentFactory(ctx context.Context, tenantID, storyID string, metadata map[string]string) error
	CheckCompliance(ctx context.Context, tenantID, contentID string) (bool, string, error)
	ScheduleDistribution(ctx context.Context, tenantID, contentID string, platforms []string) error
	CollectAnalytics(ctx context.Context, tenantID, contentID string) (map[string]interface{}, error)
	MonitorServiceHealth(ctx context.Context, serviceID string) (bool, error)
	CollectOptimizationSignals(ctx context.Context, tenantID string) ([]map[string]interface{}, error)
}

type TrendDataStoreClient interface {
	GetHistoricalTrends(ctx context.Context, tenantID, topicID string) (map[string]interface{}, error)
}
