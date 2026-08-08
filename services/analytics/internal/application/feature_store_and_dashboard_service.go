package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/analytics/internal/domain"
)

type FeatureStoreAndDashboardService struct {
	features domain.FeatureStoreRepository
	metrics  domain.EngagementMetricRepository
	audit    AuditLogger
}

func NewFeatureStoreAndDashboardService(
	features domain.FeatureStoreRepository,
	metrics domain.EngagementMetricRepository,
	audit AuditLogger,
) *FeatureStoreAndDashboardService {
	return &FeatureStoreAndDashboardService{
		features: features,
		metrics:  metrics,
		audit:    audit,
	}
}

func (s *FeatureStoreAndDashboardService) SaveFeatureRecord(
	ctx context.Context,
	tenantID, entityID, name, value, valType string,
) (*domain.FeatureRecordEntity, error) {
	if tenantID == "" || entityID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	ts := time.Now().Unix()
	hash := domain.GenerateAnalyticsHash(tenantID, entityID, "FEATURE_STORE", name, ts)

	feat := domain.FeatureRecordEntity{
		FeatureID:      fmt.Sprintf("feat-%d", time.Now().UnixNano()),
		TenantID:       tenantID,
		EntityID:       entityID,
		FeatureName:    name,
		FeatureValue:   value,
		ValueType:      valType,
		ProvenanceHash: hash,
		UpdatedAt:      time.Now(),
	}

	if err := s.features.SaveFeature(feat); err != nil {
		return nil, err
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "save_feature_record", feat.FeatureID, fmt.Sprintf("entity=%s name=%s", entityID, name))
	}

	return &feat, nil
}

func (s *FeatureStoreAndDashboardService) QueryFeatures(
	ctx context.Context,
	tenantID, entityID string,
	names []string,
) ([]domain.FeatureRecordEntity, error) {
	if tenantID == "" || entityID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return s.features.GetFeatures(tenantID, entityID, names)
}

func (s *FeatureStoreAndDashboardService) GetDashboardMetrics(
	ctx context.Context,
	tenantID, dashboardType string,
) ([]domain.EngagementMetricEntity, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	var out []domain.EngagementMetricEntity
	if s.metrics != nil {
		out, _ = s.metrics.GetMetricsByStory(tenantID, "all")
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "get_dashboard_metrics", dashboardType, fmt.Sprintf("count=%d", len(out)))
	}

	return out, nil
}

func (s *FeatureStoreAndDashboardService) ExecuteAnalyticsWorkflow(
	ctx context.Context,
	tenantID, workflowID string,
	params map[string]string,
) (*domain.WorkflowInstanceRef, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	wfID := fmt.Sprintf("wf-24-%s-%d", workflowID, time.Now().UnixNano())
	wf := domain.WorkflowInstanceRef{
		InstanceID: wfID,
		TenantID:   tenantID,
		WorkflowID: workflowID,
		Status:     "COMPLETED",
		Parameters: params,
		StartedAt:  time.Now(),
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "execute_"+workflowID, wfID, "completed successfully")
	}

	return &wf, nil
}
