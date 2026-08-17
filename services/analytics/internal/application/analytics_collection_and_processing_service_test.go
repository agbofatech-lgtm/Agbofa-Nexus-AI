package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/analytics/internal/application"
	"github.com/agbofa/nexus/services/analytics/internal/domain"
)

type inMemEventRepo struct {
	events map[string]domain.AnalyticsEventEntity
}

func newInMemEventRepo() *inMemEventRepo {
	return &inMemEventRepo{events: make(map[string]domain.AnalyticsEventEntity)}
}

func (r *inMemEventRepo) SaveEvent(e domain.AnalyticsEventEntity) error {
	r.events[e.TenantID+":"+e.EventID] = e
	return nil
}

func (r *inMemEventRepo) GetEvent(tenantID, eventID string) (*domain.AnalyticsEventEntity, error) {
	e, ok := r.events[tenantID+":"+eventID]
	if !ok {
		return nil, domain.ErrEventNotFound
	}
	return &e, nil
}

func (r *inMemEventRepo) ListEvents(tenantID, eventType string, from, to time.Time) ([]domain.AnalyticsEventEntity, error) {
	var out []domain.AnalyticsEventEntity
	for _, e := range r.events {
		if e.TenantID == tenantID && (eventType == "" || e.EventType == eventType) {
			out = append(out, e)
		}
	}
	return out, nil
}

type inMemMetricRepo struct {
	metrics []domain.EngagementMetricEntity
}

func newInMemMetricRepo() *inMemMetricRepo {
	return &inMemMetricRepo{}
}

func (r *inMemMetricRepo) SaveMetric(m domain.EngagementMetricEntity) error {
	r.metrics = append(r.metrics, m)
	return nil
}

func (r *inMemMetricRepo) GetMetricsByStory(tenantID, storyID string) ([]domain.EngagementMetricEntity, error) {
	var out []domain.EngagementMetricEntity
	for _, m := range r.metrics {
		if m.TenantID == tenantID && m.StoryID == storyID {
			out = append(out, m)
		}
	}
	return out, nil
}

type mockPublisher struct {
	events []string
}

func (m *mockPublisher) PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error {
	m.events = append(m.events, eventType+":"+payload)
	return nil
}

type mockAudit struct {
	logs []string
}

func (m *mockAudit) LogEvent(ctx context.Context, tenantID, action, resource, details string) error {
	m.logs = append(m.logs, action+":"+resource)
	return nil
}

func TestAnalyticsCollectionAndProcessingService_Flow(t *testing.T) {
	events := newInMemEventRepo()
	metrics := newInMemMetricRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewAnalyticsCollectionAndProcessingService(events, metrics, pub, audit)

	evt, err := svc.CollectAnalyticsEvent(
		context.Background(),
		"tenant-1",
		"PAGE_VIEW",
		"story-500",
		"CH_WEB",
		"cohort-tech-readers",
		domain.SignalCategoryObservedData,
		map[string]string{"referrer": "news.local"},
	)
	if err != nil || evt == nil {
		t.Fatalf("expected event collected, got err=%v", err)
	}
	if evt.Category != domain.SignalCategoryObservedData {
		t.Fatalf("expected OBSERVED_DATA, got %s", evt.Category)
	}

	metric, err := svc.CalculateEngagementMetric(
		context.Background(),
		"tenant-1",
		"story-500",
		"TOTAL_VIEWS",
		1024.0,
		"clickhouse-hourly-agg",
	)
	if err != nil || metric == nil {
		t.Fatalf("expected metric calculated, got err=%v", err)
	}
	if len(pub.events) < 3 {
		t.Fatalf("expected events emitted, got %d", len(pub.events))
	}

	_, err = svc.CollectAnalyticsEvent(context.Background(), "", "PAGE_VIEW", "story-1", "ch", "cohort", domain.SignalCategoryObservedData, nil)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for missing tenant, got %v", err)
	}
}
