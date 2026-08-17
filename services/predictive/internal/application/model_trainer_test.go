package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

type mockTrainingStore struct {
	examples []*domain.TrainingExample
	err      error
}

func (m *mockTrainingStore) StoreTrainingData(ctx context.Context, tenantID string, predictionType domain.PredictionType, features map[string]interface{}, labels map[string]interface{}) error {
	return m.err
}
func (m *mockTrainingStore) GetTrainingData(ctx context.Context, tenantID string, predictionType domain.PredictionType, since, until time.Time) ([]*domain.TrainingExample, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.examples, nil
}
func (m *mockTrainingStore) GetDataStats(ctx context.Context, tenantID string, predictionType domain.PredictionType) (*domain.DataStats, error) {
	return &domain.DataStats{TotalExamples: int64(len(m.examples))}, nil
}

type mockModelRepo struct {
	models map[string]*domain.Model
}

func newMockModelRepo() *mockModelRepo {
	return &mockModelRepo{models: make(map[string]*domain.Model)}
}

func (m *mockModelRepo) SaveModel(ctx context.Context, tenantID string, model *domain.Model) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	m.models[model.Version] = model
	return nil
}

func (m *mockModelRepo) GetModel(ctx context.Context, tenantID string, predictionType domain.PredictionType, version string) (*domain.Model, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	mod, ok := m.models[version]
	if !ok {
		return nil, domain.ErrModelNotFound
	}
	return mod, nil
}

func (m *mockModelRepo) GetLatestModel(ctx context.Context, tenantID string, predictionType domain.PredictionType) (*domain.Model, error) {
	for _, mod := range m.models {
		if mod.Metadata["status"] == "ACTIVE" {
			return mod, nil
		}
	}
	return nil, domain.ErrModelNotFound
}

func (m *mockModelRepo) ListModels(ctx context.Context, tenantID string, predictionType domain.PredictionType) ([]*domain.ModelMetadata, error) {
	var list []*domain.ModelMetadata
	for _, mod := range m.models {
		list = append(list, &domain.ModelMetadata{
			ModelID:        mod.ModelID,
			TenantID:       tenantID,
			PredictionType: predictionType,
			Version:        mod.Version,
			Status:         mod.Metadata["status"],
		})
	}
	return list, nil
}

func (m *mockModelRepo) DeleteModel(ctx context.Context, tenantID string, predictionType domain.PredictionType, version string) error {
	delete(m.models, version)
	return nil
}

func TestModelTrainerTrainModel(t *testing.T) {
	repo := newMockModelRepo()
	ctx := context.Background()

	// 1. Less than 100 examples -> ErrInsufficientTrainingData
	storeLow := &mockTrainingStore{examples: make([]*domain.TrainingExample, 50)}
	trainerLow := NewModelTrainer(repo, storeLow, nil, nil)

	_, err := trainerLow.TrainModel(ctx, "tenant-1", domain.PredictionTypeVirality)
	if !errors.Is(err, domain.ErrInsufficientTrainingData) {
		t.Fatalf("expected ErrInsufficientTrainingData for <100 examples, got %v", err)
	}

	// 2. >= 100 examples -> Trains and saves candidate model
	storeHigh := &mockTrainingStore{examples: make([]*domain.TrainingExample, 150)}
	trainerHigh := NewModelTrainer(repo, storeHigh, nil, nil)

	meta, err := trainerHigh.TrainModel(ctx, "tenant-1", domain.PredictionTypeVirality)
	if err != nil {
		t.Fatalf("unexpected error on train model: %v", err)
	}
	if meta.Status != "CANDIDATE" {
		t.Fatalf("expected trained model status CANDIDATE, got %s", meta.Status)
	}
	if meta.AccuracyMetric < 0.85 {
		t.Fatalf("expected accuracy metric >= 0.85, got %.4f", meta.AccuracyMetric)
	}
}

func TestModelTrainerEvaluateAndPromote(t *testing.T) {
	repo := newMockModelRepo()
	store := &mockTrainingStore{examples: make([]*domain.TrainingExample, 120)}
	trainer := NewModelTrainer(repo, store, nil, nil)
	ctx := context.Background()

	// Create initial ACTIVE model v1
	_ = repo.SaveModel(ctx, "tenant-1", &domain.Model{
		ModelID:        "mod-1",
		TenantID:       "tenant-1",
		PredictionType: domain.PredictionTypeVirality,
		Version:        "v1",
		Metadata:       map[string]string{"status": "ACTIVE", "accuracy": "0.80"},
	})

	// Train new candidate v2
	metaV2, err := trainer.TrainModel(ctx, "tenant-1", domain.PredictionTypeVirality)
	if err != nil {
		t.Fatalf("unexpected error on train v2: %v", err)
	}

	// Evaluate v2
	evalMeta, err := trainer.EvaluateModel(ctx, "tenant-1", domain.PredictionTypeVirality, metaV2.Version)
	if err != nil {
		t.Fatalf("unexpected error on evaluate v2: %v", err)
	}
	if evalMeta.AccuracyMetric <= 0.80 {
		t.Fatalf("expected evaluated accuracy > 0.80")
	}

	// Promote v2 -> sets v2 ACTIVE and v1 RETIRED
	if err := trainer.PromoteModel(ctx, "tenant-1", domain.PredictionTypeVirality, metaV2.Version); err != nil {
		t.Fatalf("unexpected error promoting v2: %v", err)
	}

	promoted, _ := repo.GetModel(ctx, "tenant-1", domain.PredictionTypeVirality, metaV2.Version)
	if promoted.Metadata["status"] != "ACTIVE" {
		t.Fatalf("expected promoted v2 status ACTIVE, got %s", promoted.Metadata["status"])
	}

	retired, _ := repo.GetModel(ctx, "tenant-1", domain.PredictionTypeVirality, "v1")
	if retired.Metadata["status"] != "RETIRED" {
		t.Fatalf("expected previous v1 status RETIRED, got %s", retired.Metadata["status"])
	}
}

func TestModelTrainerTenantIsolation(t *testing.T) {
	trainer := NewModelTrainer(nil, nil, nil, nil)
	ctx := context.Background()

	if _, err := trainer.TrainModel(ctx, "", domain.PredictionTypeVirality); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant on TrainModel, got %v", err)
	}
	if _, err := trainer.EvaluateModel(ctx, "", domain.PredictionTypeVirality, "v1"); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant on EvaluateModel, got %v", err)
	}
	if err := trainer.PromoteModel(ctx, "", domain.PredictionTypeVirality, "v1"); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant on PromoteModel, got %v", err)
	}
}
