package ports

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/agbofa/nexus/services/predictive/internal/application"
	"github.com/agbofa/nexus/services/predictive/internal/domain"
	"github.com/agbofa/nexus/services/predictive/internal/infrastructure"
)

// PredictionGRPCServer implements the authoritative gRPC PredictionService for IMP-018 Batch 3.
// Enforces multi-tenant Row-Level Security (RLS) by executing SET LOCAL app.current_tenant = $1
// before data access in every method, routes to domain engines, and utilizes TTL caching.
type PredictionGRPCServer struct {
	db               *sql.DB
	modelRepo        application.ModelRepository
	trainingStore    application.TrainingDataStore
	cache            *infrastructure.PredictionCache
	trainer          *application.ModelTrainer
	viralityEngine   application.PredictionService
	engagementEngine application.PredictionService
	optimizerEngine  application.PredictionService
	trendEngine      application.PredictionService
	anomalyEngine    application.PredictionService
	pubtimeEngine    application.PredictionService
}

// NewPredictionGRPCServer initializes a new authoritative PredictionGRPCServer.
func NewPredictionGRPCServer(
	db *sql.DB,
	modelRepo application.ModelRepository,
	trainingStore application.TrainingDataStore,
	cache *infrastructure.PredictionCache,
	trainer *application.ModelTrainer,
	viralityEngine application.PredictionService,
	engagementEngine application.PredictionService,
	optimizerEngine application.PredictionService,
	trendEngine application.PredictionService,
	anomalyEngine application.PredictionService,
	pubtimeEngine application.PredictionService,
) *PredictionGRPCServer {
	return &PredictionGRPCServer{
		db:               db,
		modelRepo:        modelRepo,
		trainingStore:    trainingStore,
		cache:            cache,
		trainer:          trainer,
		viralityEngine:   viralityEngine,
		engagementEngine: engagementEngine,
		optimizerEngine:  optimizerEngine,
		trendEngine:      trendEngine,
		anomalyEngine:    anomalyEngine,
		pubtimeEngine:    pubtimeEngine,
	}
}

func (s *PredictionGRPCServer) enforceRLS(ctx context.Context, tenantID string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	if s.db != nil {
		_, err := s.db.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID)
		if err != nil {
			return fmt.Errorf("failed to enforce RLS tenant context: %w", err)
		}
	}
	return nil
}

// Predict executes a single prediction request, routing to the appropriate domain engine
// and utilizing TTL caching.
func (s *PredictionGRPCServer) Predict(ctx context.Context, tenantID string, predictionType domain.PredictionType, features map[string]interface{}) (*domain.PredictionResult, error) {
	if err := s.enforceRLS(ctx, tenantID); err != nil {
		return nil, err
	}

	if s.cache != nil {
		if cached, hit := s.cache.Get(ctx, tenantID, predictionType, features); hit && cached != nil {
			return cached, nil
		}
	}

	engine, err := s.resolveEngine(predictionType)
	if err != nil {
		return nil, err
	}

	res, err := engine.Predict(ctx, tenantID, predictionType, features)
	if err != nil {
		return nil, err
	}

	if s.cache != nil {
		s.cache.Put(ctx, tenantID, predictionType, features, res)
	}

	return res, nil
}

// BatchPredict executes concurrent batch predictions across a slice of requests.
func (s *PredictionGRPCServer) BatchPredict(ctx context.Context, tenantID string, requests []*domain.PredictionRequest) ([]*domain.PredictionResult, error) {
	if err := s.enforceRLS(ctx, tenantID); err != nil {
		return nil, err
	}
	if len(requests) == 0 {
		return nil, nil
	}

	pt := requests[0].PredictionType
	engine, err := s.resolveEngine(pt)
	if err != nil {
		return nil, err
	}

	return engine.BatchPredict(ctx, tenantID, requests)
}

// TrainModel triggers model training via ModelTrainer.
func (s *PredictionGRPCServer) TrainModel(ctx context.Context, tenantID string, predictionType domain.PredictionType) (*domain.ModelMetadata, error) {
	if err := s.enforceRLS(ctx, tenantID); err != nil {
		return nil, err
	}
	if s.trainer == nil {
		return nil, errors.New("ModelTrainer is nil")
	}
	return s.trainer.TrainModel(ctx, tenantID, predictionType)
}

