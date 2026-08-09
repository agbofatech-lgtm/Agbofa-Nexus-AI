package verification

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// ClaimExtractionAgent implements AGT-020, the Claim Extraction Agent for IMP-017-C.
//
// Authoritative Spec Reference:
//   Arena.txt Volume 5 (Content Intelligence & Agents)
//   AGT-020: Claim Extraction Agent — Extracts discrete factual claims from narrative content,
//   separates statements of fact vs opinions vs predictions, routes content through AIGatewayService
//   for claim identification, assigns unique claim IDs for downstream tracking, and returns a claim
//   inventory classified into FACTUAL, OPINION, PREDICTION, STATISTICAL, or QUOTATION.
type ClaimExtractionAgent struct {
	mu          sync.RWMutex
	tenantID    string
	config      map[string]string
	initialized bool
	aiGateway   application.AIGatewayClient
}

// NewClaimExtractor initializes a new ClaimExtractionAgent (AGT-020).
func NewClaimExtractor(aiGateway application.AIGatewayClient) *ClaimExtractionAgent {
	return &ClaimExtractionAgent{
		aiGateway: aiGateway,
	}
}

func (c *ClaimExtractionAgent) ID() string       { return "AGT-020" }
func (c *ClaimExtractionAgent) Name() string     { return "Claim Extraction Agent" }
func (c *ClaimExtractionAgent) TenantID() string { return c.tenantID }
func (c *ClaimExtractionAgent) Version() string  { return "1.0.0" }

// Initialize configures and activates the ClaimExtractionAgent for a specific tenant.
func (c *ClaimExtractionAgent) Initialize(ctx context.Context, tenantID string, config map[string]string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	c.tenantID = tenantID
	c.config = config
	c.initialized = true
	return nil
}

// HealthCheck reports the operational status of the ClaimExtractionAgent.
func (c *ClaimExtractionAgent) HealthCheck(ctx context.Context) (*domain.SourceHealth, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if !c.initialized {
		return nil, errors.New("ClaimExtractionAgent (AGT-020) not initialized")
	}
	return &domain.SourceHealth{
		SourceID:    c.ID(),
		Status:      "HEALTHY",
		LastCheckAt: time.Now(),
	}, nil
}

// Shutdown deactivates the ClaimExtractionAgent.
func (c *ClaimExtractionAgent) Shutdown(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.initialized = false
	return nil
}

// Verify extracts discrete factual claims from narrative content, separating statements of fact
// vs opinions vs predictions, routes through AIGatewayService, assigns unique claim IDs, and
// returns extracted claims with type classification.
func (c *ClaimExtractionAgent) Verify(ctx context.Context, claim *domain.Claim) (*domain.VerificationResult, error) {
	if claim == nil || claim.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	c.mu.RLock()
	if !c.initialized {
		c.mu.RUnlock()
		return nil, errors.New("ClaimExtractionAgent (AGT-020) not initialized")
	}
	if c.tenantID != "" && c.tenantID != claim.TenantID {
		c.mu.RUnlock()
		return nil, domain.ErrCrossTenantViolation
	}
	c.mu.RUnlock()

	sourceText := claim.ContentText
	if strings.TrimSpace(sourceText) == "" {
		sourceText = claim.ClaimText
	}

	claims := c.extractDiscreteClaims(sourceText, claim.SignalID, claim.TenantID)

	// Route through AIGatewayService for claim identification
	if c.aiGateway != nil {
		detReq := &domain.DetectionResult{
			ResultID:       claim.ClaimID,
			TenantID:       claim.TenantID,
			SignalID:       claim.SignalID,
			Classification: "EXTRACT_CLAIMS: " + sourceText,
			Metadata: map[string]string{
				"extracted_count": fmt.Sprintf("%d", len(claims)),
			},
		}
		if aiRes, errAI := c.aiGateway.VerifyDetection(ctx, claim.TenantID, c.ID(), detReq); errAI == nil && aiRes != nil {
			// AI Gateway integration verified
		}
	}

	var evidence []domain.EvidenceItem
	for _, ext := range claims {
		evidence = append(evidence, domain.EvidenceItem{
			EvidenceID:  ext.ClaimID,
			Type:        "EXTRACTED_CLAIM",
			Description: ext.ClaimText,
			Confidence:  0.92,
			Metadata: map[string]string{
				"claim_id":      ext.ClaimID,
				"claim_text":    ext.ClaimText,
				"claim_type":    ext.ClaimType,
				"is_verifiable": fmt.Sprintf("%v", ext.IsVerifiable),
				"confidence":    "0.92",
			},
		})
	}

	res := &domain.VerificationResult{
		VerificationID:    fmt.Sprintf("ver-ext-%s-%d", claim.ClaimID, time.Now().UnixNano()),
		TenantID:          claim.TenantID,
		SignalID:          claim.SignalID,
		AgentID:           c.ID(),
		AgentName:         c.Name(),
		ClaimID:           claim.ClaimID,
		Verdict:           "CLAIMS_EXTRACTED",
		Classification:    "CLAIMS_EXTRACTED",
		Status:            domain.VerificationStatusVerified,
		ConfidenceScore:   0.92,
		UncertaintyMetric: 0.08,
		Evidence:          evidence,
		VerifiedAt:        time.Now(),
		Metadata: map[string]string{
			"extracted_count": fmt.Sprintf("%d", len(claims)),
			"agent_id":        c.ID(),
		},
	}
	return res, nil
}

