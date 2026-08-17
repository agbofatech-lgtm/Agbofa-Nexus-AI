package monitors

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type PlatformMonitorAgent struct {
	domain.BaseAgent
	platformSource domain.PlatformSource
	platformClient application.PlatformClient
	rateLimiter    application.RateLimiter
}

func NewPlatformMonitorAgent(
	agentID, agentName, tenantID string,
	platform domain.PlatformSource,
	client application.PlatformClient,
	limiter application.RateLimiter,
) *PlatformMonitorAgent {
	return &PlatformMonitorAgent{
		BaseAgent: domain.BaseAgent{
			AgentID:       agentID,
			AgentName:     agentName,
			TenantUUID:    tenantID,
			CurrentStatus: domain.AgentStatusActive,
			Version:       "1.0.0",
		},
		platformSource: platform,
		platformClient: client,
		rateLimiter:    limiter,
	}
}

func (a *PlatformMonitorAgent) Platform() domain.PlatformSource {
	return a.platformSource
}

func (a *PlatformMonitorAgent) Scan(ctx context.Context, tenantID string, keywords []string) ([]domain.MonitorSignal, error) {
	if tenantID != a.TenantUUID {
		return nil, domain.ErrCrossTenantViolation
	}
	allow, err := a.rateLimiter.Allow(ctx, a.platformSource, tenantID)
	if err != nil {
		return nil, err
	}
	if !allow {
		return nil, domain.ErrRateLimitExceeded
	}

	var signals []domain.MonitorSignal
	err = domain.RetryWithBackoff(ctx, func() error {
		var fetchErr error
		signals, fetchErr = a.platformClient.FetchSignals(ctx, tenantID, a.platformSource, keywords)
		return fetchErr
	})
	if err != nil {
		a.CurrentStatus = domain.AgentStatusError
		return nil, fmt.Errorf("scan failed on platform %s: %w", a.platformSource, err)
	}
	return signals, nil
}

func (a *PlatformMonitorAgent) GetRateLimitStatus(ctx context.Context) (int, error) {
	return a.rateLimiter.Remaining(ctx, a.platformSource, a.TenantUUID)
}

func (a *PlatformMonitorAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	if a.CurrentStatus == domain.AgentStatusSuspended {
		return domain.ErrAgentNotAuthorized
	}
	a.CurrentStatus = domain.AgentStatusActive
	_ = executionContext["trigger"]
	return nil
}

// Concrete agent constructors for AGT-001 through AGT-008
func NewTwitterMonitor(tenantID string, client application.PlatformClient, limiter application.RateLimiter) *PlatformMonitorAgent {
	return NewPlatformMonitorAgent("AGT-001", "Twitter/X Monitor", tenantID, domain.PlatformTwitter, client, limiter)
}

func NewFacebookMonitor(tenantID string, client application.PlatformClient, limiter application.RateLimiter) *PlatformMonitorAgent {
	return NewPlatformMonitorAgent("AGT-002", "Facebook Monitor", tenantID, domain.PlatformFacebook, client, limiter)
}

func NewInstagramMonitor(tenantID string, client application.PlatformClient, limiter application.RateLimiter) *PlatformMonitorAgent {
	return NewPlatformMonitorAgent("AGT-003", "Instagram Monitor", tenantID, domain.PlatformInstagram, client, limiter)
}

func NewTikTokMonitor(tenantID string, client application.PlatformClient, limiter application.RateLimiter) *PlatformMonitorAgent {
	return NewPlatformMonitorAgent("AGT-004", "TikTok Monitor", tenantID, domain.PlatformTikTok, client, limiter)
}

func NewLinkedInMonitor(tenantID string, client application.PlatformClient, limiter application.RateLimiter) *PlatformMonitorAgent {
	return NewPlatformMonitorAgent("AGT-005", "LinkedIn Monitor", tenantID, domain.PlatformLinkedIn, client, limiter)
}

func NewYouTubeMonitor(tenantID string, client application.PlatformClient, limiter application.RateLimiter) *PlatformMonitorAgent {
	return NewPlatformMonitorAgent("AGT-006", "YouTube Monitor", tenantID, domain.PlatformYouTube, client, limiter)
}

func NewRedditMonitor(tenantID string, client application.PlatformClient, limiter application.RateLimiter) *PlatformMonitorAgent {
	return NewPlatformMonitorAgent("AGT-007", "Reddit Monitor", tenantID, domain.PlatformReddit, client, limiter)
}

func NewEmergingMonitor(tenantID string, client application.PlatformClient, limiter application.RateLimiter) *PlatformMonitorAgent {
	return NewPlatformMonitorAgent("AGT-008", "Emerging Platforms Monitor", tenantID, domain.PlatformEmerging, client, limiter)
}

func CreateAllMonitors(tenantID string, client application.PlatformClient, limiter application.RateLimiter) map[string]*PlatformMonitorAgent {
	m := make(map[string]*PlatformMonitorAgent, 8)
	monitors := []*PlatformMonitorAgent{
		NewTwitterMonitor(tenantID, client, limiter),
		NewFacebookMonitor(tenantID, client, limiter),
		NewInstagramMonitor(tenantID, client, limiter),
		NewTikTokMonitor(tenantID, client, limiter),
		NewLinkedInMonitor(tenantID, client, limiter),
		NewYouTubeMonitor(tenantID, client, limiter),
		NewRedditMonitor(tenantID, client, limiter),
		NewEmergingMonitor(tenantID, client, limiter),
	}
	for _, mon := range monitors {
		m[mon.ID()] = mon
		_ = time.Now()
	}
	return m
}
