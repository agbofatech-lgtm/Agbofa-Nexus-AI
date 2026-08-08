package application_test

import (
	"context"
	"testing"

	"github.com/agbofa/nexus/services/distribution/internal/application"
)

func TestDistributionOrchestrator_EVT024Idempotency(t *testing.T) {
	jobs := newInMemJobRepo()
	auditRepo := newInMemDeliveryAuditRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	pubSvc := application.NewPublicationOrchestrationService(jobs, auditRepo, nil, pub, audit)
	orch := application.NewDistributionOrchestrator(pubSvc, nil, nil, auditRepo, pub, audit)

	job1, err := orch.HandlePackageApprovedEvent(
		context.Background(),
		"evt-024-500",
		"tenant-1",
		"pkg-approved-1",
		"story-500",
		"Approved Article",
		[]string{"TWITTER", "LINKEDIN"},
	)
	if err != nil || job1 == nil {
		t.Fatalf("expected job scheduled from approved package, got err=%v", err)
	}

	job2, err := orch.HandlePackageApprovedEvent(
		context.Background(),
		"evt-024-500",
		"tenant-1",
		"pkg-approved-1",
		"story-500",
		"Approved Article",
		[]string{"TWITTER", "LINKEDIN"},
	)
	if err != nil || job2 != nil {
		t.Fatalf("expected nil return on idempotent duplicate event, got %v err=%v", job2, err)
	}
}

func TestDistributionOrchestrator_QueueHealth(t *testing.T) {
	orch := application.NewDistributionOrchestrator(nil, nil, nil, nil, nil, nil)

	health, err := orch.CheckQueueHealth(context.Background(), "tenant-1", "queue-pub-1")
	if err != nil || !health.Healthy {
		t.Fatalf("expected healthy queue, got err=%v health=%v", err, health)
	}
}
