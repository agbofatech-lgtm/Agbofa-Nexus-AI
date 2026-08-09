package verification

import (
	"context"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// ContentVerifier defines the universal interface for all IMP-017-C Verification Agents (AGT-017 through AGT-024).
//
// Authoritative Spec Reference:
//   Arena.txt Volume 5 (Content Intelligence & Agents)
//   IMP-017-C Scope: 8 Verification Agents (Fact-Check, Cross-Reference, Source Verification,
//   Claim Extraction, Evidence Collection, Bias Detection, Misinformation Flagging, Confidence Scoring).
type ContentVerifier interface {
	// Identity & Context
	ID() string
	Name() string
	TenantID() string
	Version() string

	// Lifecycle
	Initialize(ctx context.Context, tenantID string, config map[string]string) error
	HealthCheck(ctx context.Context) (*domain.SourceHealth, error)
	Shutdown(ctx context.Context) error

	// Core Verification Capabilities
	Verify(ctx context.Context, claim *domain.Claim) (*domain.VerificationResult, error)
	Corroborate(ctx context.Context, claim *domain.Claim, sources []domain.Source) (*domain.CorroborationResult, error)
	Assess(ctx context.Context, claim *domain.Claim) (*domain.AssessmentResult, error)
}
