package domain

import (
	"testing"
	"time"
)

func TestDetectionResultProperties(t *testing.T) {
	res := &DetectionResult{
		ResultID:        "res-100",
		TenantID:        "tenant-xyz",
		SignalID:        "sig-100",
		DetectorID:      "AGT-009",
		DetectorName:    "Breaking News Detector",
		Classification:  "BREAKING_NEWS",
		ConfidenceScore: 0.95,
		Evidence: []EvidenceItem{
			{
				EvidenceID:  "ev-1",
				Type:        "VELOCITY",
				Description: "High velocity signal",
				Confidence:  0.95,
			},
		},
		DetectedAt: time.Now(),
	}

	if res.ResultID != "res-100" || res.DetectorID != "AGT-009" || res.ConfidenceScore != 0.95 {
		t.Fatalf("unexpected detection result properties")
	}
	if len(res.Evidence) != 1 || res.Evidence[0].EvidenceID != "ev-1" {
		t.Fatalf("unexpected evidence item")
	}
}

func TestEventTypeDetectionResultReadyConstant(t *testing.T) {
	if EventTypeDetectionResultReady != "EVT-020" {
		t.Fatalf("expected EVT-020, got %s", EventTypeDetectionResultReady)
	}
}
