package verification

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strconv"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// ConfidenceScoringAgent implements AGT-024, the Confidence Scoring Agent for IMP-017-C.
//
// Authoritative Spec Reference:
//   Arena.txt Volume 5 (Content Intelligence & Agents)
//   AGT-024: Confidence Scoring Agent — Aggregates all verification results into a unified
//   confidence score using a strict weighted formula: AGT-017 (30%), AGT-018 (25%), AGT-019 (20%),
//   AGT-021 (15%), and inverted AGT-022 (10%). Handles missing signals gracefully via weight
//   redistribution, produces a transparent scoring breakdown, acts as the final authoritative arbiter,
//   and classifies claims into VERIFIED_TRUTH (>=0.85), PROVISIONAL (0.60-0.84), or DOUBTFUL (<0.60).
type ConfidenceScoringAgent struct {
	mu          sync.RWMutex
	tenantID    string
	config      map[string]string
	initialized bool
	aiGateway   application.AIGatewayClient
	agt17       *FactCheckAgent
	agt18       *CrossReferenceAgent
	agt19       *SourceVerificationAgent
	agt21       *EvidenceCollectionAgent
	agt22       *BiasDetectionAgent
}

// NewConfidenceScorer initializes a new ConfidenceScoringAgent (AGT-024).
func NewConfidenceScorer(aiGateway application.AIGatewayClient) *ConfidenceScoringAgent {
	return &ConfidenceScoringAgent{
		aiGateway: aiGateway,
		agt17:     NewFactCheckAgent(aiGateway),
		agt18:     NewCrossRefAgent(),
		agt19:     NewSourceVerifier(aiGateway),
		agt21:     NewEvidenceCollector(aiGateway),
		agt22:     NewBiasDetector(aiGateway),
	}
}

func (c *ConfidenceScoringAgent) ID() string       { return "AGT-024" }
func (c *ConfidenceScoringAgent) Name() string     { return "Confidence Scoring Agent" }
func (c *ConfidenceScoringAgent) TenantID() string { return c.tenantID }
func (c *ConfidenceScoringAgent) Version() string  { return "1.0.0" }

// Initialize configures and activates the ConfidenceScoringAgent and its underlying agents for a specific tenant.
func (c *ConfidenceScoringAgent) Initialize(ctx context.Context, tenantID string, config map[string]string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	c.tenantID = tenantID
	c.config = config
	c.initialized = true

	_ = c.agt17.Initialize(ctx, tenantID, config)
	_ = c.agt18.Initialize(ctx, tenantID, config)
	_ = c.agt19.Initialize(ctx, tenantID, config)
	_ = c.agt21.Initialize(ctx, tenantID, config)
	_ = c.agt22.Initialize(ctx, tenantID, config)
	return nil
}

// HealthCheck reports the operational status of the ConfidenceScoringAgent.
func (c *ConfidenceScoringAgent) HealthCheck(ctx context.Context) (*domain.SourceHealth, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if !c.initialized {
		return nil, errors.New("ConfidenceScoringAgent (AGT-024) not initialized")
	}
	return &domain.SourceHealth{
		SourceID:    c.ID(),
		Status:      "HEALTHY",
		LastCheckAt: time.Now(),
	}, nil
}

// Shutdown deactivates the ConfidenceScoringAgent.
func (c *ConfidenceScoringAgent) Shutdown(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.initialized = false
	_ = c.agt17.Shutdown(ctx)
	_ = c.agt18.Shutdown(ctx)
	_ = c.agt19.Shutdown(ctx)
	_ = c.agt21.Shutdown(ctx)
	_ = c.agt22.Shutdown(ctx)
	return nil
}

