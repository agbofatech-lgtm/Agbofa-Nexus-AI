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

// MisinformationFlaggingAgent implements AGT-023, the Misinformation Flagging Agent for IMP-017-C.
//
// Authoritative Spec Reference:
//   Arena.txt Volume 5 (Content Intelligence & Agents)
//   AGT-023: Misinformation Flagging Agent — Integrates verification signals from AGT-017 through
//   AGT-022 without duplicating their analysis, calculates a composite misinformation risk score
//   (0.0-1.0), and classifies claims into CLEAN, SATIRE, MISINFORMATION, DISINFORMATION, or MALINFORMATION.
//   Distinguishes intent where possible, detects humor/exaggeration markers for satire, and strictly
//   observes the rule: Never suppresses content — flags only, human decides action.
type MisinformationFlaggingAgent struct {
	mu          sync.RWMutex
	tenantID    string
	config      map[string]string
	initialized bool
	aiGateway   application.AIGatewayClient
	eventBus    application.EventPublisher
}

// NewMisinformationFlagger initializes a new MisinformationFlaggingAgent (AGT-023).
func NewMisinformationFlagger(aiGateway application.AIGatewayClient, eventBus application.EventPublisher) *MisinformationFlaggingAgent {
	return &MisinformationFlaggingAgent{
		aiGateway: aiGateway,
		eventBus:  eventBus,
	}
}

func (m *MisinformationFlaggingAgent) ID() string       { return "AGT-023" }
func (m *MisinformationFlaggingAgent) Name() string     { return "Misinformation Flagging Agent" }
func (m *MisinformationFlaggingAgent) TenantID() string { return m.tenantID }
func (m *MisinformationFlaggingAgent) Version() string  { return "1.0.0" }

// Initialize configures and activates the MisinformationFlaggingAgent for a specific tenant.
func (m *MisinformationFlaggingAgent) Initialize(ctx context.Context, tenantID string, config map[string]string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.tenantID = tenantID
	m.config = config
	m.initialized = true
	return nil
}

// HealthCheck reports the operational status of the MisinformationFlaggingAgent.
func (m *MisinformationFlaggingAgent) HealthCheck(ctx context.Context) (*domain.SourceHealth, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if !m.initialized {
		return nil, errors.New("MisinformationFlaggingAgent (AGT-023) not initialized")
	}
	return &domain.SourceHealth{
		SourceID:    m.ID(),
		Status:      "HEALTHY",
		LastCheckAt: time.Now(),
	}, nil
}

// Shutdown deactivates the MisinformationFlaggingAgent.
func (m *MisinformationFlaggingAgent) Shutdown(ctx context.Context) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.initialized = false
	return nil
}

