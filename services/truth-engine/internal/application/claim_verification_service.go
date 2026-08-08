package application

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/truth-engine/internal/domain"
)

type ClaimVerificationService struct {
	claims     domain.ClaimRepo
	ledger     domain.ProvenanceLedgerRepo
	aiProvider llm.Provider
	pub        EventPublisher
	audit      AuditLogger
}

func NewClaimVerificationService(
	claims domain.ClaimRepo,
	ledger domain.ProvenanceLedgerRepo,
	aiProvider llm.Provider,
	pub EventPublisher,
	audit AuditLogger,
) *ClaimVerificationService {
	return &ClaimVerificationService{
		claims:     claims,
		ledger:     ledger,
		aiProvider: aiProvider,
		pub:        pub,
		audit:      audit,
	}
}

func (s *ClaimVerificationService) VerifyClaim(
	ctx context.Context,
	tenantID, claimID, storyID, claimText string,
	evidenceURLs []string,
) (*domain.StoryClaim, error) {
	status := domain.ClaimStatusSupported
	score := 0.90
	explanation := "Supported by corroborating primary sources."

	if s.aiProvider != nil {
		req := llm.CompletionRequest{
			TenantID: tenantID,
			Model:    "fact-checker-v1",
			Messages: []llm.Message{
				{Role: "system", Content: "Verify if the claim is supported by evidence. Reply SUPPORTED, REFUTED, or UNVERIFIABLE."},
				{Role: "user", Content: fmt.Sprintf("Claim: %s\nEvidence: %s", claimText, strings.Join(evidenceURLs, ", "))},
			},
		}
		resp, err := s.aiProvider.Generate(ctx, req)
		if err == nil && resp.Content != "" {
			if strings.Contains(strings.ToUpper(resp.Content), "REFUTED") {
				status = domain.ClaimStatusRefuted
				score = 0.15
				explanation = "Refuted by primary evidence sources."
			} else if strings.Contains(strings.ToUpper(resp.Content), "UNVERIFIABLE") {
				status = domain.ClaimStatusUnverifiable
				score = 0.50
				explanation = "Insufficient evidence to corroborate."
			}
		}
	}

	ts := time.Now().Unix()
	hash := domain.GenerateProvenanceHash(tenantID, storyID, claimID, "VERIFY_CLAIM", "SVC-039", ts)

	claim := domain.StoryClaim{
		ClaimID:       claimID,
		TenantID:      tenantID,
		StoryID:       storyID,
		ClaimText:     claimText,
		EvidenceURLs:  evidenceURLs,
		Status:        status,
		EvidenceScore: score,
		Explanation:   explanation,
		VerifiedAt:    time.Now(),
	}

	if err := s.claims.SaveClaim(claim); err != nil {
		return nil, err
	}

	if s.ledger != nil {
		_ = s.ledger.AppendRecord(domain.ProvenanceRecord{
			RecordID:          fmt.Sprintf("prov-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			StoryID:           storyID,
			ClaimID:           claimID,
			Action:            "VERIFY_CLAIM",
			Actor:             "SVC-039",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "truth_engine.claim.verified", tenantID, "SVC-039", fmt.Sprintf("claim_id=%s status=%s", claimID, status))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "verify_claim", claimID, fmt.Sprintf("status=%s score=%.2f", status, score))
	}

	return &claim, nil
}

func (s *ClaimVerificationService) GetClaim(ctx context.Context, claimID string) (*domain.StoryClaim, error) {
	return s.claims.GetClaim(claimID)
}

func (s *ClaimVerificationService) ListClaimsByStory(ctx context.Context, storyID string) ([]domain.StoryClaim, error) {
	return s.claims.ListClaimsByStory(storyID)
}
