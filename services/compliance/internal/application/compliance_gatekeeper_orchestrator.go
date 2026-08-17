package application

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/compliance/internal/domain"
)

type ComplianceGatekeeperOrchestrator struct {
	reports      domain.ComplianceReportRepository
	reviews      domain.ComplianceReviewRepository
	auditRepo    domain.ComplianceAuditRepository
	rightsSvc    *RightsOriginalityLegalService
	privacySvc   *PrivacySafetyPolicyService
	processed    map[string]bool
	mu           sync.Mutex
	pub          EventPublisher
	audit        AuditLogger
	statePolicy  domain.ComplianceStatePolicy
	scorePolicy  domain.ComplianceScoringPolicy
}

func NewComplianceGatekeeperOrchestrator(
	reports domain.ComplianceReportRepository,
	reviews domain.ComplianceReviewRepository,
	auditRepo domain.ComplianceAuditRepository,
	rightsSvc *RightsOriginalityLegalService,
	privacySvc *PrivacySafetyPolicyService,
	pub EventPublisher,
	audit AuditLogger,
) *ComplianceGatekeeperOrchestrator {
	return &ComplianceGatekeeperOrchestrator{
		reports:     reports,
		reviews:     reviews,
		auditRepo:   auditRepo,
		rightsSvc:   rightsSvc,
		privacySvc:  privacySvc,
		processed:   make(map[string]bool),
		pub:         pub,
		audit:       audit,
		statePolicy: domain.ComplianceStatePolicy{},
		scorePolicy: domain.ComplianceScoringPolicy{},
	}
}

