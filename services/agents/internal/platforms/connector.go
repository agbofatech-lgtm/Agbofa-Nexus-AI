package platforms

import (
	"context"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type ContentType string

const (
	ContentTypeText  ContentType = "TEXT"
	ContentTypeImage ContentType = "IMAGE"
	ContentTypeVideo ContentType = "VIDEO"
	ContentTypeAudio ContentType = "AUDIO"
)

type ConnectorConfig map[string]string

type PlatformContent struct {
	PostID   string            `json:"post_id"`
	Content  string            `json:"content"`
	TenantID string            `json:"tenant_id"`
	Platform string            `json:"platform"`
	Metadata map[string]string `json:"metadata"`
}

type PublishResult struct {
	PostID string `json:"post_id"`
	Status string `json:"status"`
	URL    string `json:"url"`
}

type PostStatus struct {
	PostID  string         `json:"post_id"`
	Status  string         `json:"status"`
	Metrics map[string]int `json:"metrics"`
}

// PlatformConnector defines the universal interface for all platform connectors.
//
// Authoritative Spec Quotation:
// Source: Arena.txt, Volume 20 (4.3.2 Connector Core Interface), lines 136700-136735
// Quote:
// "type PlatformConnector interface {
//     // Identity
//     PlatformName() string
//     ConnectorVersion() string
//     SupportedContentTypes() []ContentType
//
//     // Lifecycle
//     Initialize(ctx context.Context, config ConnectorConfig) error
//     HealthCheck(ctx context.Context) (*HealthStatus, error)
//     Shutdown(ctx context.Context) error
//
//     // Publishing
//     Publish(ctx context.Context, content *PlatformContent) (*PublishResult, error)
//     Update(ctx context.Context, platformPostID string, content *PlatformContent) (*PublishResult, error)
//     Delete(ctx context.Context, platformPostID string) error
//     GetStatus(ctx context.Context, platformPostID string) (*PostStatus, error)
// }"
type PlatformConnector interface {
	PlatformName() string
	ConnectorVersion() string
	SupportedContentTypes() []ContentType

	Initialize(ctx context.Context, config ConnectorConfig) error
	HealthCheck(ctx context.Context) (*domain.SourceHealth, error)
	Shutdown(ctx context.Context) error

	Publish(ctx context.Context, content *PlatformContent) (*PublishResult, error)
	Update(ctx context.Context, platformPostID string, content *PlatformContent) (*PublishResult, error)
	Delete(ctx context.Context, platformPostID string) error
	GetStatus(ctx context.Context, platformPostID string) (*PostStatus, error)
}