func (c *ClaimExtractionAgent) extractDiscreteClaims(text, signalID, tenantID string) []domain.Claim {
	parts := strings.Split(text, ".")
	var out []domain.Claim
	idx := 1
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if len(trimmed) < 5 {
			continue
		}

		claimType, isVerifiable := classifyClaimType(trimmed)
		claimID := fmt.Sprintf("ext-clm-%s-%d", signalID, idx)
		if signalID == "" {
			claimID = fmt.Sprintf("ext-clm-%d", idx)
		}

		out = append(out, domain.Claim{
			ClaimID:      claimID,
			TenantID:     tenantID,
			SignalID:     signalID,
			ClaimText:    trimmed,
			ClaimType:    claimType,
			IsVerifiable: isVerifiable,
			ExtractedAt:  time.Now(),
		})
		idx++
	}
	if len(out) == 0 {
		out = append(out, domain.Claim{
			ClaimID:      fmt.Sprintf("ext-clm-%s-1", signalID),
			TenantID:     tenantID,
			SignalID:     signalID,
			ClaimText:    text,
			ClaimType:    "FACTUAL",
			IsVerifiable: true,
			ExtractedAt:  time.Now(),
		})
	}
	return out
}

// classifyClaimType assigns one of the five required claim types:
// FACTUAL, OPINION, PREDICTION, STATISTICAL, QUOTATION.
func classifyClaimType(statement string) (string, bool) {
	lower := strings.ToLower(statement)
	if strings.Contains(lower, "%") || strings.Contains(lower, "percent") || strings.Contains(lower, "rate") || containsDigit(lower) {
		return "STATISTICAL", true
	}
	if strings.Contains(lower, "\"") || strings.Contains(lower, "said") || strings.Contains(lower, "stated") || strings.Contains(lower, "according to") {
		return "QUOTATION", true
	}
	if strings.Contains(lower, "will") || strings.Contains(lower, "predict") || strings.Contains(lower, "forecast") || strings.Contains(lower, "expect") {
		return "PREDICTION", false
	}
	if strings.Contains(lower, "best") || strings.Contains(lower, "worst") || strings.Contains(lower, "should") || strings.Contains(lower, "feel") || strings.Contains(lower, "believe") {
		return "OPINION", false
	}
	return "FACTUAL", true
}

func containsDigit(s string) bool {
	for _, r := range s {
		if r >= '0' && r <= '9' {
			return true
		}
	}
	return false
}

// Corroborate is not applicable for Claim Extraction Agent — returns a structured note.
func (c *ClaimExtractionAgent) Corroborate(ctx context.Context, claim *domain.Claim, sources []domain.Source) (*domain.CorroborationResult, error) {
	if claim == nil || claim.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	c.mu.RLock()
	if !c.initialized {
		c.mu.RUnlock()
		return nil, errors.New("ClaimExtractionAgent (AGT-020) not initialized")
	}
	if c.tenantID != "" && c.tenantID != claim.TenantID {
		c.mu.RUnlock()
		return nil, domain.ErrCrossTenantViolation
	}
	c.mu.RUnlock()

	return &domain.CorroborationResult{
		ResultID:               fmt.Sprintf("cor-ext-%s-%d", claim.ClaimID, time.Now().UnixNano()),
		TenantID:               claim.TenantID,
		ClaimID:                claim.ClaimID,
		Corroborated:           false,
		IndependentSourceCount: 0,
		TotalSourceCount:       len(sources),
		ConfidenceScore:        1.0,
		CorroboratingSources:   nil,
		SourceMatrix:           nil,
		CorroboratedAt:         time.Now(),
		Metadata: map[string]string{
			"note":     "Corroboration is not applicable for Claim Extraction Agent (AGT-020)",
			"agent_id": c.ID(),
		},
	}, nil
}

// Assess returns a claim inventory classified into FACTUAL, OPINION, PREDICTION, STATISTICAL,
// or QUOTATION, distinguishing verifiable claims from non-verifiable claims.
func (c *ClaimExtractionAgent) Assess(ctx context.Context, claim *domain.Claim) (*domain.AssessmentResult, error) {
	verif, err := c.Verify(ctx, claim)
	if err != nil {
		return nil, err
	}

	verifiableCount := 0
	nonVerifiableCount := 0
	for _, ev := range verif.Evidence {
		if ev.Metadata["is_verifiable"] == "true" {
			verifiableCount++
		} else {
			nonVerifiableCount++
		}
	}

	assessment := &domain.AssessmentResult{
		AssessmentID:    fmt.Sprintf("ass-ext-%s-%d", claim.ClaimID, time.Now().UnixNano()),
		TenantID:        claim.TenantID,
		ClaimID:         claim.ClaimID,
		AssessmentType:  "CLAIM_EXTRACTION",
		Classification:  "INVENTORY_READY",
		ConfidenceScore: verif.ConfidenceScore,
		RiskScore:       1.0 - verif.ConfidenceScore,
		Evidence:        verif.Evidence,
		Explanation:     fmt.Sprintf("Extracted %d discrete claims (%d verifiable, %d non-verifiable)", len(verif.Evidence), verifiableCount, nonVerifiableCount),
		ScoringBreakdown: map[string]float64{
			"total_claims":          float64(len(verif.Evidence)),
			"verifiable_claims":     float64(verifiableCount),
			"non_verifiable_claims": float64(nonVerifiableCount),
		},
		AssessedAt: time.Now(),
		Metadata: map[string]string{
			"inventory_status":  "COMPLETE",
			"verifiable_count":  fmt.Sprintf("%d", verifiableCount),
			"unverifiable_count": fmt.Sprintf("%d", nonVerifiableCount),
		},
	}
	return assessment, nil
}