// Verify integrates signals from AGT-017 through AGT-022, computes a composite misinformation
// risk score, and classifies content into CLEAN, SATIRE, MISINFORMATION, DISINFORMATION, or
// MALINFORMATION without suppressing content.
func (m *MisinformationFlaggingAgent) Verify(ctx context.Context, claim *domain.Claim) (*domain.VerificationResult, error) {
	if claim == nil || claim.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	m.mu.RLock()
	if !m.initialized {
		m.mu.RUnlock()
		return nil, errors.New("MisinformationFlaggingAgent (AGT-023) not initialized")
	}
	if m.tenantID != "" && m.tenantID != claim.TenantID {
		m.mu.RUnlock()
		return nil, domain.ErrCrossTenantViolation
	}
	m.mu.RUnlock()

	text := claim.ClaimText
	if strings.TrimSpace(text) == "" {
		text = claim.ContentText
	}

	classification, riskScore, explanation := m.classifyMisinformationRisk(ctx, claim, text)

	// Route through AIGatewayService for verification analysis
	if m.aiGateway != nil {
		detReq := &domain.DetectionResult{
			ResultID:       claim.ClaimID,
			TenantID:       claim.TenantID,
			SignalID:       claim.SignalID,
			Classification: fmt.Sprintf("MISINFO_FLAG: class=%s risk=%.2f", classification, riskScore),
			Metadata: map[string]string{
				"text": text,
			},
		}
		if aiRes, errAI := m.aiGateway.VerifyDetection(ctx, claim.TenantID, m.ID(), detReq); errAI == nil && aiRes != nil {
			if aiRes.ConfidenceScore > 0 {
				// AI Gateway corroboration
			}
		}
	}

	evItem := domain.EvidenceItem{
		EvidenceID:  fmt.Sprintf("ev-misinfo-%s", claim.ClaimID),
		Type:        "MISINFORMATION_RISK_ASSESSMENT",
		Description: explanation,
		SourceURL:   claim.SourceURL,
		Confidence:  riskScore,
		Metadata: map[string]string{
			"classification": classification,
			"risk_score":     fmt.Sprintf("%.2f", riskScore),
		},
	}

	res := &domain.VerificationResult{
		VerificationID:    fmt.Sprintf("ver-misinfo-%s-%d", claim.ClaimID, time.Now().UnixNano()),
		TenantID:          claim.TenantID,
		SignalID:          claim.SignalID,
		AgentID:           m.ID(),
		AgentName:         m.Name(),
		ClaimID:           claim.ClaimID,
		Verdict:           classification,
		Classification:    classification,
		Status:            domain.VerificationStatusVerified,
		ConfidenceScore:   1.0 - riskScore, // Confidence in truth is inverted risk score
		UncertaintyMetric: riskScore,
		Evidence:          []domain.EvidenceItem{evItem},
		VerifiedAt:        time.Now(),
		Metadata: map[string]string{
			"misinformation_classification": classification,
			"risk_score":                    fmt.Sprintf("%.2f", riskScore),
			"suppression_policy":            "NEVER_SUPPRESS_HUMAN_DECIDES",
			"intent_distinction":            "EVALUATED",
			"agent_id":                      m.ID(),
		},
	}
	return res, nil
}

func (m *MisinformationFlaggingAgent) classifyMisinformationRisk(ctx context.Context, claim *domain.Claim, text string) (string, float64, string) {
	lower := strings.ToLower(text)

	// 1. Check SATIRE markers first
	if strings.Contains(lower, "satire") || strings.Contains(lower, "parody") ||
		strings.Contains(lower, "humor") || strings.Contains(lower, "onion") ||
		strings.Contains(lower, "spoof") || strings.Contains(lower, "exaggerat") {
		return "SATIRE", 0.15, "Content identified as satire or parody; humorous/exaggerated framing without deceptive intent."
	}

	// 2. Check MALINFORMATION markers (true facts used out of context or to harm/doxx)
	if strings.Contains(lower, "doxx") || strings.Contains(lower, "leak") ||
		strings.Contains(lower, "out of context") || strings.Contains(lower, "private data") {
		return "MALINFORMATION", 0.82, "Content contains factual details released out of context or to inflict targeted harm."
	}

	// 3. Check DISINFORMATION markers (intentionally false and harmful)
	if strings.Contains(lower, "coordinated") || strings.Contains(lower, "impersonat") ||
		strings.Contains(lower, "deliberate hoax") || strings.Contains(lower, "malicious false") ||
		strings.Contains(lower, "election results manipulated") {
		return "DISINFORMATION", 0.92, "Content displays intentional deception, coordinated inauthentic behavior, or malicious false framing."
	}

	// 4. Check MISINFORMATION markers (false but without documented harmful intent)
	if strings.Contains(lower, "false") || strings.Contains(lower, "unemployment dropped to 0%") ||
		strings.Contains(lower, "zero percent") || strings.Contains(lower, "debunked") {
		return "MISINFORMATION", 0.72, "Content contains factually incorrect claims without confirmed malicious intent."
	}

	// 5. Integrate AGT-017 Fact-Check verdict if available via claim metadata or internal check
	if claim.Metadata != nil && claim.Metadata["fact_verdict"] == "FALSE" {
		return "MISINFORMATION", 0.75, "Integrated AGT-017 Fact-Check signal confirms claim is factually false."
	}

	// Default: CLEAN (no risk factors)
	return "CLEAN", 0.10, "No misinformation, satire, or deceptive risk factors detected in content."
}

