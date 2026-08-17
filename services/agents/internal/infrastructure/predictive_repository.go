package infrastructure

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type PostgresPredictiveRepository struct {
	mu            sync.RWMutex
	dbURL         string
	db            *sql.DB
	viralityStore map[string]*domain.ViralityPrediction
	engageStore   map[string]*domain.EngagementOptimization
	trendStore    map[string]*domain.TrendLifecycleModel
	forecastStore map[string]*domain.ContentPerformanceForecast
	anomalyStore  []domain.AnomalyDetectionEvent
}

func NewPostgresPredictiveRepository(dbURL string) *PostgresPredictiveRepository {
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: invalid DATABASE_URL: %v", err)
			db = nil
		}
	}
	return &PostgresPredictiveRepository{
		dbURL:         dbURL,
		db:            db,
		viralityStore: make(map[string]*domain.ViralityPrediction),
		engageStore:   make(map[string]*domain.EngagementOptimization),
		trendStore:    make(map[string]*domain.TrendLifecycleModel),
		forecastStore: make(map[string]*domain.ContentPerformanceForecast),
		anomalyStore:  make([]domain.AnomalyDetectionEvent, 0),
	}
}

func (r *PostgresPredictiveRepository) key(tenantID, id string) string {
	return fmt.Sprintf("%s:%s", tenantID, id)
}

func (r *PostgresPredictiveRepository) SaveViralityPrediction(ctx context.Context, tenantID string, pred *domain.ViralityPrediction) error {
	if pred == nil || tenantID == "" || pred.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	r.mu.Lock()
	r.viralityStore[r.key(tenantID, pred.PredictionID)] = pred
	r.mu.Unlock()

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		metaBytes, _ := json.Marshal(pred.Metadata)
		query := `
		INSERT INTO virality_predictions (prediction_id, tenant_id, story_id, virality_score, confidence_interval, peak_time_estimate, predicted_reach, metadata, predicted_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
		ON CONFLICT (prediction_id, tenant_id)
		DO UPDATE SET virality_score = $4, confidence_interval = $5, peak_time_estimate = $6, predicted_reach = $7, metadata = $8
		`
		_, err := r.db.ExecContext(reqCtx, query, pred.PredictionID, tenantID, pred.StoryID, pred.ViralityScore, pred.ConfidenceInterval, pred.PeakTimeEstimate, pred.PredictedReach, metaBytes, pred.PredictedAt)
		if err != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: SaveViralityPrediction SQL failed: %v", err)
		}
	}
	return nil
}

func (r *PostgresPredictiveRepository) SaveEngagementOptimization(ctx context.Context, tenantID string, opt *domain.EngagementOptimization) error {
	if opt == nil || tenantID == "" || opt.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	r.mu.Lock()
	r.engageStore[r.key(tenantID, opt.OptimizationID)] = opt
	r.mu.Unlock()

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		timesBytes, _ := json.Marshal(opt.OptimalTimes)
		platformsBytes, _ := json.Marshal(opt.TargetPlatforms)
		metaBytes, _ := json.Marshal(opt.Metadata)
		query := `
		INSERT INTO engagement_optimizations (optimization_id, tenant_id, content_id, optimal_times, target_platforms, framing_advice, metadata, optimized_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
		ON CONFLICT (optimization_id, tenant_id)
		DO UPDATE SET optimal_times = $4, target_platforms = $5, framing_advice = $6, metadata = $7
		`
		_, err := r.db.ExecContext(reqCtx, query, opt.OptimizationID, tenantID, opt.ContentID, timesBytes, platformsBytes, opt.FramingAdvice, metaBytes, opt.OptimizedAt)
		if err != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: SaveEngagementOptimization SQL failed: %v", err)
		}
	}
	return nil
}

func (r *PostgresPredictiveRepository) SaveTrendLifecycleModel(ctx context.Context, tenantID string, model *domain.TrendLifecycleModel) error {
	if model == nil || tenantID == "" || model.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	r.mu.Lock()
	r.trendStore[r.key(tenantID, model.ModelID)] = model
	r.mu.Unlock()

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		metaBytes, _ := json.Marshal(model.Metadata)
		query := `
		INSERT INTO trend_lifecycle_models (model_id, tenant_id, topic_id, current_phase, velocity, decay_rate, resurgence_prob, metadata, modeled_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
		ON CONFLICT (model_id, tenant_id)
		DO UPDATE SET current_phase = $4, velocity = $5, decay_rate = $6, resurgence_prob = $7, metadata = $8
		`
		_, err := r.db.ExecContext(reqCtx, query, model.ModelID, tenantID, model.TopicID, string(model.CurrentPhase), model.Velocity, model.DecayRate, model.ResurgenceProb, metaBytes, model.ModeledAt)
		if err != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: SaveTrendLifecycleModel SQL failed: %v", err)
		}
	}
	return nil
}

