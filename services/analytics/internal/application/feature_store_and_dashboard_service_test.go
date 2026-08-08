package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/analytics/internal/application"
	"github.com/agbofa/nexus/services/analytics/internal/domain"
)

type inMemFeatureRepo struct {
	features map[string]domain.FeatureRecordEntity
}

func newInMemFeatureRepo() *inMemFeatureRepo {
	return &inMemFeatureRepo{features: make(map[string]domain.FeatureRecordEntity)}
}

func (r *inMemFeatureRepo) SaveFeature(f domain.FeatureRecordEntity) error {
	r.features[f.TenantID+":"+f.EntityID+":"+f.FeatureName] = f
	return nil
}

func (r *inMemFeatureRepo) GetFeatures(tenantID, entityID string, names []string) ([]domain.FeatureRecordEntity, error) {
	var out []domain.FeatureRecordEntity
	for _, name := range names {
		f, ok := r.features[tenantID+":"+entityID+":"+name]
		if ok {
			out = append(out, f)
		}
	}
	return out, nil
}

func TestFeatureStoreAndDashboardService_Flow(t *testing.T) {
	features := newInMemFeatureRepo()
	metrics := newInMemMetricRepo()
	audit := &mockAudit{}

	svc := application.NewFeatureStoreAndDashboardService(features, metrics, audit)

	feat, err := svc.SaveFeatureRecord(
		context.Background(),
		"tenant-1",
		"entity-100",
		"engagement_velocity",
		"0.85",
		"FLOAT",
	)
	if err != nil || feat == nil {
		t.Fatalf("expected feature saved, got err=%v", err)
	}

	found, err := svc.QueryFeatures(context.Background(), "tenant-1", "entity-100", []string{"engagement_velocity"})
	if err != nil || len(found) != 1 {
		t.Fatalf("expected 1 feature found, got len=%d err=%v", len(found), err)
	}

	wf, err := svc.ExecuteAnalyticsWorkflow(context.Background(), "tenant-1", "WF-024", nil)
	if err != nil || wf == nil {
		t.Fatalf("expected WF-024 executed, got err=%v", err)
	}

	_, err = svc.QueryFeatures(context.Background(), "", "entity-100", nil)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant, got %v", err)
	}
}
