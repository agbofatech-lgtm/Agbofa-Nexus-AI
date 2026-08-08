package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/analytics/internal/domain"
)

type EventPublisher interface {
	PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error
}

type AuditLogger interface {
	LogEvent(ctx context.Context, tenantID, action, resource, details string) error
}

type AnalyticsCollectionAndProcessingService struct {
	events  domain.AnalyticsEventRepository
	metrics domain.EngagementMetricRepository
	pub     EventPublisher
	audit   AuditLogger
}

func NewAnalyticsCollectionAndProcessingService(
	events domain.AnalyticsEventRepository,
	metrics domain.EngagementMetricRepository,
	pub EventPublisher,
	audit AuditLogger,
) *AnalyticsCollectionAndProcessingService {
	return &AnalyticsCollectionAndProcessingService{
		events:  events,
		metrics: metrics,
		pub:     pub,
		audit:   audit,
	}
}

func (s *AnalyticsCollectionAndProcessingService) CollectAnalyticsEvent(
	ctx context.Context,
	tenantID, eventType, storyID, channelID, cohortID string,
	category domain.SignalCategory,
	properties map[string]string,
) (*domain.AnalyticsEventEntity, error) {
	if tenantID == "" || eventType == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	ts := time.Now().Unix()
	hash := domain.GenerateAnalyticsHash(tenantID, storyID, string(category), eventType, ts)

	event := domain.AnalyticsEventEntity{
		EventID:        fmt.Sprintf("evt-an-%d", time.Now().UnixNano()),
		TenantID:       tenantID,
		EventType:      eventType,
		StoryID:        storyID,
		ChannelID:      channelID,
		CohortID:       cohortID,
		Category:       category,
		Properties:     properties,
		ProvenanceHash: hash,
		OccurredAt:     time.Now(),
	}

	if err := s.events.SaveEvent(event); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "analytics.events", tenantID, "SVC-075", fmt.Sprintf("evt=%s story=%s cat=%s", event.EventID, storyID, category))
		_ = s.pub.PublishEvent(ctx, "analytics.collection", tenantID, "SVC-134", event.EventID)
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "collect_analytics_event", event.EventID, fmt.Sprintf("type=%s cat=%s", eventType, category))
	}

	return &event, nil
}

func (s *AnalyticsCollectionAndProcessingService) CalculateEngagementMetric(
	ctx context.Context,
	tenantID, storyID, metricName string,
	value float64,
	calcSource string,
) (*domain.EngagementMetricEntity, error) {
	if tenantID == "" || storyID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	ts := time.Now().Unix()
	hash := domain.GenerateAnalyticsHash(tenantID, storyID, string(domain.SignalCategoryDerivedMetrics), metricName, ts)

	metric := domain.EngagementMetricEntity{
		StoryID:           storyID,
		TenantID:          tenantID,
		MetricName:        metricName,
		Value:             value,
		CalculationSource: calcSource,
		ProvenanceHash:    hash,
		UpdatedAt:         time.Now(),
	}

	if err := s.metrics.SaveMetric(metric); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "analytics.normalized", tenantID, "SVC-076", fmt.Sprintf("story=%s metric=%s value=%.2f", storyID, metricName, value))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "calculate_engagement_metric", storyID, fmt.Sprintf("metric=%s value=%.2f", metricName, value))
	}

	return &metric, nil
}

func (s *AnalyticsCollectionAndProcessingService) GetMetricsByStory(
	ctx context.Context,
	tenantID, storyID string,
) ([]domain.EngagementMetricEntity, error) {
	if tenantID == "" || storyID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	return s.metrics.GetMetricsByStory(tenantID, storyID)
}
