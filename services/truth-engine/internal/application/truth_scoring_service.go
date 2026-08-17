package application

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/truth-engine/internal/domain"
)

type TruthScoringService struct {
	misinfo    domain.MisinfoRepo
	ledger     domain.ProvenanceLedgerRepo
	aiProvider llm.Provider
	pub        EventPublisher
	audit      AuditLogger
	policy     domain.ConfidencePolicy
}

func NewTruthScoringService(
	misinfo domain.MisinfoRepo,
	ledger domain.ProvenanceLedgerRepo,
	aiProvider llm.Provider,
	pub EventPublisher,
	audit AuditLogger,
) *TruthScoringService {
	return &TruthScoringService{
		misinfo:    misinfo,
		ledger:     ledger,
		aiProvider: aiProvider,
		pub:        pub,
		audit:      audit,
		policy:     domain.ConfidencePolicy{},
	}
}

func (s *TruthScoringService) ScoreConfidence(
	ctx context.Context,
	tenantID, storyID string,
	sourceScore, claimSupportRatio float64,
	misinfoFlagged bool,
) (float64, domain.ConfidenceTier, error) {
	score, tier := s.policy.CalculateConfidence(sourceScore, claimSupportRatio, misinfoFlagged)

	ts := time.Now().Unix()
	hash := domain.GenerateProvenanceHash(tenantID, storyID, "all", "SCORE_CONFIDENCE", "SVC-044", ts)

	if s.ledger != nil {
		_ = s.ledger.AppendRecord(domain.ProvenanceRecord{
			RecordID:          fmt.Sprintf("prov-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			StoryID:           storyID,
			Action:            "SCORE_CONFIDENCE",
			Actor:             "SVC-044",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "truth_engine.confidence.calculated", tenantID, "SVC-044", fmt.Sprintf("story_id=%s score=%.2f tier=%s", storyID, score, tier))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "score_confidence", storyID, fmt.Sprintf("score=%.2f tier=%s", score, tier))
	}
	return score, tier, nil
}

func (s *TruthScoringService) DetectMisinformation(
	ctx context.Context,
	tenantID, storyID, title, content string,
) (*domain.MisinfoReport, error) {
	isMisinfo := false
	riskScore := 0.05
	var patterns []string

	if s.aiProvider != nil {
		req := llm.CompletionRequest{
			TenantID: tenantID,
			Model:    "misinfo-detector-v1",
			Messages: []llm.Message{
				{Role: "system", Content: "Check for misinformation patterns, synthetic manipulation, or unverified rumor markers. Reply MISINFO if detected."},
				{Role: "user", Content: fmt.Sprintf("Title: %s\nContent: %s", title, content)},
			},
		}
		resp, err := s.aiProvider.Generate(ctx, req)
		if err == nil && strings.Contains(strings.ToUpper(resp.Content), "MISINFO") {
			isMisinfo = true
			riskScore = 0.95
			patterns = []string{"synthetic_manipulation", "unverified_rumor"}
		}
	}

	if strings.Contains(strings.ToLower(content), "conspiracy") || strings.Contains(strings.ToLower(title), "fake") {
		isMisinfo = true
		riskScore = 0.90
		patterns = append(patterns, "flagged_keyword_pattern")
	}

	report := domain.MisinfoReport{
		ReportID:        fmt.Sprintf("mis-%d", time.Now().UnixNano()),
		TenantID:        tenantID,
		StoryID:         storyID,
		IsMisinfo:       isMisinfo,
		RiskScore:       riskScore,
		FlaggedPatterns: patterns,
		DetectedAt:      time.Now(),
	}

	if err := s.misinfo.SaveMisinfoReport(report); err != nil {
		return nil, err
	}

	if isMisinfo && s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "truth_engine.misinfo.detected", tenantID, "SVC-041", fmt.Sprintf("story_id=%s risk=%.2f", storyID, riskScore))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "detect_misinfo", storyID, fmt.Sprintf("misinfo=%v risk=%.2f", isMisinfo, riskScore))
	}
	return &report, nil
}
