package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/truth-engine/internal/domain"
)

type TruthEngineService struct {
	stories      domain.TruthStoryRepo
	sourceSvc    *SourceVerificationService
	claimSvc     *ClaimVerificationService
	scoringSvc   *TruthScoringService
	editorialSvc *EditorialDecisionService
	graphAdapter domain.TruthGraphAdapter
	ledger       domain.ProvenanceLedgerRepo
	pub          EventPublisher
	audit        AuditLogger
	policy       domain.TruthStatePolicy
}

func NewTruthEngineService(
	stories domain.TruthStoryRepo,
	sourceSvc *SourceVerificationService,
	claimSvc *ClaimVerificationService,
	scoringSvc *TruthScoringService,
	editorialSvc *EditorialDecisionService,
	graphAdapter domain.TruthGraphAdapter,
	ledger domain.ProvenanceLedgerRepo,
	pub EventPublisher,
	audit AuditLogger,
) *TruthEngineService {
	return &TruthEngineService{
		stories:      stories,
		sourceSvc:    sourceSvc,
		claimSvc:     claimSvc,
		scoringSvc:   scoringSvc,
		editorialSvc: editorialSvc,
		graphAdapter: graphAdapter,
		ledger:       ledger,
		pub:          pub,
		audit:        audit,
		policy:       domain.TruthStatePolicy{},
	}
}

func (s *TruthEngineService) HandleStorySubmittedEvent(
	ctx context.Context,
	tenantID, storyID, title, summary, sourceID string,
	claims []string,
) (*domain.TruthStory, error) {
	story := domain.TruthStory{
		StoryID:   storyID,
		TenantID:  tenantID,
		Title:     title,
		Summary:   summary,
		SourceID:  sourceID,
		State:     domain.TruthStateSubmitted,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.stories.SaveTruthStory(story); err != nil {
		return nil, err
	}

	return s.VerifyStory(ctx, tenantID, storyID, title, summary, sourceID, claims)
}

func (s *TruthEngineService) VerifyStory(
	ctx context.Context,
	tenantID, storyID, title, summary, sourceID string,
	claims []string,
) (*domain.TruthStory, error) {
	story, err := s.stories.GetTruthStory(storyID)
	if err != nil {
		story = &domain.TruthStory{
			StoryID:   storyID,
			TenantID:  tenantID,
			Title:     title,
			Summary:   summary,
			SourceID:  sourceID,
			State:     domain.TruthStateSubmitted,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
	}

	if err := s.policy.ValidateTransition(story.State, domain.TruthStateInReview); err == nil {
		story.State = domain.TruthStateInReview
	}

	var sourceScore float64 = 0.85
	if s.sourceSvc != nil {
		if rel, err := s.sourceSvc.VerifySource(ctx, tenantID, sourceID, "Source-"+sourceID, "RSS"); err == nil && rel != nil {
			sourceScore = rel.ReliabilityScore
		}
	}

	supportedCount := 0
	for i, cText := range claims {
		if s.claimSvc != nil {
			claimID := fmt.Sprintf("%s-c%d", storyID, i)
			res, err := s.claimSvc.VerifyClaim(ctx, tenantID, claimID, storyID, cText, []string{"http://primary-evidence.local"})
			if err == nil && res.Status == domain.ClaimStatusSupported {
				supportedCount++
			}
		} else {
			supportedCount++
		}
	}

	claimSupportRatio := 1.0
	if len(claims) > 0 {
		claimSupportRatio = float64(supportedCount) / float64(len(claims))
	}

	misinfoFlagged := false
	if s.scoringSvc != nil {
		rep, _ := s.scoringSvc.DetectMisinformation(ctx, tenantID, storyID, title, summary)
		if rep != nil && rep.IsMisinfo {
			misinfoFlagged = true
		}
	}

	var score float64 = 0.88
	var tier domain.ConfidenceTier = domain.ConfidenceTierVerifiedTruth
	if s.scoringSvc != nil {
		score, tier, _ = s.scoringSvc.ScoreConfidence(ctx, tenantID, storyID, sourceScore, claimSupportRatio, misinfoFlagged)
	}

	story.ConfidenceScore = score
	story.Tier = tier
	story.MisinfoFlagged = misinfoFlagged

	approved := false
	if s.editorialSvc != nil {
		dec, _ := s.editorialSvc.ValidateEditorialDecision(ctx, tenantID, storyID, score, misinfoFlagged)
		if dec != nil && dec.Approved {
			approved = true
		}
	} else {
		approved = score >= 0.85 && !misinfoFlagged
	}

	if approved {
		story.State = domain.TruthStateVerified
	} else if misinfoFlagged {
		story.State = domain.TruthStateRejected
	} else {
		story.State = domain.TruthStateDisputed
	}

	story.UpdatedAt = time.Now()

	ts := time.Now().Unix()
	story.ProvenanceHash = domain.GenerateProvenanceHash(tenantID, storyID, "all", string(story.State), "SVC-020", ts)
	story.LedgerRecordID = fmt.Sprintf("led-%s", storyID)

	if s.ledger != nil {
		_ = s.ledger.AppendRecord(domain.ProvenanceRecord{
			RecordID:          story.LedgerRecordID,
			TenantID:          tenantID,
			StoryID:           storyID,
			Action:            string(story.State),
			Actor:             "SVC-020",
			CryptographicHash: story.ProvenanceHash,
			Timestamp:         time.Now(),
		})
	}

	if s.graphAdapter != nil {
		node, err := s.graphAdapter.InitializeTruthNode(tenantID, storyID, string(story.State), score)
		if err == nil && node != nil {
			story.GraphNodeID = node.NodeID
		}
	}

	if err := s.stories.SaveTruthStory(*story); err != nil {
		return nil, err
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "verify_story_completed", storyID, fmt.Sprintf("state=%s score=%.2f hash=%s", story.State, score, story.ProvenanceHash))
	}

	return story, nil
}

func (s *TruthEngineService) GetTruthStory(ctx context.Context, storyID string) (*domain.TruthStory, error) {
	return s.stories.GetTruthStory(storyID)
}

func (s *TruthEngineService) GetProvenanceAuditTrail(ctx context.Context, storyID string) ([]domain.ProvenanceRecord, error) {
	if s.ledger == nil {
		return nil, nil
	}
	return s.ledger.GetStoryAuditTrail(storyID)
}
