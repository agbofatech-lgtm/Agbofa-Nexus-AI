package application

import (
	"context"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

// PredictionService defines the core predictive inference engine interface for IMP-018.
type PredictionService interface {
	Predict(ctx context.Context, tenantID string, predictionType domain.PredictionType, features map[string]interface{}) (*domain.PredictionResult, error)
	BatchPredict(ctx context.Context, tenantID string, requests []*domain.PredictionRequest) ([]*domain.PredictionResult, error)
	GetModelMetadata(ctx context.Context, tenantID string, predictionType domain.PredictionType) (*domain.ModelMetadata, error)
}