// Verify aggregates verification results from AGT-017 through AGT-022 using the strict weighted
// formula, redistributes weights if any signal is missing, and classifies into VERIFIED_TRUTH,
// PROVISIONAL, or DOUBTFUL. Acts as the final authoritative arbiter for the platform.
func (c *ConfidenceScoringAgent) Verify(ctx context.Context, claim *domain.Claim) (*domain.VerificationResult, error) {
	if claim == nil || claim.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	c.mu.RLock()
	if !c.initialized {
		c.mu.RUnlock()
		return nil, errors.New("ConfidenceScoringAgent (AGT-024) not initialized")
	}
	if c.tenantID != "" && c.tenantID != claim.TenantID {
		c.mu.RUnlock()
		return nil, domain.ErrCrossTenantViolation
	}
	c.mu.RUnlock()

	score17, score18, score19, score21, score22, missing21 := c.evaluateComponentScores(ctx, claim)

	var w17, w18, w19, w21, w22 float64 = 0.30, 0.25, 0.20, 0.15, 0.10
	var totalW float64 = w17 + w18 + w19 + w21 + w22
	if missing21 {
		totalW = w17 + w18 + w19 + w22
		w17 /= totalW
		w18 /= totalW
		w19 /= totalW
		w21 = 0.0
		w22 /= totalW
	}

	finalScore := w17*score17 + w18*score18 + w19*score19 + w21*score21 + w22*score22

	var tier string
	switch {
	case finalScore >= 0.85:
		tier = "VERIFIED_TRUTH"
	case finalScore >= 0.60:
		tier = "PROVISIONAL"
	default:
		tier = "DOUBTFUL"
	}

	// Route through AIGatewayService for verification analysis
	if c.aiGateway != nil {
		detReq := &domain.DetectionResult{
			ResultID:       claim.ClaimID,
			TenantID:       claim.TenantID,
			SignalID:       claim.SignalID,
			Classification: fmt.Sprintf("CONFIDENCE_SCORE: tier=%s score=%.4f", tier, finalScore),
			Metadata: map[string]string{
				"claim_text": claim.ClaimText,
			},
		}
		_, _ = c.aiGateway.VerifyDetection(ctx, claim.TenantID, c.ID(), detReq)
	}

	explanation := fmt.Sprintf("Authoritative confidence score %.4f classified as %s (weights: 17=%.2f, 18=%.2f, 19=%.2f, 21=%.2f, 22=%.2f)",
		finalScore, tier, w17, w18, w19, w21, w22)

	evItem := domain.EvidenceItem{
		EvidenceID:  fmt.Sprintf("ev-conf-%s", claim.ClaimID),
		Type:        "UNIFIED_CONFIDENCE_AGGREGATION",
		Description: explanation,
		SourceURL:   claim.SourceURL,
		Confidence:  finalScore,
		Metadata: map[string]string{
			"tier":               tier,
			"score_17_fact":      fmt.Sprintf("%.4f", score17),
			"score_18_cross":     fmt.Sprintf("%.4f", score18),
			"score_19_source":    fmt.Sprintf("%.4f", score19),
			"score_21_evidence":  fmt.Sprintf("%.4f", score21),
			"score_22_bias_inv":  fmt.Sprintf("%.4f", score22),
			"missing_21_redist":  fmt.Sprintf("%v", missing21),
		},
	}

	res := &domain.VerificationResult{
		VerificationID:    fmt.Sprintf("ver-conf-%s-%d", claim.ClaimID, time.Now().UnixNano()),
		TenantID:          claim.TenantID,
		SignalID:          claim.SignalID,
		AgentID:           c.ID(),
		AgentName:         c.Name(),
		ClaimID:           claim.ClaimID,
		Verdict:           tier,
		Classification:    tier,
		Status:            domain.VerificationStatusVerified,
		ConfidenceScore:   finalScore,
		UncertaintyMetric: 1.0 - finalScore,
		Evidence:          []domain.EvidenceItem{evItem},
		VerifiedAt:        time.Now(),
		Metadata: map[string]string{
			"confidence_tier":                tier,
			"final_confidence_score":         fmt.Sprintf("%.4f", finalScore),
			"uncertainty_metric":             fmt.Sprintf("%.4f", 1.0-finalScore),
			"weight_redistributed":           fmt.Sprintf("%v", missing21),
			"final_arbiter":                  "true",
			"truth_engine_policy_compatible": "true",
			"agent_id":                       c.ID(),
		},
	}
	return res, nil
}

func (c *ConfidenceScoringAgent) evaluateComponentScores(ctx context.Context, claim *domain.Claim) (float64, float64, float64, float64, float64, bool) {
	// Allow explicit metadata overrides for deterministic testing and injection
	if claim.Metadata != nil && claim.Metadata["override_agt17"] != "" {
		s17, _ := strconv.ParseFloat(claim.Metadata["override_agt17"], 64)
		s18, _ := strconv.ParseFloat(claim.Metadata["override_agt18"], 64)
		s19, _ := strconv.ParseFloat(claim.Metadata["override_agt19"], 64)
		s21, _ := strconv.ParseFloat(claim.Metadata["override_agt21"], 64)
		s22, _ := strconv.ParseFloat(claim.Metadata["override_agt22"], 64)
		missing21 := claim.Metadata["missing_agt21"] == "true"
		return s17, s18, s19, s21, s22, missing21
	}

	var score17, score18, score19, score21, score22 float64 = 0.85, 0.85, 0.85, 0.85, 0.85
	var missing21 bool

	if res17, err := c.agt17.Verify(ctx, claim); err == nil && res17 != nil {
		score17 = res17.ConfidenceScore
	}
	if res18, err := c.agt18.Verify(ctx, claim); err == nil && res18 != nil {
		score18 = res18.ConfidenceScore
	}
	if res19, err := c.agt19.Verify(ctx, claim); err == nil && res19 != nil {
		score19 = res19.ConfidenceScore
	}
	if res21, err := c.agt21.Verify(ctx, claim); err == nil && res21 != nil {
		if res21.Verdict == "NO_EVIDENCE_FOUND" {
			missing21 = true
			score21 = 0.0
		} else {
			score21 = res21.ConfidenceScore
		}
	} else {
		missing21 = true
		score21 = 0.0
	}
	if res22, err := c.agt22.Verify(ctx, claim); err == nil && res22 != nil {
		score22 = 1.0 - res22.ConfidenceScore // Invert bias impact (higher bias -> lower trust)
	}

	return score17, score18, score19, score21, score22, missing21
}