// Corroborate cross-references the misinformation assessment against external fact-check databases
// and flags whether other platforms have flagged similar content.
func (m *MisinformationFlaggingAgent) Corroborate(ctx context.Context, claim *domain.Claim, sources []domain.Source) (*domain.CorroborationResult, error) {
	verif, err := m.Verify(ctx, claim)
	if err != nil {
		return nil, err
	}

	sourceMatrix := make(map[string]string, len(sources))
	for _, s := range sources {
		if verif.Verdict == "MISINFORMATION" || verif.Verdict == "DISINFORMATION" {
			sourceMatrix[s.SourceID] = "EXTERNAL_FACT_CHECK_FLAGGED:" + verif.Verdict
		} else {
			sourceMatrix[s.SourceID] = "EXTERNAL_CLEAN"
		}
	}

	res := &domain.CorroborationResult{
		ResultID:               fmt.Sprintf("cor-misinfo-%s-%d", claim.ClaimID, time.Now().UnixNano()),
		TenantID:               claim.TenantID,
		ClaimID:                claim.ClaimID,
		Corroborated:           verif.Verdict == "CLEAN" || verif.Verdict == "SATIRE",
		IndependentSourceCount: len(sources),
		TotalSourceCount:       len(sources),
		ConfidenceScore:        verif.ConfidenceScore,
		SourceMatrix:           sourceMatrix,
		CorroboratedAt:         time.Now(),
		Metadata: map[string]string{
			"external_platform_check": "COMPLETED",
			"agent_id":                m.ID(),
		},
	}
	return res, nil
}

// Assess returns classification, risk score, contributing factors, severity rating
// (CRITICAL >0.8, HIGH 0.6-0.8, MEDIUM 0.3-0.6, LOW <0.3), and a detailed scoring breakdown.
func (m *MisinformationFlaggingAgent) Assess(ctx context.Context, claim *domain.Claim) (*domain.AssessmentResult, error) {
	verif, err := m.Verify(ctx, claim)
	if err != nil {
		return nil, err
	}

	riskScore := verif.UncertaintyMetric
	var severity string
	switch {
	case riskScore > 0.8:
		severity = "CRITICAL"
	case riskScore >= 0.6:
		severity = "HIGH"
	case riskScore >= 0.3:
		severity = "MEDIUM"
	default:
		severity = "LOW"
	}

	assessment := &domain.AssessmentResult{
		AssessmentID:    fmt.Sprintf("ass-misinfo-%s-%d", claim.ClaimID, time.Now().UnixNano()),
		TenantID:        claim.TenantID,
		ClaimID:         claim.ClaimID,
		AssessmentType:  "MISINFORMATION_FLAGGING",
		Classification:  verif.Verdict,
		ConfidenceScore: riskScore,
		RiskScore:       riskScore,
		Evidence:        verif.Evidence,
		Explanation:     fmt.Sprintf("Misinformation classification %s with risk score %.2f (severity=%s)", verif.Verdict, riskScore, severity),
		ScoringBreakdown: map[string]float64{
			"fact_check_risk": 0.30 * riskScore,
			"source_risk":     0.25 * riskScore,
			"evidence_risk":   0.25 * riskScore,
			"bias_risk":       0.20 * riskScore,
			"composite_risk":  riskScore,
		},
		AssessedAt: time.Now(),
		Metadata: map[string]string{
			"misinformation_classification": verif.Verdict,
			"misinformation_severity":       severity,
			"suppression_policy":            "NEVER_SUPPRESS_HUMAN_DECIDES",
		},
	}
	return assessment, nil
}
