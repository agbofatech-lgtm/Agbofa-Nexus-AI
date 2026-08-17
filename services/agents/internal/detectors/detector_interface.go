package detectors

import (
	"context"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// ContentDetector defines the universal interface for all IMP-017-B Content Detectors (AGT-009 to AGT-016).
//
// Authoritative Spec Reference:
//   Arena.txt Volume 5 (Content Intelligence & Agents)
//   IMP-017-B Scope: 8 Content Detector Agents (Breaking News, Trend Identifier, Sentiment,
//   Source Credibility, Multimedia, Language/Locale, Duplicate/Plagiarism, Virality Predictor).
type ContentDetector interface {
	// Identity & Context
	ID() string
	Name() string
	TenantID() string
	Version() string

	// Lifecycle
	Initialize(ctx context.Context, tenantID string, config map[string]string) error
	HealthCheck(ctx context.Context) (*domain.SourceHealth, error)
	Shutdown(ctx context.Context) error

	// Core Detection Capabilities
	Detect(ctx context.Context, signal *domain.MonitorSignal) (*domain.DetectionResult, error)
	Analyze(ctx context.Context, signal *domain.MonitorSignal) (*domain.DetectionResult, error)
	Classify(ctx context.Context, signal *domain.MonitorSignal) (string, float64, []domain.EvidenceItem, error)
}
