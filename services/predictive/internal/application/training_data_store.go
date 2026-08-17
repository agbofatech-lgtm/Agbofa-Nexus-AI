package application

import (
	"context"
	"time"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

// TrainingDataStore defines the persistence interface for predictive training examples and data statistics in IMP-018.
type TrainingDataStore interface {
	StoreTrainingData(ctx context.Context, tenantID string, predictionType domain.PredictionType, features map[string]interface{}, labels map[string]interface{}) error
	GetTrainingData(ctx context.Context, tenantID string, predictionType domain.PredictionType, since time.Time, until time.Time) ([]*domain.TrainingExample, error)
	GetDataStats(ctx context.Context, tenantID string, predictionType domain.PredictionType) (*domain.DataStats, error)
}
