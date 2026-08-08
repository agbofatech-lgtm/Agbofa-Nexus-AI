package domain

import (
	"time"
)

type TrustLevel string

const (
	TrustLevelHigh       TrustLevel = "HIGH"
	TrustLevelMedium     TrustLevel = "MEDIUM"
	TrustLevelLow        TrustLevel = "LOW"
	TrustLevelUnverified TrustLevel = "UNVERIFIED"
)

type SourceReliability struct {
	SourceID                    string
	TenantID                    string
	SourceName                  string
	SourceType                  string
	ReliabilityScore            float64
	HistoricalAccuracyPercent   int
	CryptographicSignatureValid bool
	TrustTier                   TrustLevel
	EvaluatedAt                 time.Time
}

type ClaimVerificationStatus string

const (
	ClaimStatusSupported   ClaimVerificationStatus = "SUPPORTED"
	ClaimStatusRefuted     ClaimVerificationStatus = "REFUTED"
	ClaimStatusUnverifiable ClaimVerificationStatus = "UNVERIFIABLE"
)

type StoryClaim struct {
	ClaimID        string
	TenantID       string
	StoryID        string
	ClaimText      string
	EvidenceURLs   []string
	Status         ClaimVerificationStatus
	EvidenceScore  float64
	Explanation    string
	VerifiedAt     time.Time
}

type ConfidenceTier string

const (
	ConfidenceTierVerifiedTruth  ConfidenceTier = "VERIFIED_TRUTH"
	ConfidenceTierProvisional    ConfidenceTier = "PROVISIONAL"
	ConfidenceTierDoubtful       ConfidenceTier = "DOUBTFUL"
	ConfidenceTierMisinformation ConfidenceTier = "MISINFORMATION"
)

type TruthState string

const (
	TruthStateSubmitted TruthState = "SUBMITTED"
	TruthStateInReview  TruthState = "IN_REVIEW"
	TruthStateVerified  TruthState = "VERIFIED"
	TruthStateDisputed  TruthState = "DISPUTED"
	TruthStateRejected  TruthState = "REJECTED"
)

type TruthStory struct {
	StoryID          string
	TenantID         string
	Title            string
	Summary          string
	SourceID         string
	State            TruthState
	ConfidenceScore  float64
	Tier             ConfidenceTier
	MisinfoFlagged   bool
	MisinfoScore     float64
	LedgerRecordID   string
	ProvenanceHash   string
	GraphNodeID      string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type MisinfoReport struct {
	ReportID        string
	TenantID        string
	StoryID         string
	IsMisinfo       bool
	RiskScore       float64
	FlaggedPatterns []string
	DetectedAt      time.Time
}

type EditorialDecision struct {
	DecisionID           string
	TenantID             string
	StoryID              string
	Approved             bool
	Reason               string
	RequireHumanOverride bool
	DecidedAt            time.Time
}

type ProvenanceRecord struct {
	RecordID          string
	TenantID          string
	StoryID           string
	ClaimID           string
	SourceID          string
	Action            string
	Actor             string
	CryptographicHash string
	Timestamp         time.Time
}

type TruthGraphNodeRef struct {
	NodeID          string
	TenantID        string
	StoryID         string
	TruthState      string
	ConfidenceScore float64
	InitializedAt   time.Time
}

type WorkflowInstanceRef struct {
	InstanceID string
	TenantID   string
	WorkflowID string
	Status     string
	Parameters map[string]string
	StartedAt  time.Time
}
