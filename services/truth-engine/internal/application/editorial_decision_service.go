package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/truth-engine/internal/domain"
)

type EditorialDecisionService struct {
	ledger domain.ProvenanceLedgerRepo
	pub    EventPublisher
	audit  AuditLogger
}

func NewEditorialDecisionService(
	ledger domain.ProvenanceLedgerRepo,
	pub EventPublisher,
	audit AuditLogger,
) *EditorialDecisionService {
	return &EditorialDecisionService{
		ledger: ledger,
		pub:    pub,
		audit:  audit,
	}
}

func (s *EditorialDecisionService) ValidateEditorialDecision(
	ctx context.Context,
	tenantID, storyID string,
	confidenceScore float64,
	requireHumanOverride bool,
) (*domain.EditorialDecision, error) {
	approved := true
	reason := "Confidence score exceeds verification threshold."

	if confidenceScore < 0.85 || requireHumanOverride {
		approved = false
		reason = "Requires human editorial review due to provisional confidence or flag."
	}

	dec := domain.EditorialDecision{
		DecisionID:           fmt.Sprintf("dec-%d", time.Now().UnixNano()),
		TenantID:             tenantID,
		StoryID:              storyID,
		Approved:             approved,
		Reason:               reason,
		RequireHumanOverride: requireHumanOverride,
		DecidedAt:            time.Now(),
	}

	ts := time.Now().Unix()
	hash := domain.GenerateProvenanceHash(tenantID, storyID, "all", "EDITORIAL_DECISION", "SVC-045", ts)

	if s.ledger != nil {
		_ = s.ledger.AppendRecord(domain.ProvenanceRecord{
			RecordID:          fmt.Sprintf("prov-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			StoryID:           storyID,
			Action:            "EDITORIAL_DECISION",
			Actor:             "SVC-045",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if approved && s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "truth_engine.story.verified", tenantID, "SVC-045", storyID)
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "editorial_decision", storyID, fmt.Sprintf("approved=%v reason=%s", approved, reason))
	}
	return &dec, nil
}