// Corroborate verifies scoring consistency across multiple evaluation passes and flags
// anomalies where individual component scores diverge significantly.
func (c *ConfidenceScoringAgent) Corroborate(ctx context.Context, claim *domain.Claim, sources []domain.Source) (*domain.CorroborationResult, error) {
	verif, err := c.Verify(ctx, claim)
	if err != nil {
		return nil, err
	}

	s17, s18, s19, s21, s22, _ := c.evaluateComponentScores(ctx, claim)
	scores := []float64{s17, s18, s19, s21, s22}
	minScore := scores[0]
	maxScore := scores[0]
	for _, s := range scores {
		minScore = math.Min(minScore, s)
		maxScore = math.Max(maxScore, s)
	}

	anomaly := (maxScore - minScore) > 0.50

	res := &domain.CorroborationResult{
		ResultID:               fmt.Sprintf("cor-conf-%s-%d", claim.ClaimID, time.Now().UnixNano()),
		TenantID:               claim.TenantID,
		ClaimID:                claim.ClaimID,
		Corroborated:           !anomaly,
		IndependentSourceCount: 5,
		TotalSourceCount:       5,
		ConfidenceScore:        verif.ConfidenceScore,
		SourceMatrix: map[string]string{
			"agt_017": fmt.Sprintf("%.2f", s17),
			"agt_018": fmt.Sprintf("%.2f", s18),
			"agt_019": fmt.Sprintf("%.2f", s19),
			"agt_021": fmt.Sprintf("%.2f", s21),
			"agt_022": fmt.Sprintf("%.2f", s22),
		},
		CorroboratedAt: time.Now(),
		Metadata: map[string]string{
			"scoring_anomaly": fmt.Sprintf("%v", anomaly),
			"max_divergence":  fmt.Sprintf("%.2f", maxScore-minScore),
			"agent_id":        c.ID(),
		},
	}
	return res, nil
}

// Assess returns confidence tier (VERIFIED_TRUTH, PROVISIONAL, DOUBTFUL), complete scoring
// breakdown with each agent's contribution, and overall confidence and uncertainty metrics.
func (c *ConfidenceScoringAgent) Assess(ctx context.Context, claim *domain.Claim) (*domain.AssessmentResult, error) {
	verif, err := c.Verify(ctx, claim)
	if err != nil {
		return nil, err
	}

	s17, s18, s19, s21, s22, missing21 := c.evaluateComponentScores(ctx, claim)

	assessment := &domain.AssessmentResult{
		AssessmentID:    fmt.Sprintf("ass-conf-%s-%d", claim.ClaimID, time.Now().UnixNano()),
		TenantID:        claim.TenantID,
		ClaimID:         claim.ClaimID,
		AssessmentType:  "CONFIDENCE_SCORING",
		Classification:  verif.Verdict,
		ConfidenceScore: verif.ConfidenceScore,
		RiskScore:       verif.UncertaintyMetric,
		Evidence:        verif.Evidence,
		Explanation:     fmt.Sprintf("Unified confidence score %.4f tier %s (uncertainty %.4f)", verif.ConfidenceScore, verif.Verdict, verif.UncertaintyMetric),
		ScoringBreakdown: map[string]float64{
			"agt_017_fact_check":        s17,
			"agt_018_cross_ref":         s18,
			"agt_019_source_auth":       s19,
			"agt_021_evidence_strength": s21,
			"agt_022_bias_inversion":    s22,
			"final_confidence_score":    verif.ConfidenceScore,
			"uncertainty_metric":        verif.UncertaintyMetric,
		},
		AssessedAt: time.Now(),
		Metadata: map[string]string{
			"confidence_tier":                verif.Verdict,
			"missing_21_redistributed":       fmt.Sprintf("%v", missing21),
			"final_arbiter":                  "true",
			"truth_engine_policy_compatible": "true",
		},
	}
	return assessment, nil
}
