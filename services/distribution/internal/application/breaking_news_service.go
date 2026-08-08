package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/distribution/internal/domain"
)

type BreakingNewsService struct {
	alerts domain.BreakingNewsRepository
	pub    EventPublisher
	audit  AuditLogger
}

func NewBreakingNewsService(
	alerts domain.BreakingNewsRepository,
	pub EventPublisher,
	audit AuditLogger,
) *BreakingNewsService {
	return &BreakingNewsService{
		alerts: alerts,
		pub:    pub,
		audit:  audit,
	}
}

func (s *BreakingNewsService) DeliverBreakingNewsAlert(
	ctx context.Context,
	tenantID, packageID, storyID, alertText string,
	priorityChannels []string,
) (*domain.BreakingNewsAlert, error) {
	if tenantID == "" || alertText == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	alert := domain.BreakingNewsAlert{
		AlertID:          fmt.Sprintf("alert-%d", time.Now().UnixNano()),
		TenantID:         tenantID,
		PackageID:        packageID,
		StoryID:          storyID,
		AlertText:        alertText,
		PriorityChannels: priorityChannels,
		Status:           domain.DeliveryStatusDelivered,
		DeliveredAt:      time.Now(),
	}

	if err := s.alerts.SaveAlert(alert); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "distribution.breaking_news.delivered", tenantID, "SVC-069", fmt.Sprintf("alert=%s story=%s channels=%d", alert.AlertID, storyID, len(priorityChannels)))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "deliver_breaking_news", alert.AlertID, fmt.Sprintf("story=%s channels=%v", storyID, priorityChannels))
	}

	return &alert, nil
}

func (s *BreakingNewsService) GetAlert(ctx context.Context, tenantID, alertID string) (*domain.BreakingNewsAlert, error) {
	return s.alerts.GetAlert(tenantID, alertID)
}