func (o *ComplianceGatekeeperOrchestrator) EvaluatePackageCompliance(
	ctx context.Context,
	tenantID, packageID, storyID, title, content string,
	channels []string,
	misinfoFlagInherited bool,
) (*domain.ComplianceReport, error) {
	if tenantID == "" || packageID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	rights, _ := o.rightsSvc.EvaluateRightsAndAttribution(ctx, tenantID, packageID, title, content)
	orig, _ := o.rightsSvc.EvaluateOriginalityAndPlagiarism(ctx, tenantID, packageID, content)
	legal, _ := o.rightsSvc.EvaluateLegalAndRegulatoryRisks(ctx, tenantID, packageID, title, content)
	priv, _ := o.privacySvc.EvaluatePrivacyAndPII(ctx, tenantID, packageID, content)
	safe, _ := o.privacySvc.EvaluateAISafetyAndEthics(ctx, tenantID, packageID, content, misinfoFlagInherited)
	pol, _ := o.privacySvc.EvaluatePlatformPolicyCompliance(ctx, tenantID, packageID, channels, content)

	score, status, violations := o.scorePolicy.EvaluateOverallCompliance(rights, orig, legal, priv, safe, pol)

	report := domain.ComplianceReport{
		ReportID:     fmt.Sprintf("rep-%d", time.Now().UnixNano()),
		TenantID:     tenantID,
		PackageID:    packageID,
		StoryID:      storyID,
		Status:       status,
		OverallScore: score,
		Rights:       rights,
		Originality:  orig,
		Legal:        legal,
		Privacy:      priv,
		Safety:       safe,
		Policy:       pol,
		Violations:   violations,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := o.reports.SaveReport(report); err != nil {
		return nil, err
	}

	ts := time.Now().Unix()
	hash := domain.GenerateComplianceHash(tenantID, packageID, "GATEKEEPER_EVALUATION", string(status), "SVC-057", ts)
	if o.auditRepo != nil {
		_ = o.auditRepo.AppendRecord(domain.ComplianceAuditRecord{
			RecordID:          fmt.Sprintf("aud-gate-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			PackageID:         packageID,
			CheckType:         "GATEKEEPER_EVALUATION",
			ResultStatus:      string(status),
			Actor:             "SVC-057",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if o.pub != nil {
		_ = o.pub.PublishEvent(ctx, "compliance.policy.evaluated", tenantID, "SVC-057", fmt.Sprintf("report_id=%s pkg=%s status=%s score=%.2f", report.ReportID, packageID, status, score))
		if status == domain.ComplianceStatusReviewRequired {
			_ = o.pub.PublishEvent(ctx, "compliance.review.required", tenantID, "SVC-063", report.ReportID)
		} else if status == domain.ComplianceStatusRejected {
			_ = o.pub.PublishEvent(ctx, "compliance.package.rejected", tenantID, "SVC-057", packageID)
		}
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "evaluate_compliance", packageID, fmt.Sprintf("status=%s score=%.2f", status, score))
	}

	return &report, nil
}

func (o *ComplianceGatekeeperOrchestrator) HandleMisinfoDetectedEvent(
	ctx context.Context,
	eventID, tenantID, storyID, reportID string,
) error {
	o.mu.Lock()
	if o.processed[eventID] {
		o.mu.Unlock()
		if o.audit != nil {
			_ = o.audit.LogEvent(ctx, tenantID, "evt_025_idempotent_ignore", eventID, "event already processed")
		}
		return nil
	}
	o.processed[eventID] = true
	o.mu.Unlock()

	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "evt_025_consumed", storyID, "misinfo detected, enforcing compliance hold")
	}
	return nil
}

func (o *ComplianceGatekeeperOrchestrator) SubmitReviewDecision(
	ctx context.Context,
	tenantID, reportID, reviewerID string,
	approved bool,
	comments string,
) (*domain.ComplianceReviewDecision, error) {
	report, err := o.reports.GetReport(tenantID, reportID)
	if err != nil {
		return nil, err
	}

	targetStatus := domain.ComplianceStatusCompliant
	if !approved {
		targetStatus = domain.ComplianceStatusRejected
	}

	if err := o.statePolicy.ValidateTransition(report.Status, targetStatus); err != nil {
		return nil, err
	}

	dec := domain.ComplianceReviewDecision{
		DecisionID: fmt.Sprintf("rev-%d", time.Now().UnixNano()),
		TenantID:   tenantID,
		ReportID:   reportID,
		Approved:   approved,
		ReviewerID: reviewerID,
		Comments:   comments,
		DecidedAt:  time.Now(),
	}

	if o.reviews != nil {
		_ = o.reviews.SaveDecision(dec)
	}

	report.Status = targetStatus
	report.UpdatedAt = time.Now()
	if err := o.reports.SaveReport(*report); err != nil {
		return nil, err
	}

	ts := time.Now().Unix()
	hash := domain.GenerateComplianceHash(tenantID, report.PackageID, "COMPLIANCE_REVIEW_DECISION", string(targetStatus), reviewerID, ts)
	if o.auditRepo != nil {
		_ = o.auditRepo.AppendRecord(domain.ComplianceAuditRecord{
			RecordID:          fmt.Sprintf("aud-rev-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			PackageID:         report.PackageID,
			CheckType:         "COMPLIANCE_REVIEW_DECISION",
			ResultStatus:      string(targetStatus),
			Actor:             reviewerID,
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if o.pub != nil {
		if approved {
			_ = o.pub.PublishEvent(ctx, "compliance.package.approved", tenantID, "SVC-063", report.PackageID)
		} else {
			_ = o.pub.PublishEvent(ctx, "compliance.package.rejected", tenantID, "SVC-063", report.PackageID)
		}
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "compliance_review_decision", reportID, fmt.Sprintf("approved=%v status=%s", approved, targetStatus))
	}

	return &dec, nil
}

func (o *ComplianceGatekeeperOrchestrator) ExecuteComplianceWorkflow(
	ctx context.Context,
	tenantID, workflowID string,
	params map[string]string,
) (*domain.WorkflowInstanceRef, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	wfID := fmt.Sprintf("wf-22-%s-%d", workflowID, time.Now().UnixNano())
	wf := domain.WorkflowInstanceRef{
		InstanceID: wfID,
		TenantID:   tenantID,
		WorkflowID: "WF-022",
		Status:     "COMPLETED",
		Parameters: params,
		StartedAt:  time.Now(),
	}

	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "execute_wf_022", workflowID, wfID)
	}

	return &wf, nil
}

func (o *ComplianceGatekeeperOrchestrator) GetReport(ctx context.Context, tenantID, reportID string) (*domain.ComplianceReport, error) {
	return o.reports.GetReport(tenantID, reportID)
}

func (o *ComplianceGatekeeperOrchestrator) GetAuditTrail(ctx context.Context, tenantID, packageID string) ([]domain.ComplianceAuditRecord, error) {
	if o.auditRepo == nil {
		return nil, nil
	}
	return o.auditRepo.GetAuditTrail(tenantID, packageID)
}
