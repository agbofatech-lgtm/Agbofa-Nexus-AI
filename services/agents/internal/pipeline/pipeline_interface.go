package pipeline

import (
	"context"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// PipelineOperator defines the universal interface for all IMP-017-D Pipeline Agents (AGT-025 through AGT-032).
//
// Authoritative Spec Reference:
//   Arena.txt Volume 5 (Content Intelligence & Agents)
//   IMP-017-D Scope: 8 Pipeline Agents (Content Ingestion Orchestrator, Story Graph Updater,
//   Factory Intake Router, Compliance Pre-Checker, Content Distribution Orchestrator,
//   Analytics & Performance Collector, Feedback & Adaptation Engine, Enterprise Operations Coordinator).
type PipelineOperator interface {
	ID() string
	Name() string
	TenantID() string
	Version() string

	Initialize(ctx context.Context, tenantID string, config map[string]string) error
	HealthCheck(ctx context.Context) (*domain.SourceHealth, error)
	Shutdown(ctx context.Context) error

	Operate(ctx context.Context, payload *domain.PipelinePayload) (*domain.PipelineResult, error)
	Route(ctx context.Context, payload *domain.PipelinePayload) (string, error)
	Report(ctx context.Context, payload *domain.PipelinePayload) (*domain.PipelineReport, error)
}
