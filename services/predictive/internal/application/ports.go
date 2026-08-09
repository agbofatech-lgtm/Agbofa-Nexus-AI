package application

import (
	"context"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

type EventPublisher interface {
	PublishPredictionCompleted(ctx context.Context, event *domain.PredictionCompletedEvent) error
	PublishModelAccuracyUpdated(ctx context.Context, event *domain.ModelAccuracyUpdatedEvent) error
}

type AuditLogger interface {
	LogAudit(ctx context.Context, tenantID, action string, details map[string]interface{}) error
}

type AIGatewayClient interface {
	InvokeModel(ctx context.Context, tenantID, agentID, model, prompt string, metadata map[string]string) (string, float64, error)
}

// ViralityFallbackAgent defines the contract to invoke AGT-016 heuristic prediction fallback
// when model confidence < ViralityModelFallbackThreshold (0.70).
type ViralityFallbackAgent interface {
	PredictHeuristic(ctx context.Context, tenantID string, features domain.ViralityFeatures) (*domain.ViralityPrediction, error)
}
