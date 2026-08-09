package detectors

import (
	"context"
	"fmt"
	"math"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func ApplyDecay(cred *domain.SourceCredibilityScore) float64 {
	if cred == nil {
		return 0.50
	}
	days := time.Since(cred.LastEvaluatedAt).Hours() / 24.0
	decayFactor := 1.0
	if days > 30 {
		decayFactor = math.Exp(-0.01 * days)
	}
	adjusted := cred.TrustScore * decayFactor
	if cred.HistoryRating == "FLAGGED" {
		adjusted *= 0.5
	}
	if adjusted < 0.0 {
		return 0.0
	} else if adjusted > 1.0 {
		return 1.0
	}
	return adjusted
}

type ContentDetectorAgent struct {
	mu             sync.RWMutex
	domain.BaseAgent
	classification string
	aiGateway      application.AIGatewayClient
	lastResult     *domain.DetectionResult
	simIndex       *SimilarityIndex
	credRepo       domain.SourceCredibilityRepository
}

func NewContentDetectorAgent(
	agentID, agentName, tenantID, classification string,
	aiGateway application.AIGatewayClient,
	simIndex *SimilarityIndex,
	credRepo domain.SourceCredibilityRepository,
) *ContentDetectorAgent {
	return &ContentDetectorAgent{
		BaseAgent: domain.BaseAgent{
			AgentID:       agentID,
			AgentName:     agentName,
			TenantUUID:    tenantID,
			CurrentStatus: domain.AgentStatusActive,
			Version:       "1.0.0",
		},
		classification: classification,
		aiGateway:      aiGateway,
		simIndex:       simIndex,
		credRepo:       credRepo,
	}
}

func (d *ContentDetectorAgent) Detect(ctx context.Context, signal domain.MonitorSignal) (*domain.DetectionResult, error) {
	if signal.TenantID != d.TenantUUID {
		return nil, domain.ErrCrossTenantViolation
	}

	// ITEM 1: AGT-015 MinHash/SimHash Local Deduplication Index check
	if d.AgentID == "AGT-015" && d.simIndex != nil {
		simRes, err := d.simIndex.CheckSimilarity(ctx, d.TenantUUID, &signal)
		if err == nil && simRes.IsDuplicate {
			res := &domain.DetectionResult{
				ResultID:        fmt.Sprintf("res-dup-%s-%d", signal.SignalID, time.Now().UnixNano()),
				TenantID:        d.TenantUUID,
				SignalID:        signal.SignalID,
				DetectorID:      d.AgentID,
				DetectorName:    d.AgentName,
				Classification:  "DUPLICATE",
				ConfidenceScore: simRes.SimilarityScore,
				Evidence: []domain.EvidenceItem{
					{
						EvidenceID:  fmt.Sprintf("ev-dup-%s", signal.SignalID),
						Type:        "LOCAL_MINHASH_MATCH",
						Description: fmt.Sprintf("Local Jaccard similarity %.2f > threshold matched signal %s", simRes.SimilarityScore, simRes.MatchedSignalID),
						Confidence:  simRes.SimilarityScore,
					},
				},
				DetectedAt: time.Now(),
				Metadata: map[string]string{
					"matched_signal_id":   simRes.MatchedSignalID,
					"local_deduplication": "true",
				},
			}
			d.mu.Lock()
			d.lastResult = res
			d.CurrentStatus = domain.AgentStatusActive
			d.mu.Unlock()
			return res, nil
		}
	}

	if d.aiGateway == nil {
		return nil, fmt.Errorf("AIGatewayService client is not configured for detector %s", d.AgentID)
	}

	// ITEM 2: AGT-012 Source Credibility lookup and temporal decay
	if d.AgentID == "AGT-012" && d.credRepo != nil {
		sourceID := signal.SourceID
		if sourceID == "" {
			sourceID = signal.Author
		}
		cred, err := d.credRepo.GetCredibility(ctx, d.TenantUUID, sourceID)
		if err == nil && cred != nil {
			adjustedScore := ApplyDecay(cred)
			if signal.Metadata == nil {
				signal.Metadata = make(map[string]string)
			}
			signal.Metadata["prior_trust_score"] = fmt.Sprintf("%.2f", adjustedScore)
			signal.Metadata["history_rating"] = cred.HistoryRating
		}
	}

	var res *domain.DetectionResult
	err := domain.RetryWithBackoff(ctx, func() error {
		var rErr error
		res, rErr = d.aiGateway.AnalyzeSignal(ctx, d.TenantUUID, d.AgentID, &signal)
		return rErr
	})
	if err != nil {
		d.CurrentStatus = domain.AgentStatusError
		return nil, fmt.Errorf("ai gateway detection failed on %s: %w", d.AgentID, err)
	}

	res.DetectorID = d.AgentID
	res.DetectorName = d.AgentName
	res.Classification = d.classification

	// After AI Gateway returns for AGT-012, update credibility score in database (running average)
	if d.AgentID == "AGT-012" && d.credRepo != nil {
		sourceID := signal.SourceID
		if sourceID == "" {
			sourceID = signal.Author
		}
		cred, _ := d.credRepo.GetCredibility(ctx, d.TenantUUID, sourceID)
		newTrust := res.ConfidenceScore
		historyRating := "VERIFIED_AUTHORITY"
		if cred != nil {
			newTrust = (cred.TrustScore * 0.7) + (res.ConfidenceScore * 0.3)
			historyRating = cred.HistoryRating
		}
		if res.ConfidenceScore < 0.4 {
			historyRating = "FLAGGED"
		}
		_ = d.credRepo.UpsertCredibility(ctx, d.TenantUUID, &domain.SourceCredibilityScore{
			SourceID:        sourceID,
			TenantID:        d.TenantUUID,
			Platform:        signal.Platform,
			TrustScore:      newTrust,
			HistoryRating:   historyRating,
			LastEvaluatedAt: time.Now(),
		})
	}

	d.mu.Lock()
	d.lastResult = res
	d.CurrentStatus = domain.AgentStatusActive
	d.mu.Unlock()

	return res, nil
}

func (d *ContentDetectorAgent) Confidence() float64 {
	d.mu.RLock()
	defer d.mu.RUnlock()
	if d.lastResult != nil {
		return d.lastResult.ConfidenceScore
	}
	return 0.0
}

func (d *ContentDetectorAgent) Evidence() []domain.EvidenceItem {
	d.mu.RLock()
	defer d.mu.RUnlock()
	if d.lastResult != nil {
		return d.lastResult.Evidence
	}
	return nil
}

func (d *ContentDetectorAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	if d.CurrentStatus == domain.AgentStatusSuspended {
		return domain.ErrAgentNotAuthorized
	}
	d.CurrentStatus = domain.AgentStatusActive
	_ = executionContext["trigger"]
	return nil
}

// Concrete constructors for AGT-009 through AGT-016
func NewBreakingNewsDetector(tenantID string, aiGateway application.AIGatewayClient) *ContentDetectorAgent {
	return NewContentDetectorAgent("AGT-009", "Breaking News Detector", tenantID, "BREAKING_NEWS", aiGateway, nil, nil)
}

func NewTrendIdentificationDetector(tenantID string, aiGateway application.AIGatewayClient) *ContentDetectorAgent {
	return NewContentDetectorAgent("AGT-010", "Trend Identification", tenantID, "VIRAL_TREND", aiGateway, nil, nil)
}

func NewSentimentAnalysisDetector(tenantID string, aiGateway application.AIGatewayClient) *ContentDetectorAgent {
	return NewContentDetectorAgent("AGT-011", "Sentiment Analysis", tenantID, "SENTIMENT_POLARITY", aiGateway, nil, nil)
}

func NewSourceCredibilityDetector(tenantID string, aiGateway application.AIGatewayClient, credRepo domain.SourceCredibilityRepository) *ContentDetectorAgent {
	return NewContentDetectorAgent("AGT-012", "Source Credibility Assessment", tenantID, "SOURCE_CREDIBILITY", aiGateway, nil, credRepo)
}

func NewMultimediaClassificationDetector(tenantID string, aiGateway application.AIGatewayClient) *ContentDetectorAgent {
	return NewContentDetectorAgent("AGT-013", "Multimedia Content Classification", tenantID, "MULTIMEDIA_CONTENT", aiGateway, nil, nil)
}

func NewLanguageLocaleDetector(tenantID string, aiGateway application.AIGatewayClient) *ContentDetectorAgent {
	return NewContentDetectorAgent("AGT-014", "Language & Locale Detection", tenantID, "LOCALE_CULTURE", aiGateway, nil, nil)
}

func NewDuplicatePlagiarismDetector(tenantID string, aiGateway application.AIGatewayClient, simIndex *SimilarityIndex) *ContentDetectorAgent {
	return NewContentDetectorAgent("AGT-015", "Duplicate & Plagiarism Detection", tenantID, "ORIGINAL_CONTENT", aiGateway, simIndex, nil)
}

func NewViralityPredictionDetector(tenantID string, aiGateway application.AIGatewayClient) *ContentDetectorAgent {
	return NewContentDetectorAgent("AGT-016", "Virality Prediction", tenantID, "VIRALITY_FORECAST", aiGateway, nil, nil)
}

func CreateAllDetectors(tenantID string, aiGateway application.AIGatewayClient) map[string]*ContentDetectorAgent {
	simIndex := NewSimilarityIndex()
	m := make(map[string]*ContentDetectorAgent, 8)
	detectors := []*ContentDetectorAgent{
		NewBreakingNewsDetector(tenantID, aiGateway),
		NewTrendIdentificationDetector(tenantID, aiGateway),
		NewSentimentAnalysisDetector(tenantID, aiGateway),
		NewSourceCredibilityDetector(tenantID, aiGateway, nil),
		NewMultimediaClassificationDetector(tenantID, aiGateway),
		NewLanguageLocaleDetector(tenantID, aiGateway),
		NewDuplicatePlagiarismDetector(tenantID, aiGateway, simIndex),
		NewViralityPredictionDetector(tenantID, aiGateway),
	}
	for _, det := range detectors {
		m[det.ID()] = det
		_ = time.Now()
	}
	return m
}
