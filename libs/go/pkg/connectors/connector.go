// Package connectors defines the platform connector framework for the
// Agbofa Nexus AI Distribution Engine.
//
// Each social platform implements this interface. The Distribution
// Orchestrator uses the registry to route publication jobs.
//
// IMP-DISTRIBUTION-001
package connectors

import (
"context"
"errors"
"time"
)

var (
ErrNotConfigured       = errors.New("connector not configured")
ErrNotAuthorized       = errors.New("connector authorization required")
ErrTokenExpired        = errors.New("connector token expired")
ErrPlatformUnavailable = errors.New("platform unavailable")
ErrRateLimited         = errors.New("platform rate limited")
ErrUnsupportedContent  = errors.New("content type not supported by platform")
)

// PlatformConnector is the universal interface for social platform publishing.
type PlatformConnector interface {
PlatformName() string
IsConfigured() bool
Connect(ctx context.Context, tenantID string) error
Publish(ctx context.Context, tenantID string, content PublishContent) (PublishResult, error)
GetStatus(ctx context.Context, tenantID, platformPostID string) (PostStatus, error)
Delete(ctx context.Context, tenantID, platformPostID string) error
GetAnalytics(ctx context.Context, tenantID, platformPostID string) (PostAnalytics, error)
}

// PublishContent is the universal content format for all platforms.
type PublishContent struct {
Title       string
Description string
Body        string
Tags        []string
CategoryID  string
Visibility  string
Thumbnail   []byte
VideoURL    string
Language    string
Metadata    map[string]string
}

// PublishResult is the result of a publish operation.
type PublishResult struct {
PlatformPostID string
PlatformURL    string
PublishedAt    time.Time
Status         string
RawResponse    map[string]any
}

// PostStatus represents the current state of a published post.
type PostStatus struct {
PlatformPostID string
Status         string
Views          int64
Likes          int64
Comments       int64
Shares         int64
LastCheckedAt  time.Time
}

// PostAnalytics contains engagement metrics for a post.
type PostAnalytics struct {
PlatformPostID string
Views          int64
Likes          int64
Comments       int64
Shares         int64
WatchTimeSec   int64
ClickThrough   int64
CollectedAt    time.Time
}

// Credential represents stored platform credentials.
type Credential struct {
TenantID     string
Platform     string
AccessToken  string
RefreshToken string
ExpiresAt    time.Time
Scopes       []string
}

// CredentialStore persists and retrieves platform credentials.
type CredentialStore interface {
Save(ctx context.Context, cred Credential) error
Get(ctx context.Context, tenantID, platform string) (*Credential, error)
Delete(ctx context.Context, tenantID, platform string) error
IsExpired(cred Credential) bool
}
