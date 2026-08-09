package domain

import (
	"context"
	"time"
)

type VerificationStatus string

const (
	VerificationStatusPending  VerificationStatus = "PENDING"
	VerificationStatusVerified VerificationStatus = "VERIFIED"
	VerificationStatusDisputed VerificationStatus = "DISPUTED"
	VerificationStatusDebunked VerificationStatus = "DEBUNKED"
	VerificationStatusError    VerificationStatus = "ERROR"
)

type VerificationResult struct {
	VerificationID    string            `json:"verification_id"`
	TenantID          string            `json:"tenant_id"`
	SignalID          string            `json:"signal_id"`
	DetectionID       string            `json:"detection_id"`
	AgentID           string            `json:"agent_id"`
	AgentName         string            `json:"agent_name"`
	Status            VerificationStatus `json:"status"`
	ConfidenceScore   float64           `json:"confidence_score"`
	UncertaintyMetric float64           `json:"uncertainty_metric"`
	Evidence          []EvidenceItem    `json:"evidence"`
	VerifiedAt        time.Time         `json:"verified_at"`
	Metadata          map[string]string `json:"metadata"`
	// Additive fields for IMP-017-C ContentVerifiers
	ClaimID        string   `json:"claim_id,omitempty"`
	Verdict        string   `json:"verdict,omitempty"` // TRUE, FALSE, MISLEADING, UNVERIFIED, HALF_TRUE
	Classification string   `json:"classification,omitempty"`
	Sources        []Source `json:"sources,omitempty"`
}

type ClaimExtract struct {
	ClaimID      string    `json:"claim_id"`
	TenantID     string    `json:"tenant_id"`
	SignalID     string    `json:"signal_id"`
	ClaimText    string    `json:"claim_text"`
	ClaimType    string    `json:"claim_type"`
	IsVerifiable bool      `json:"is_verifiable"`
	ExtractedAt  time.Time `json:"extracted_at"`
}

type BiasAssessment struct {
	AssessmentID  string            `json:"assessment_id"`
	TenantID      string            `json:"tenant_id"`
	SignalID      string            `json:"signal_id"`
	BiasScore     float64           `json:"bias_score"`
	EditorialBias string            `json:"editorial_bias"`
	FramingBias   string            `json:"framing_bias"`
	Metadata      map[string]string `json:"metadata"`
	AssessedAt    time.Time         `json:"assessed_at"`
}

// Additive domain models for IMP-017-C Verification Agents (AGT-017 through AGT-024)

type Claim struct {
	ClaimID      string            `json:"claim_id"`
	TenantID     string            `json:"tenant_id"`
	SignalID     string            `json:"signal_id"`
	ContentText  string            `json:"content_text"`
	ClaimText    string            `json:"claim_text"`
	ClaimType    string            `json:"claim_type"` // STATEMENT_OF_FACT, OPINION, PREDICTION
	Author       string            `json:"author"`
	SourceURL    string            `json:"source_url"`
	IsVerifiable bool              `json:"is_verifiable"`
	ExtractedAt  time.Time         `json:"extracted_at"`
	Metadata     map[string]string `json:"metadata"`
}

type Source struct {
	SourceID           string            `json:"source_id"`
	TenantID           string            `json:"tenant_id"`
	Name               string            `json:"name"`
	Domain             string            `json:"domain"`
	ParentCompany      string            `json:"parent_company"`
	URL                string            `json:"url"`
	AuthorityScore     float64           `json:"authority_score"`
	CredibilityTier    string            `json:"credibility_tier"` // HIGH, MEDIUM, LOW, UNKNOWN
	IsIndependent      bool              `json:"is_independent"`
	PublicationHistory int               `json:"publication_history"`
	AuthorCredentials  string            `json:"author_credentials"`
	Metadata           map[string]string `json:"metadata"`
}

type CorroborationResult struct {
	ResultID               string            `json:"result_id"`
	TenantID               string            `json:"tenant_id"`
	ClaimID                string            `json:"claim_id"`
	Corroborated           bool              `json:"corroborated"`
	IndependentSourceCount int               `json:"independent_source_count"`
	TotalSourceCount       int               `json:"total_source_count"`
	ConfidenceScore        float64           `json:"confidence_score"`
	CorroboratingSources   []Source          `json:"corroborating_sources"`
	SourceMatrix           map[string]string `json:"source_matrix"` // Maps source_id -> parent_company/relationship
	CorroboratedAt         time.Time         `json:"corroborated_at"`
	Metadata               map[string]string `json:"metadata"`
}

type AssessmentResult struct {
	AssessmentID     string             `json:"assessment_id"`
	TenantID         string             `json:"tenant_id"`
	ClaimID          string             `json:"claim_id"`
	AssessmentType   string             `json:"assessment_type"` // BIAS, MISINFORMATION, SOURCE_VERIFICATION, EVIDENCE, CONFIDENCE
	Classification   string             `json:"classification"`  // e.g. TRUE/FALSE/MISLEADING, POLITICAL/COMMERCIAL/NONE, CLEAN/MISINFORMATION, etc.
	ConfidenceScore  float64            `json:"confidence_score"`
	RiskScore        float64            `json:"risk_score"`
	Evidence         []EvidenceItem     `json:"evidence"`
	Explanation      string             `json:"explanation"`
	ScoringBreakdown map[string]float64 `json:"scoring_breakdown"`
	AssessedAt       time.Time          `json:"assessed_at"`
	Metadata         map[string]string  `json:"metadata"`
}

type VerificationAgent interface {
	Agent
	Verify(ctx context.Context, detection DetectionResult) (*VerificationResult, error)
	Confidence() float64
	Evidence() []EvidenceItem
	Status() VerificationStatus
}
