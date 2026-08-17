package domain

import (
	"context"
	"time"
)

type AgentStateRepository interface {
	SaveState(ctx context.Context, tenantID string, agent *BaseAgent) error
	GetState(ctx context.Context, tenantID, agentID string) (*BaseAgent, error)
	UpdateStatus(ctx context.Context, tenantID, agentID string, status AgentStatus) error
}

type SignalRepository interface {
	SaveSignal(ctx context.Context, tenantID string, signal *MonitorSignal) error
	GetSignalByID(ctx context.Context, tenantID, signalID string) (*MonitorSignal, error)
	ListSignals(ctx context.Context, tenantID string, platform PlatformSource, limit int) ([]MonitorSignal, error)
}

type MonitorConfigRepository interface {
	GetConfig(ctx context.Context, tenantID, agentID string) (map[string]string, error)
	SaveConfig(ctx context.Context, tenantID, agentID string, config map[string]string) error
}

type DetectionRepository interface {
	SaveResult(ctx context.Context, tenantID string, result *DetectionResult) error
	GetResultByID(ctx context.Context, tenantID, resultID string) (*DetectionResult, error)
	ListResultsBySignal(ctx context.Context, tenantID, signalID string) ([]DetectionResult, error)
}

type SourceCredibilityRepository interface {
	SaveCredibility(ctx context.Context, tenantID string, score *SourceCredibilityScore) error
	GetCredibility(ctx context.Context, tenantID, sourceID string) (*SourceCredibilityScore, error)
	UpsertCredibility(ctx context.Context, tenantID string, score *SourceCredibilityScore) error
}

type VerificationRepository interface {
	SaveVerificationResult(ctx context.Context, tenantID string, result *VerificationResult) error
	GetVerificationResultByID(ctx context.Context, tenantID, verificationID string) (*VerificationResult, error)
	ListVerificationResultsBySignal(ctx context.Context, tenantID, signalID string) ([]VerificationResult, error)
}

type ClaimExtractRepository interface {
	SaveClaimExtract(ctx context.Context, tenantID string, claim *ClaimExtract) error
	ListClaimExtracts(ctx context.Context, tenantID, signalID string) ([]ClaimExtract, error)
}

type BiasAssessmentRepository interface {
	SaveBiasAssessment(ctx context.Context, tenantID string, bias *BiasAssessment) error
	GetBiasAssessment(ctx context.Context, tenantID, signalID string) (*BiasAssessment, error)
}

type PipelineRepository interface {
	SavePipelineState(ctx context.Context, tenantID string, state *PipelineState) error
	GetPipelineState(ctx context.Context, tenantID, agentID string) (*PipelineState, error)
	AppendAuditLog(ctx context.Context, tenantID string, entry *PipelineAuditEntry) error
	SaveFeedbackSignal(ctx context.Context, tenantID string, signal *FeedbackSignal) error
	ListFeedbackSignals(ctx context.Context, tenantID, targetAgent string) ([]FeedbackSignal, error)
}

type PredictiveRepository interface {
	SaveViralityPrediction(ctx context.Context, tenantID string, p *ViralityPrediction) error
	GetViralityPrediction(ctx context.Context, tenantID, predictionID string) (*ViralityPrediction, error)
	SaveEngagementOptimization(ctx context.Context, tenantID string, opt *EngagementOptimization) error
	SaveTrendLifecycleModel(ctx context.Context, tenantID string, m *TrendLifecycleModel) error
	SaveContentPerformanceForecast(ctx context.Context, tenantID string, f *ContentPerformanceForecast) error
	SaveAnomalyDetectionEvent(ctx context.Context, tenantID string, a *AnomalyDetectionEvent) error
	ListAnomalyEvents(ctx context.Context, tenantID string, limit int) ([]AnomalyDetectionEvent, error)
}

type PersonalizationRepository interface {
	SaveReaderProfile(ctx context.Context, tenantID string, profile *ReaderProfile) error
	GetReaderProfile(ctx context.Context, tenantID, readerID string) (*ReaderProfile, error)
	RecordBehavioralSignal(ctx context.Context, tenantID string, signal *BehavioralSignal) error
	SavePersonalizedFeed(ctx context.Context, tenantID string, feed *PersonalizedFeed) error
	GetPersonalizedFeed(ctx context.Context, tenantID, readerID string) (*PersonalizedFeed, error)
	CleanupExpiredSignals(ctx context.Context, maxAge time.Duration) (int, error)
}
