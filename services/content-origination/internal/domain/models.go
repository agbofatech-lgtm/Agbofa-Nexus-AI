package domain

import (
	"time"
)

type SourceType string

const (
	SourceTypeRSS    SourceType = "RSS"
	SourceTypeAPI    SourceType = "API"
	SourceTypeScrape SourceType = "SCRAPE"
	SourceTypeManual SourceType = "MANUAL"
)

type SourceEntity struct {
	SourceID         string
	TenantID         string
	Name             string
	SourceType       SourceType
	ReliabilityScore float64
	Active           bool
	VectorEmbedding  []float32
	CreatedAt        time.Time
}

type IngestStatus string

const (
	IngestStatusReceived   IngestStatus = "RECEIVED"
	IngestStatusNormalized IngestStatus = "NORMALIZED"
	IngestStatusFailed     IngestStatus = "FAILED"
)

type IngestJob struct {
	IngestJobID    string
	TenantID       string
	SourceID       string
	SourceType     SourceType
	RawContent     string
	NormalizedText string
	Status         IngestStatus
	ErrorMsg       string
	CreatedAt      time.Time
}

type StoryCandidate struct {
	CandidateID     string
	TenantID        string
	IngestJobID     string
	Title           string
	Summary         string
	ConfidenceScore float64
	Keywords        []string
	DetectedAt      time.Time
}

type StoryState string

const (
	StoryStateIngested                StoryState = "INGESTED"
	StoryStateDetected                StoryState = "DETECTED"
	StoryStateIdeaGenerated           StoryState = "IDEA_GENERATED"
	StoryStatePitched                 StoryState = "PITCHED"
	StoryStateSubmittedForVerification StoryState = "SUBMITTED_FOR_VERIFICATION"
	StoryStateRejected                StoryState = "REJECTED"
)

type OriginationStory struct {
	StoryID     string
	TenantID    string
	CandidateID string
	SourceID    string
	Title       string
	Summary     string
	State       StoryState
	GraphNodeID string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type GraphNodeRef struct {
	NodeID        string
	TenantID      string
	StoryID       string
	Title         string
	SourceID      string
	InitializedAt time.Time
}

type WorkflowInstanceRef struct {
	InstanceID string
	TenantID   string
	WorkflowID string
	Status     string
	Parameters map[string]string
	StartedAt  time.Time
}
