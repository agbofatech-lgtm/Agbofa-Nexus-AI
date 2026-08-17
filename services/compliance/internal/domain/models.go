package domain

import (
	"time"
)

type ComplianceStatus string

const (
	ComplianceStatusCompliant      ComplianceStatus = "COMPLIANT"
	ComplianceStatusReviewRequired ComplianceStatus = "REVIEW_REQUIRED"
	ComplianceStatusRejected       ComplianceStatus = "REJECTED"
)

type RightsResult struct {
	Passed            bool
	Score             float64
	AttributionNotes  []string
}

type OriginalityResult struct {
	Passed               bool
	Score                float64
	MaxSimilarityPercent float64
}

type LegalResult struct {
	Passed     bool
	Score      float64
	LegalRisks []string
}

type PrivacyResult struct {
	Passed      bool
	Score       float64
	PIIDetected bool
}

type AISafetyResult struct {
	Passed               bool
	Score                float64
	MisinfoFlagInherited bool
}

type PlatformPolicyResult struct {
	Passed            bool
	Score             float64
	ChannelViolations []string
}

type ComplianceReport struct {
	ReportID     string
	TenantID     string
	PackageID    string
	StoryID      string
	Status       ComplianceStatus
	OverallScore float64
	Rights       RightsResult
	Originality  OriginalityResult
	Legal        LegalResult
	Privacy      PrivacyResult
	Safety       AISafetyResult
	Policy       PlatformPolicyResult
	Violations   []string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type ComplianceReviewDecision struct {
	DecisionID string
	TenantID   string
	ReportID   string
	Approved   bool
	ReviewerID string
	Comments   string
	DecidedAt  time.Time
}

type ComplianceAuditRecord struct {
	RecordID          string
	TenantID          string
	PackageID         string
	CheckType         string
	ResultStatus      string
	Actor             string
	CryptographicHash string
	Timestamp         time.Time
}

type WorkflowInstanceRef struct {
	InstanceID string
	TenantID   string
	WorkflowID string
	Status     string
	Parameters map[string]string
	StartedAt  time.Time
}
