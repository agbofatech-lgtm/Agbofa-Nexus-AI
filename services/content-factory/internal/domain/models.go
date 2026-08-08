package domain

import (
	"time"
)

type PackageStatus string

const (
	PackageStatusDraft          PackageStatus = "DRAFT"
	PackageStatusQAPassed       PackageStatus = "QA_PASSED"
	PackageStatusReviewRequired PackageStatus = "REVIEW_REQUIRED"
	PackageStatusApproved       PackageStatus = "APPROVED"
	PackageStatusRejected       PackageStatus = "REJECTED"
)

type ContentPackage struct {
	PackageID    string
	TenantID     string
	StoryID      string
	Title        string
	Summary      string
	Status       PackageStatus
	BrandVoiceID string
	Articles     []ArticleAsset
	Media        []MultimediaAsset
	Social       []SocialAsset
	QAReport     QAReport
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type ArticleAsset struct {
	AssetID        string
	TenantID       string
	PackageID      string
	Headline       string
	BodyText       string
	SEOTitle       string
	SEODescription string
	Language       string
}

type MultimediaAsset struct {
	AssetID     string
	TenantID    string
	PackageID   string
	AssetType   string // AUDIO_SCRIPT, VIDEO_SCRIPT, INFOGRAPHIC_SPEC
	ContentSpec string
}

type SocialAsset struct {
	AssetID   string
	TenantID  string
	PackageID string
	Platform  string // TWITTER, LINKEDIN, INSTAGRAM
	PostText  string
}

type QAReport struct {
	QAID                string
	TenantID            string
	PackageID           string
	OverallQualityScore float64
	Passed              bool
	FlaggedIssues       []string
	EvaluatedAt         time.Time
}

type ReviewDecision struct {
	DecisionID string
	TenantID   string
	PackageID  string
	Approved   bool
	ReviewerID string
	Comments   string
	DecidedAt  time.Time
}

type BrandVoiceProfile struct {
	BrandVoiceID string
	TenantID     string
	Name         string
	Tone         string
	StyleRules   []string
}

type WorkflowInstanceRef struct {
	InstanceID string
	TenantID   string
	WorkflowID string
	Status     string
	Parameters map[string]string
	StartedAt  time.Time
}
