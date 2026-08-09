package application

import (
	"context"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

// ModelRepository defines the storage interface for predictive models and metadata in IMP-018.
type ModelRepository interface {
	SaveModel(ctx context.Context, tenantID string, model *domain.Model) error
	GetModel(ctx context.Context, tenantID string, predictionType domain.PredictionType, version string) (*domain.Model, error)
	GetLatestModel(ctx context.Context, tenantID string, predictionType domain.PredictionType) (*domain.Model, error)
	ListModels(ctx context.Context, tenantID string, predictionType domain.PredictionType) ([]*domain.ModelMetadata, error)
	DeleteModel(ctx context.Context, tenantID string, predictionType domain.PredictionType, version string) error
}