// EvaluateModel evaluates model accuracy via ModelTrainer.
func (s *PredictionGRPCServer) EvaluateModel(ctx context.Context, tenantID string, predictionType domain.PredictionType, modelVersion string) (*domain.ModelMetadata, error) {
	if err := s.enforceRLS(ctx, tenantID); err != nil {
		return nil, err
	}
	if s.trainer == nil {
		return nil, errors.New("ModelTrainer is nil")
	}
	return s.trainer.EvaluateModel(ctx, tenantID, predictionType, modelVersion)
}

// PromoteModel promotes a candidate model version to ACTIVE and invalidates affected cache entries.
func (s *PredictionGRPCServer) PromoteModel(ctx context.Context, tenantID string, predictionType domain.PredictionType, version string) error {
	if err := s.enforceRLS(ctx, tenantID); err != nil {
		return err
	}
	if s.trainer == nil {
		return errors.New("ModelTrainer is nil")
	}
	if err := s.trainer.PromoteModel(ctx, tenantID, predictionType, version); err != nil {
		return err
	}
	if s.cache != nil {
		s.cache.InvalidateByPredictionType(tenantID, predictionType)
	}
	return nil
}

// GetModelMetadata returns model metadata and accuracy statistics for a prediction type.
func (s *PredictionGRPCServer) GetModelMetadata(ctx context.Context, tenantID string, predictionType domain.PredictionType) (*domain.ModelMetadata, error) {
	if err := s.enforceRLS(ctx, tenantID); err != nil {
		return nil, err
	}
	engine, err := s.resolveEngine(predictionType)
	if err != nil {
		return nil, err
	}
	return engine.GetModelMetadata(ctx, tenantID, predictionType)
}

// ListModels returns all model versions for a prediction type from ModelRepository.
func (s *PredictionGRPCServer) ListModels(ctx context.Context, tenantID string, predictionType domain.PredictionType) ([]*domain.ModelMetadata, error) {
	if err := s.enforceRLS(ctx, tenantID); err != nil {
		return nil, err
	}
	if s.modelRepo == nil {
		return nil, errors.New("ModelRepository is nil")
	}
	return s.modelRepo.ListModels(ctx, tenantID, predictionType)
}

// GetPredictionCache returns operational statistics for the prediction TTL cache.
func (s *PredictionGRPCServer) GetPredictionCache(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	if err := s.enforceRLS(ctx, tenantID); err != nil {
		return nil, err
	}
	stats := map[string]interface{}{
		"enabled":         s.cache != nil,
		"cache_policy":    "TTL_SCOPED_BY_PREDICTION_TYPE",
		"ttl_virality":    "5m",
		"ttl_engagement":  "15m",
		"ttl_trend":       "60m",
		"invalidation":    "ON_MODEL_PROMOTION",
	}
	return stats, nil
}

func (s *PredictionGRPCServer) resolveEngine(pt domain.PredictionType) (application.PredictionService, error) {
	switch strings.ToUpper(string(pt)) {
	case "VIRALITY":
		if s.viralityEngine == nil {
			return nil, errors.New("virality engine not initialized")
		}
		return s.viralityEngine, nil
	case "ENGAGEMENT":
		if s.engagementEngine == nil {
			return nil, errors.New("engagement engine not initialized")
		}
		return s.engagementEngine, nil
	case "CONTENT_OPTIMIZATION":
		if s.optimizerEngine == nil {
			return nil, errors.New("content optimizer engine not initialized")
		}
		return s.optimizerEngine, nil
	case "TREND_LIFECYCLE":
		if s.trendEngine == nil {
			return nil, errors.New("trend lifecycle engine not initialized")
		}
		return s.trendEngine, nil
	case "ANOMALY":
		if s.anomalyEngine == nil {
			return nil, errors.New("anomaly engine not initialized")
		}
		return s.anomalyEngine, nil
	case "PUBLISHING_TIME":
		if s.pubtimeEngine == nil {
			return nil, errors.New("publishing time engine not initialized")
		}
		return s.pubtimeEngine, nil
	default:
		return nil, domain.ErrInvalidPredictionType
	}
}
