package application

import (
	"context"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// SourceConnector defines the universal interface for all source connectors.
//
// Authoritative Spec Quotation:
// Source: Arena.txt, Volume 25 (13.1.2 Source Intelligence Layer), lines 162580-162618
// Quote:
// "type SourceConnector interface {
//     // Identity
//     ID() string
//     Name() string
//     SourceType() SourceType
//     Version() string
//
//     // Lifecycle
//     Initialize(ctx context.Context, config SourceConfig) error
//     HealthCheck(ctx context.Context) (*SourceHealth, error)
//     Shutdown(ctx context.Context) error
//
//     // Data Fetching
//     Fetch(ctx context.Context, opts FetchOptions) (*FetchResult, error)
//     StreamResults(ctx context.Context) (<-chan *RawDocument, error) // For real-time sources
//
//     // Capabilities
//     SupportsStreaming() bool
//     SupportsScheduling() bool
// }"
type SourceConnector interface {
	// Identity
	ID() string
	Name() string
	SourceType() domain.SourceType
	Version() string

	// Lifecycle
	Initialize(ctx context.Context, config domain.SourceConfig) error
	HealthCheck(ctx context.Context) (*domain.SourceHealth, error)
	Shutdown(ctx context.Context) error

	// Data Fetching
	Fetch(ctx context.Context, opts domain.FetchOptions) (*domain.FetchResult, error)
	StreamResults(ctx context.Context) (<-chan *domain.RawDocument, error)

	// Capabilities
	SupportsStreaming() bool
	SupportsScheduling() bool
}
