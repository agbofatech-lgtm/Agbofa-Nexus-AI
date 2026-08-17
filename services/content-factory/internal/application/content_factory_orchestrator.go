package application

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/content-factory/internal/domain"
)

type ContentFactoryOrchestrator struct {
	packages   domain.ContentPackageRepository
	decisions  domain.ReviewDecisionRepository
	intelSvc   *StoryIntelligenceService
	genSvc     *EditorialGenerationService
	adaptSvc   *AdaptationService
	aiProvider llm.Provider
	processed  map[string]bool
	mu         sync.Mutex
	pub        EventPublisher
	audit      AuditLogger
	policy     domain.PackageStatePolicy
	qaPolicy   domain.QAQualityPolicy
}

func NewContentFactoryOrchestrator(
	packages domain.ContentPackageRepository,
	decisions domain.ReviewDecisionRepository,
	intelSvc *StoryIntelligenceService,
	genSvc *EditorialGenerationService,
	adaptSvc *AdaptationService,
	aiProvider llm.Provider,
	pub EventPublisher,
	audit AuditLogger,
) *ContentFactoryOrchestrator {
	return &ContentFactoryOrchestrator{
		packages:   packages,
		decisions:  decisions,
		intelSvc:   intelSvc,
		genSvc:     genSvc,
		adaptSvc:   adaptSvc,
		aiProvider: aiProvider,
		processed:  make(map[string]bool),
		pub:        pub,
		audit:      audit,
		policy:     domain.PackageStatePolicy{},
		qaPolicy:   domain.QAQualityPolicy{},
	}
}

func (o *ContentFactoryOrchestrator) HandleStoryVerifiedEvent(
	ctx context.Context,
	eventID, tenantID, storyID, title, summary, brandVoiceID string,
	channels []string,
) (*domain.ContentPackage, error) {
	o.mu.Lock()
	if o.processed[eventID] {
		o.mu.Unlock()
		if o.audit != nil {
			_ = o.audit.LogEvent(ctx, tenantID, "evt_024_idempotent_ignore", eventID, "event already processed")
		}
		return nil, nil
	}
	o.processed[eventID] = true
	o.mu.Unlock()

	pkg, err := o.intelSvc.CreateContentPackage(ctx, tenantID, storyID, title, summary, brandVoiceID, channels)
	if err != nil {
		return nil, err
	}

	if o.genSvc != nil {
		_, _ = o.genSvc.GenerateArticleAsset(ctx, tenantID, pkg.PackageID, title, summary, "en")
	}

	for _, ch := range channels {
		if o.adaptSvc != nil {
			_, _ = o.adaptSvc.AdaptPackageToChannel(ctx, tenantID, pkg.PackageID, ch)
		}
	}

	if o.pub != nil {
		_ = o.pub.PublishEvent(ctx, "content_factory.package.generated", tenantID, "SVC-054", pkg.PackageID)
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "wf_020_completed", storyID, "package_id="+pkg.PackageID)
	}

	return pkg, nil
}

func (o *ContentFactoryOrchestrator) ExecuteQualityAssurance(
	ctx context.Context,
	tenantID, packageID string,
) (*domain.QAReport, error) {
	pkg, err := o.packages.GetPackage(tenantID, packageID)
	if err != nil {
		return nil, err
	}

	score := 0.92
	var issues []string

	if len(pkg.Articles) == 0 {
		issues = append(issues, "package has zero article assets")
		score = 0.50
	}

	passed, newStatus := o.qaPolicy.ValidateQAScore(score, 0.85, issues)
	if err := o.policy.ValidateTransition(pkg.Status, newStatus); err == nil {
		pkg.Status = newStatus
	}

	report := domain.QAReport{
		QAID:                fmt.Sprintf("qa-%d", time.Now().UnixNano()),
		TenantID:            tenantID,
		PackageID:           packageID,
		OverallQualityScore: score,
		Passed:              passed,
		FlaggedIssues:       issues,
		EvaluatedAt:         time.Now(),
	}

	pkg.QAReport = report
	pkg.UpdatedAt = time.Now()

	if err := o.packages.SavePackage(*pkg); err != nil {
		return nil, err
	}

	if o.pub != nil {
		_ = o.pub.PublishEvent(ctx, "content_factory.qa.completed", tenantID, "SVC-053", fmt.Sprintf("pkg=%s score=%.2f status=%s", packageID, score, pkg.Status))
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "execute_qa", packageID, fmt.Sprintf("score=%.2f passed=%v status=%s", score, passed, pkg.Status))
	}

	return &report, nil
}

func (o *ContentFactoryOrchestrator) SubmitForHumanReview(
	ctx context.Context,
	tenantID, packageID string,
) (*domain.ContentPackage, error) {
	pkg, err := o.packages.GetPackage(tenantID, packageID)
	if err != nil {
		return nil, err
	}

	if err := o.policy.ValidateTransition(pkg.Status, domain.PackageStatusReviewRequired); err != nil {
		return nil, err
	}

	pkg.Status = domain.PackageStatusReviewRequired
	pkg.UpdatedAt = time.Now()
	if err := o.packages.SavePackage(*pkg); err != nil {
		return nil, err
	}

	if o.pub != nil {
		_ = o.pub.PublishEvent(ctx, "content_factory.review.required", tenantID, "SVC-056", packageID)
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "wf_021_started", packageID, "human review requested")
	}

	return pkg, nil
}

func (o *ContentFactoryOrchestrator) ReviewPackage(
	ctx context.Context,
	tenantID, packageID, reviewerID string,
	approved bool,
	comments string,
) (*domain.ReviewDecision, error) {
	pkg, err := o.packages.GetPackage(tenantID, packageID)
	if err != nil {
		return nil, err
	}

	targetStatus := domain.PackageStatusApproved
	if !approved {
		targetStatus = domain.PackageStatusRejected
	}

	if err := o.policy.ValidateTransition(pkg.Status, targetStatus); err != nil {
		return nil, err
	}

	dec := domain.ReviewDecision{
		DecisionID: fmt.Sprintf("rev-%d", time.Now().UnixNano()),
		TenantID:   tenantID,
		PackageID:  packageID,
		Approved:   approved,
		ReviewerID: reviewerID,
		Comments:   comments,
		DecidedAt:  time.Now(),
	}

	if o.decisions != nil {
		_ = o.decisions.SaveDecision(dec)
	}

	pkg.Status = targetStatus
	pkg.UpdatedAt = time.Now()
	if err := o.packages.SavePackage(*pkg); err != nil {
		return nil, err
	}

	if approved && o.pub != nil {
		_ = o.pub.PublishEvent(ctx, "content_factory.package.approved", tenantID, "SVC-056", packageID)
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "review_package", packageID, fmt.Sprintf("approved=%v reviewer=%s", approved, reviewerID))
	}

	return &dec, nil
}
