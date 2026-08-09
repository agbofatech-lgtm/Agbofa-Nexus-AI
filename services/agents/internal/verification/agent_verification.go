package verification

import (
	"context"
	"crypto/sha256"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type ContentVerificationAgent struct {
	mu            sync.RWMutex
	domain.BaseAgent
	functionName  string
	aiGateway     application.AIGatewayClient
	lastResult    *domain.VerificationResult
	verifStatus   domain.VerificationStatus
	debunkedCache *DebunkedClaimCache
}

func NewContentVerificationAgent(
	agentID, agentName, tenantID, functionName string,
	aiGateway application.AIGatewayClient,
	debunkedCache *DebunkedClaimCache,
) *ContentVerificationAgent {
	return &ContentVerificationAgent{
		BaseAgent: domain.BaseAgent{
			AgentID:       agentID,
			AgentName:     agentName,
			TenantUUID:    tenantID,
			CurrentStatus: domain.AgentStatusActive,
			Version:       "1.0.0",
		},
		functionName:  functionName,
		aiGateway:     aiGateway,
		verifStatus:   domain.VerificationStatusPending,
		debunkedCache: debunkedCache,
	}
}

func computeEvidenceChainHash(signalID, detectionID, verifID string, evidence []domain.EvidenceItem) string {
	evIDs := make([]string, 0, len(evidence))
	for _, ev := range evidence {
		evIDs = append(evIDs, ev.EvidenceID)
	}
	hashInput := fmt.Sprintf("%s|%s|%s|%s", signalID, detectionID, verifID, strings.Join(evIDs, ","))
	h := sha256.Sum256([]byte(hashInput))
	return fmt.Sprintf("%x", h)
}

func (v *ContentVerificationAgent) Verify(ctx context.Context, detection domain.DetectionResult) (*domain.VerificationResult, error) {
	if detection.TenantID != v.TenantUUID {
		return nil, domain.ErrCrossTenantViolation
	}

	// ITEM 3: AGT-023 Persistent Debunked-Claim Cache Lookup
	if v.AgentID == "AGT-023" && v.debunkedCache != nil {
		claimText := detection.Classification
		if val, ok := detection.Metadata["claim_text"]; ok && val != "" {
			claimText = val
		}
		match, err := v.debunkedCache.CheckDebunked(ctx, v.TenantUUID, claimText)
		if err == nil && match.IsDebunked {
			res := &domain.VerificationResult{
				VerificationID:    fmt.Sprintf("ver-deb-%s-%d", detection.ResultID, time.Now().UnixNano()),
				TenantID:          v.TenantUUID,
				SignalID:          detection.SignalID,
				DetectionID:       detection.ResultID,
				AgentID:           v.AgentID,
				AgentName:         v.AgentName,
				Status:            domain.VerificationStatusDebunked,
				ConfidenceScore:   0.99,
				UncertaintyMetric: 0.01,
				Evidence: []domain.EvidenceItem{
					{
						EvidenceID:  fmt.Sprintf("ev-deb-%s", detection.ResultID),
						Type:        "DEBUNKED_CACHE_MATCH",
						Description: fmt.Sprintf("Matched debunked claim registry: %s", match.Reason),
						SourceURL:   match.AuthorityURL,
						Confidence:  0.99,
					},
				},
				VerifiedAt: time.Now(),
				Metadata: map[string]string{
					"debunked_cache_hit": "true",
					"authority_url":      match.AuthorityURL,
				},
			}
			res.Metadata["evidence_chain_sha256"] = computeEvidenceChainHash(res.SignalID, res.DetectionID, res.VerificationID, res.Evidence)

			v.mu.Lock()
			v.lastResult = res
			v.verifStatus = domain.VerificationStatusDebunked
			v.CurrentStatus = domain.AgentStatusActive
			v.mu.Unlock()
			return res, nil
		}
	}

	if v.aiGateway == nil {
		return nil, fmt.Errorf("AIGatewayService client is not configured for verifier %s", v.AgentID)
	}

	var res *domain.VerificationResult
	err := domain.RetryWithBackoff(ctx, func() error {
		var rErr error
		res, rErr = v.aiGateway.VerifyDetection(ctx, v.TenantUUID, v.AgentID, &detection)
		return rErr
	})
	if err != nil {
		v.CurrentStatus = domain.AgentStatusError
		v.mu.Lock()
		v.verifStatus = domain.VerificationStatusError
		v.mu.Unlock()
		return nil, fmt.Errorf("ai gateway verification failed on %s: %w", v.AgentID, err)
	}

	res.AgentID = v.AgentID
	res.AgentName = v.AgentName

	if res.Metadata == nil {
		res.Metadata = make(map[string]string)
	}
	// ITEM 2: Cryptographic SHA-256 evidence chain lineage hash
	res.Metadata["evidence_chain_sha256"] = computeEvidenceChainHash(res.SignalID, res.DetectionID, res.VerificationID, res.Evidence)

	v.mu.Lock()
	v.lastResult = res
	v.verifStatus = res.Status
	v.CurrentStatus = domain.AgentStatusActive
	v.mu.Unlock()

	return res, nil
}

func (v *ContentVerificationAgent) Confidence() float64 {
	v.mu.RLock()
	defer v.mu.RUnlock()
	if v.lastResult != nil {
		return v.lastResult.ConfidenceScore
	}
	return 0.0
}

func (v *ContentVerificationAgent) Evidence() []domain.EvidenceItem {
	v.mu.RLock()
	defer v.mu.RUnlock()
	if v.lastResult != nil {
		return v.lastResult.Evidence
	}
	return nil
}

func (v *ContentVerificationAgent) Status() domain.VerificationStatus {
	v.mu.RLock()
	defer v.mu.RUnlock()
	return v.verifStatus
}

func (v *ContentVerificationAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	if v.CurrentStatus == domain.AgentStatusSuspended {
		return domain.ErrAgentNotAuthorized
	}
	v.CurrentStatus = domain.AgentStatusActive
	_ = executionContext["trigger"]
	return nil
}

// AGT-024 Confidence Scoring Agent with Bayesian weighted aggregation & quorum rules
type ConfidenceScoringAgent struct {
	*ContentVerificationAgent
	domainWeights map[string]float64
}

func NewConfidenceScoringAgent(tenantID string, aiGateway application.AIGatewayClient) *ConfidenceScoringAgent {
	base := NewContentVerificationAgent("AGT-024", "Confidence Scoring", tenantID, "CONFIDENCE_SCORING", aiGateway, nil)
	return &ConfidenceScoringAgent{
		ContentVerificationAgent: base,
		domainWeights: map[string]float64{
			"AGT-017": 1.25, // Fact-Checking Agent
			"AGT-018": 1.15, // Cross-Reference Verification
			"AGT-019": 1.10, // Source Verification
			"AGT-020": 1.05, // Claim Extraction
			"AGT-021": 1.20, // Evidence Collection
			"AGT-022": 1.10, // Bias Detection
			"AGT-023": 1.30, // Misinformation Flagging
		},
	}
}

func (c *ConfidenceScoringAgent) AggregateConfidence(ctx context.Context, tenantID string, results []domain.VerificationResult) (*domain.VerificationResult, error) {
	if tenantID != c.TenantUUID {
		return nil, domain.ErrCrossTenantViolation
	}
	if len(results) == 0 {
		return nil, fmt.Errorf("no verification results to aggregate")
	}

	var sumWeightedConf float64
	var sumWeights float64
	allEvidence := make([]domain.EvidenceItem, 0)

	verifiedCount := 0
	disputedCount := 0
	debunkedCount := 0

	for _, r := range results {
		if r.TenantID != tenantID {
			return nil, domain.ErrCrossTenantViolation
		}
		w, ok := c.domainWeights[r.AgentID]
		if !ok || w <= 0 {
			w = 1.0
		}
		sumWeightedConf += r.ConfidenceScore * w
		sumWeights += w
		allEvidence = append(allEvidence, r.Evidence...)

		switch r.Status {
		case domain.VerificationStatusVerified:
			verifiedCount++
		case domain.VerificationStatusDebunked:
			debunkedCount++
		default:
			disputedCount++
		}
	}

	if sumWeights == 0 {
		sumWeights = 1.0
	}
	weightedConf := sumWeightedConf / sumWeights
	uncertainty := 1.0 - weightedConf

	totalCount := len(results)
	var status domain.VerificationStatus

	// ITEM 1: Majority-voting quorum rules
	if float64(debunkedCount)/float64(totalCount) >= 0.50 || weightedConf < 0.40 {
		status = domain.VerificationStatusDebunked
	} else if float64(verifiedCount)/float64(totalCount) >= 0.60 && weightedConf >= 0.70 {
		status = domain.VerificationStatusVerified
	} else {
		status = domain.VerificationStatusDisputed
	}

	agg := &domain.VerificationResult{
		VerificationID:    fmt.Sprintf("ver-agg-%d", time.Now().UnixNano()),
		TenantID:          tenantID,
		SignalID:          results[0].SignalID,
		DetectionID:       results[0].DetectionID,
		AgentID:           c.AgentID,
		AgentName:         c.AgentName,
		Status:            status,
		ConfidenceScore:   weightedConf,
		UncertaintyMetric: uncertainty,
		Evidence:          allEvidence,
		VerifiedAt:        time.Now(),
		Metadata: map[string]string{
			"aggregated_count": fmt.Sprintf("%d", totalCount),
			"aggregator":       "AGT-024",
			"quorum_verified":  fmt.Sprintf("%d", verifiedCount),
			"quorum_debunked":  fmt.Sprintf("%d", debunkedCount),
			"quorum_disputed":  fmt.Sprintf("%d", disputedCount),
			"weighted_formula": "BayesianDomainWeightedAverage_v1",
		},
	}

	// ITEM 2: Cryptographic SHA-256 evidence chain lineage hash
	agg.Metadata["evidence_chain_sha256"] = computeEvidenceChainHash(agg.SignalID, agg.DetectionID, agg.VerificationID, agg.Evidence)

	c.mu.Lock()
	c.lastResult = agg
	c.verifStatus = status
	c.CurrentStatus = domain.AgentStatusActive
	c.mu.Unlock()

	return agg, nil
}

// Concrete constructors for AGT-017 through AGT-023
func NewFactCheckingAgent(tenantID string, aiGateway application.AIGatewayClient) *ContentVerificationAgent {
	return NewContentVerificationAgent("AGT-017", "Fact-Checking Agent", tenantID, "FACT_CHECKING", aiGateway, nil)
}

func NewCrossReferenceAgent(tenantID string, aiGateway application.AIGatewayClient) *ContentVerificationAgent {
	return NewContentVerificationAgent("AGT-018", "Cross-Reference Verification", tenantID, "CROSS_REFERENCE", aiGateway, nil)
}

func NewSourceVerificationAgent(tenantID string, aiGateway application.AIGatewayClient) *ContentVerificationAgent {
	return NewContentVerificationAgent("AGT-019", "Source Verification", tenantID, "SOURCE_VERIFICATION", aiGateway, nil)
}

func NewClaimExtractionAgent(tenantID string, aiGateway application.AIGatewayClient) *ContentVerificationAgent {
	return NewContentVerificationAgent("AGT-020", "Claim Extraction", tenantID, "CLAIM_EXTRACTION", aiGateway, nil)
}

func NewEvidenceCollectionAgent(tenantID string, aiGateway application.AIGatewayClient) *ContentVerificationAgent {
	return NewContentVerificationAgent("AGT-021", "Evidence Collection", tenantID, "EVIDENCE_COLLECTION", aiGateway, nil)
}

func NewBiasDetectionAgent(tenantID string, aiGateway application.AIGatewayClient) *ContentVerificationAgent {
	return NewContentVerificationAgent("AGT-022", "Bias Detection", tenantID, "BIAS_DETECTION", aiGateway, nil)
}

func NewMisinformationFlaggingAgent(tenantID string, aiGateway application.AIGatewayClient, cache *DebunkedClaimCache) *ContentVerificationAgent {
	return NewContentVerificationAgent("AGT-023", "Misinformation Flagging", tenantID, "MISINFORMATION_FLAGGING", aiGateway, cache)
}

func CreateAllVerifiers(tenantID string, aiGateway application.AIGatewayClient) map[string]domain.VerificationAgent {
	cache := NewDebunkedClaimCache("")
	m := make(map[string]domain.VerificationAgent, 8)
	m["AGT-017"] = NewFactCheckingAgent(tenantID, aiGateway)
	m["AGT-018"] = NewCrossReferenceAgent(tenantID, aiGateway)
	m["AGT-019"] = NewSourceVerificationAgent(tenantID, aiGateway)
	m["AGT-020"] = NewClaimExtractionAgent(tenantID, aiGateway)
	m["AGT-021"] = NewEvidenceCollectionAgent(tenantID, aiGateway)
	m["AGT-022"] = NewBiasDetectionAgent(tenantID, aiGateway)
	m["AGT-023"] = NewMisinformationFlaggingAgent(tenantID, aiGateway, cache)
	m["AGT-024"] = NewConfidenceScoringAgent(tenantID, aiGateway)
	return m
}
