package domain

import (
	"context"
	"time"
)

type EvidenceItem struct {
	EvidenceID  string            `json:"evidence_id"`
	Type        string            `json:"type"`
	Description string            `json:"description"`
	SourceURL   string            `json:"source_url"`
	Confidence  float64           `json:"confidence"`
	Metadata    map[string]string `json:"metadata"`
}

type DetectionResult struct {
	ResultID        string            `json:"result_id"`
	TenantID        string            `json:"tenant_id"`
	SignalID        string            `json:"signal_id"`
	DetectorID      string            `json:"detector_id"`
	DetectorName    string            `json:"detector_name"`
	Classification  string            `json:"classification"`
	ConfidenceScore float64           `json:"confidence_score"`
	Evidence        []EvidenceItem    `json:"evidence"`
	DetectedAt      time.Time         `json:"detected_at"`
	Metadata        map[string]string `json:"metadata"`
}

type SourceCredibilityScore struct {
	SourceID        string         `json:"source_id"`
	TenantID        string         `json:"tenant_id"`
	Platform        PlatformSource `json:"platform"`
	TrustScore      float64        `json:"trust_score"`
	HistoryRating   string         `json:"history_rating"`
	LastEvaluatedAt time.Time      `json:"last_evaluated_at"`
}

type DetectorAgent interface {
	Agent
	Detect(ctx context.Context, signal MonitorSignal) (*DetectionResult, error)
	Confidence() float64
	Evidence() []EvidenceItem
}
