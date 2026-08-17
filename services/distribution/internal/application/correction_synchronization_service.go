package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/distribution/internal/domain"
)

type CorrectionSynchronizationService struct {
	jobs      domain.PublicationJobRepository
	corrRepo  domain.CorrectionRetractionRepository
	auditRepo domain.DeliveryAuditRepository
	pub       EventPublisher
	audit     AuditLogger
	policy    domain.DeliveryStatePolicy
}

func NewCorrectionSynchronizationService(
	jobs domain.PublicationJobRepository,
	corrRepo domain.CorrectionRetractionRepository,
	auditRepo domain.DeliveryAuditRepository,
	pub EventPublisher,
	audit AuditLogger,
) *CorrectionSynchronizationService {
	return &CorrectionSynchronizationService{
		jobs:      jobs,
		corrRepo:  corrRepo,
		auditRepo: auditRepo,
		pub:       pub,
		audit:     audit,
		policy:    domain.DeliveryStatePolicy{},
	}
}

func (s *CorrectionSynchronizationService) SynchronizeChannels(
	ctx context.Context,
	tenantID, jobID string,
) (bool, error) {
	job, err := s.jobs.GetJob(tenantID, jobID)
	if err != nil {
		return false, err
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "sync_channels", jobID, fmt.Sprintf("channels=%d status=%s", len(job.ChannelStatuses), job.Status))
	}
	return true, nil
}

func (s *CorrectionSynchronizationService) IssueCorrection(
	ctx context.Context,
	tenantID, jobID, correctedContent, note string,
) (*domain.CorrectionRecord, error) {
	job, err := s.jobs.GetJob(tenantID, jobID)
	if err != nil {
		return nil, err
	}

	if err := s.policy.ValidateTransition(job.Status, domain.DeliveryStatusCorrected); err != nil {
		return nil, err
	}

	corr := domain.CorrectionRecord{
		CorrectionID:     fmt.Sprintf("corr-%d", time.Now().UnixNano()),
		TenantID:         tenantID,
		PublicationJobID: jobID,
		CorrectedContent: correctedContent,
		CorrectionNote:   note,
		IssuedAt:         time.Now(),
	}

	if s.corrRepo != nil {
		_ = s.corrRepo.SaveCorrection(corr)
	}

	job.Status = domain.DeliveryStatusCorrected
	job.UpdatedAt = time.Now()
	_ = s.jobs.SaveJob(*job)

	ts := time.Now().Unix()
	hash := domain.GenerateDeliveryHash(tenantID, jobID, "all", "CORRECTED", "SVC-071", ts)
	if s.auditRepo != nil {
		_ = s.auditRepo.AppendRecord(domain.DeliveryAuditRecord{
			RecordID:          fmt.Sprintf("aud-corr-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			PublicationJobID:  jobID,
			Channel:           "all",
			EventType:         "CORRECTED",
			Actor:             "SVC-071",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "distribution.correction.issued", tenantID, "SVC-071", fmt.Sprintf("corr=%s job=%s", corr.CorrectionID, jobID))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "issue_correction", jobID, note)
	}

	return &corr, nil
}

func (s *CorrectionSynchronizationService) IssueRetraction(
	ctx context.Context,
	tenantID, jobID, reason string,
) (*domain.RetractionRecord, error) {
	job, err := s.jobs.GetJob(tenantID, jobID)
	if err != nil {
		return nil, err
	}

	if err := s.policy.ValidateTransition(job.Status, domain.DeliveryStatusRetracted); err != nil {
		return nil, err
	}

	ret := domain.RetractionRecord{
		RetractionID:     fmt.Sprintf("ret-%d", time.Now().UnixNano()),
		TenantID:         tenantID,
		PublicationJobID: jobID,
		RetractionReason: reason,
		IssuedAt:         time.Now(),
	}

	if s.corrRepo != nil {
		_ = s.corrRepo.SaveRetraction(ret)
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "distribution.retraction.started", tenantID, "SVC-071", jobID)
	}

	job.Status = domain.DeliveryStatusRetracted
	job.UpdatedAt = time.Now()
	_ = s.jobs.SaveJob(*job)

	ts := time.Now().Unix()
	hash := domain.GenerateDeliveryHash(tenantID, jobID, "all", "RETRACTED", "SVC-071", ts)
	if s.auditRepo != nil {
		_ = s.auditRepo.AppendRecord(domain.DeliveryAuditRecord{
			RecordID:          fmt.Sprintf("aud-ret-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			PublicationJobID:  jobID,
			Channel:           "all",
			EventType:         "RETRACTED",
			Actor:             "SVC-071",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "distribution.retraction.completed", tenantID, "SVC-071", fmt.Sprintf("ret=%s job=%s", ret.RetractionID, jobID))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "issue_retraction", jobID, reason)
	}

	return &ret, nil
}
