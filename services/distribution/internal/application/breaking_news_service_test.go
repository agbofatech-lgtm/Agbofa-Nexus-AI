package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/distribution/internal/application"
	"github.com/agbofa/nexus/services/distribution/internal/domain"
)

type inMemBreakingRepo struct {
	alerts map[string]domain.BreakingNewsAlert
}

func newInMemBreakingRepo() *inMemBreakingRepo {
	return &inMemBreakingRepo{alerts: make(map[string]domain.BreakingNewsAlert)}
}

func (r *inMemBreakingRepo) SaveAlert(a domain.BreakingNewsAlert) error {
	r.alerts[a.TenantID+":"+a.AlertID] = a
	return nil
}

func (r *inMemBreakingRepo) GetAlert(tenantID, alertID string) (*domain.BreakingNewsAlert, error) {
	a, ok := r.alerts[tenantID+":"+alertID]
	if !ok {
		return nil, domain.ErrAlertNotFound
	}
	return &a, nil
}

func TestBreakingNewsService_DeliverAlert(t *testing.T) {
	alerts := newInMemBreakingRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewBreakingNewsService(alerts, pub, audit)

	alert, err := svc.DeliverBreakingNewsAlert(
		context.Background(),
		"tenant-1",
		"pkg-break-1",
		"story-urgent-1",
		"URGENT: Breakthrough announced",
		[]string{"TWITTER", "WEB_PUSH"},
	)
	if err != nil || alert == nil {
		t.Fatalf("expected alert delivered, got err=%v", err)
	}
	if alert.Status != domain.DeliveryStatusDelivered {
		t.Fatalf("expected DELIVERED status, got %s", alert.Status)
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected breaking_news.delivered event emitted")
	}

	_, err = svc.DeliverBreakingNewsAlert(context.Background(), "", "pkg-2", "story-2", "test", nil)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant, got %v", err)
	}
}