func (r *PostgresPredictiveRepository) SaveContentPerformanceForecast(ctx context.Context, tenantID string, f *domain.ContentPerformanceForecast) error {
	if f == nil || tenantID == "" || f.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	r.mu.Lock()
	r.forecastStore[r.key(tenantID, f.ForecastID)] = f
	r.mu.Unlock()

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		metaBytes, _ := json.Marshal(f.Metadata)
		query := `
		INSERT INTO content_performance_forecasts (forecast_id, tenant_id, content_id, predicted_views, predicted_shares, engagement_rate, confidence_metric, metadata, forecasted_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
		ON CONFLICT (forecast_id, tenant_id)
		DO UPDATE SET predicted_views = $4, predicted_shares = $5, engagement_rate = $6, confidence_metric = $7, metadata = $8
		`
		_, err := r.db.ExecContext(reqCtx, query, f.ForecastID, tenantID, f.ContentID, f.PredictedViews, f.PredictedShares, f.EngagementRate, f.ConfidenceMetric, metaBytes, f.ForecastedAt)
		if err != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: SaveContentPerformanceForecast SQL failed: %v", err)
		}
	}
	return nil
}

func (r *PostgresPredictiveRepository) SaveAnomalyDetectionEvent(ctx context.Context, tenantID string, a *domain.AnomalyDetectionEvent) error {
	if a == nil || tenantID == "" || a.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	r.mu.Lock()
	r.anomalyStore = append(r.anomalyStore, *a)
	r.mu.Unlock()

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		metaBytes, _ := json.Marshal(a.Metadata)
		query := `
		INSERT INTO anomaly_detection_events (anomaly_id, tenant_id, platform, anomaly_type, severity_score, description, metadata, detected_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
		ON CONFLICT (anomaly_id, tenant_id)
		DO UPDATE SET severity_score = $5, description = $6, metadata = $7
		`
		_, err := r.db.ExecContext(reqCtx, query, a.AnomalyID, tenantID, string(a.Platform), a.AnomalyType, a.SeverityScore, a.Description, metaBytes, a.DetectedAt)
		if err != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: SaveAnomalyDetectionEvent SQL failed: %v", err)
		}
	}
	return nil
}

func (r *PostgresPredictiveRepository) GetViralityPrediction(ctx context.Context, tenantID, predictionID string) (*domain.ViralityPrediction, error) {
	if tenantID == "" || predictionID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		query := `SELECT story_id, virality_score, confidence_interval, peak_time_estimate, predicted_reach, predicted_at FROM virality_predictions WHERE prediction_id = $1 AND tenant_id = $2`
		var storyID string
		var virScore, confInt float64
		var peakTime, predAt time.Time
		var reach int64
		err := r.db.QueryRowContext(reqCtx, query, predictionID, tenantID).Scan(&storyID, &virScore, &confInt, &peakTime, &reach, &predAt)
		if err == nil {
			return &domain.ViralityPrediction{
				PredictionID:       predictionID,
				TenantID:           tenantID,
				StoryID:            storyID,
				ViralityScore:      virScore,
				ConfidenceInterval: confInt,
				PeakTimeEstimate:   peakTime,
				PredictedReach:     reach,
				PredictedAt:        predAt,
			}, nil
		}
	}

	r.mu.RLock()
	pred, found := r.viralityStore[r.key(tenantID, predictionID)]
	r.mu.RUnlock()
	if found && pred != nil {
		return pred, nil
	}

	return nil, fmt.Errorf("virality prediction %s not found on tenant %s", predictionID, tenantID)
}

func (r *PostgresPredictiveRepository) ListAnomalyEvents(ctx context.Context, tenantID string, limit int) ([]domain.AnomalyDetectionEvent, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if limit <= 0 {
		limit = 100
	}

	if r.db != nil {
		reqCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
		defer cancel()
		_, errTenant := r.db.ExecContext(reqCtx, "SET LOCAL app.current_tenant = $1", tenantID)
		if errTenant != nil {
			log.Printf("WARN [PostgresPredictiveRepository]: failed to set app.current_tenant: %v", errTenant)
		}
		query := `SELECT anomaly_id, platform, anomaly_type, severity_score, description, detected_at FROM anomaly_detection_events WHERE tenant_id = $1 ORDER BY detected_at DESC LIMIT $2`
		rows, err := r.db.QueryContext(reqCtx, query, tenantID, limit)
		if err == nil {
			defer rows.Close()
			res := make([]domain.AnomalyDetectionEvent, 0)
			for rows.Next() {
				var a domain.AnomalyDetectionEvent
				var platformStr string
				if err := rows.Scan(&a.AnomalyID, &platformStr, &a.AnomalyType, &a.SeverityScore, &a.Description, &a.DetectedAt); err == nil {
					a.TenantID = tenantID
					a.Platform = domain.PlatformSource(platformStr)
					res = append(res, a)
				}
			}
			return res, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	res := make([]domain.AnomalyDetectionEvent, 0, limit)
	for _, a := range r.anomalyStore {
		if a.TenantID == tenantID {
			res = append(res, a)
			if len(res) >= limit {
				break
			}
		}
	}
	return res, nil
}
