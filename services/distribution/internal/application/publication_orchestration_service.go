package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/distribution/internal/domain"
)

type EventPublisher interface {
	PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error
}

type AuditLogger interface {
	LogEvent(ctx context.Context, tenantID, action, resource, details string) error
}

type PublicationOrchestrationService struct {
	jobs       domain.PublicationJobRepository
	auditRepo  domain.DeliveryAuditRepository
	aiProvider llm.Provider
	pub        EventPublisher
	audit      AuditLogger
	policy     domain.DeliveryStatePolicy
	compPolicy domain.ComplianceBoundaryPolicy
}

func NewPublicationOrchestrationService(
	jobs domain.PublicationJobRepository,
	auditRepo domain.DeliveryAuditRepository,
	aiProvider llm.Provider,
	pub EventPublisher,
	audit AuditLogger,
) *PublicationOrchestrationService {
	return &PublicationOrchestrationService{
		jobs:       jobs,
		auditRepo:  auditRepo,
		aiProvider: aiProvider,
		pub:        pub,
		audit:      audit,
		policy:     domain.DeliveryStatePolicy{},
		compPolicy: domain.ComplianceBoundaryPolicy{},
	}
}

func (s *PublicationOrchestrationService) SchedulePublication(
	ctx context.Context,
	tenantID, packageID, storyID, title, complianceStatus string,
	channels []string,
	scheduledUnix int64,
) (*domain.PublicationJob, error) {
	if tenantID == "" || packageID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	if err := s.compPolicy.ValidatePackageForDistribution(packageID, complianceStatus); err != nil {
		if s.audit != nil {
			_ = s.audit.LogEvent(ctx, tenantID, "schedule_publication_rejected", packageID, err.Error())
		}
		return nil, err
	}

	var chStatuses []domain.ChannelStatus
	for _, ch := range channels {
		chStatuses = append(chStatuses, domain.ChannelStatus{
			ChannelID: fmt.Sprintf("ch-%s-%d", ch, time.Now().UnixNano()),
			Platform:  ch,
			Status:    domain.DeliveryStatusScheduled,
		})
	}

	schedTime := time.Unix(scheduledUnix, 0)
	if scheduledUnix == 0 {
		schedTime = time.Now()
	}

	job := domain.PublicationJob{
		PublicationJobID: fmt.Sprintf("pub-%d", time.Now().UnixNano()),
		TenantID:         tenantID,
		PackageID:        packageID,
		StoryID:          storyID,
		Title:            title,
		ComplianceStatus: complianceStatus,
		Status:           domain.DeliveryStatusScheduled,
		ChannelStatuses:  chStatuses,
		RetryCount:       0,
		ScheduledTime:    schedTime,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.jobs.SaveJob(job); err != nil {
		return nil, err
	}

	ts := time.Now().Unix()
	hash := domain.GenerateDeliveryHash(tenantID, job.PublicationJobID, "all", "SCHEDULED", "SVC-065", ts)
	if s.auditRepo != nil {
		_ = s.auditRepo.AppendRecord(domain.DeliveryAuditRecord{
			RecordID:          fmt.Sprintf("aud-pub-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			PublicationJobID:  job.PublicationJobID,
			Channel:           "all",
			EventType:         "SCHEDULED",
			Actor:             "SVC-065",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "distribution.publishing.submitted", tenantID, "SVC-065", fmt.Sprintf("job=%s pkg=%s status=%s", job.PublicationJobID, packageID, complianceStatus))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "schedule_publication", job.PublicationJobID, "status=SCHEDULED")
	}

	return &job, nil
}

func (s *PublicationOrchestrationService) DeliverJob(
	ctx context.Context,
	tenantID, jobID string,
) (*domain.PublicationJob, error) {
	job, err := s.jobs.GetJob(tenantID, jobID)
	if err != nil {
		return nil, err
	}

	if err := s.policy.ValidateTransition(job.Status, domain.DeliveryStatusDelivering); err != nil {
		return nil, err
	}
	job.Status = domain.DeliveryStatusDelivering
	job.UpdatedAt = time.Now()
	_ = s.jobs.SaveJob(*job)

	allSuccess := true
	for i := range job.ChannelStatuses {
		job.ChannelStatuses[i].Status = domain.DeliveryStatusDelivered
		job.ChannelStatuses[i].PlatformPostID = fmt.Sprintf("post-%d-%d", time.Now().UnixNano(), i)
		job.ChannelStatuses[i].DeliveredAt = time.Now()
	}

	if allSuccess {
		job.Status = domain.DeliveryStatusDelivered
		job.PublishedAt = time.Now()
	} else {
		job.Status = domain.DeliveryStatusFailed
	}
	job.UpdatedAt = time.Now()

	if err := s.jobs.SaveJob(*job); err != nil {
		return nil, err
	}

	ts := time.Now().Unix()
	hash := domain.GenerateDeliveryHash(tenantID, job.PublicationJobID, "all", string(job.Status), "SVC-066", ts)
	if s.auditRepo != nil {
		_ = s.auditRepo.AppendRecord(domain.DeliveryAuditRecord{
			RecordID:          fmt.Sprintf("aud-del-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			PublicationJobID:  job.PublicationJobID,
			Channel:           "all",
			EventType:         string(job.Status),
			Actor:             "SVC-066",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "distribution.publishing.validated", tenantID, "SVC-074", job.PublicationJobID)
		if job.Status == domain.DeliveryStatusDelivered {
			_ = s.pub.PublishEvent(ctx, "distribution.publishing.success", tenantID, "SVC-067", job.PublicationJobID)
		} else {
			_ = s.pub.PublishEvent(ctx, "distribution.publishing.failed", tenantID, "SVC-067", job.PublicationJobID)
		}
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "deliver_publication_job", job.PublicationJobID, "status="+string(job.Status))
	}

	return job, nil
}

func (s *PublicationOrchestrationService) GetJob(ctx context.Context, tenantID, jobID string) (*domain.PublicationJob, error) {
	return s.jobs.GetJob(tenantID, jobID)
}
