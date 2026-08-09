package domain

import (
	"context"
	"time"
)

type AgentStatus string

const (
	AgentStatusActive    AgentStatus = "ACTIVE"
	AgentStatusIdle      AgentStatus = "IDLE"
	AgentStatusSuspended AgentStatus = "SUSPENDED"
	AgentStatusError     AgentStatus = "ERROR"
)

type Agent interface {
	ID() string
	Name() string
	TenantID() string
	Status() AgentStatus
	Execute(ctx context.Context, executionContext map[string]string) error
}

type MonitorAgent interface {
	Agent
	Platform() PlatformSource
	Scan(ctx context.Context, tenantID string, keywords []string) ([]MonitorSignal, error)
	GetRateLimitStatus(ctx context.Context) (int, error)
}

type BaseAgent struct {
	AgentID      string      `json:"agent_id"`
	AgentName    string      `json:"agent_name"`
	TenantUUID   string      `json:"tenant_id"`
	CurrentStatus AgentStatus `json:"status"`
	Version      string      `json:"version"`
}

func (b *BaseAgent) ID() string {
	return b.AgentID
}

func (b *BaseAgent) Name() string {
	return b.AgentName
}

func (b *BaseAgent) TenantID() string {
	return b.TenantUUID
}

func (b *BaseAgent) Status() AgentStatus {
	return b.CurrentStatus
}

type MonitorSignal struct {
	SignalID     string         `json:"signal_id"`
	TenantID     string         `json:"tenant_id"`
	Platform     PlatformSource `json:"platform"`
	SourceID     string         `json:"source_id"`
	Author       string         `json:"author"`
	Content      string         `json:"content"`
	URL          string         `json:"url"`
	Engagement   int            `json:"engagement"`
	Velocity     float64        `json:"velocity"`
	DetectedAt   time.Time      `json:"detected_at"`
	Metadata     map[string]string `json:"metadata"`
}

type TrendingTopic struct {
	TopicID      string         `json:"topic_id"`
	TenantID     string         `json:"tenant_id"`
	Keyword      string         `json:"keyword"`
	Platform     PlatformSource `json:"platform"`
	Score        float64        `json:"score"`
	MentionCount int            `json:"mention_count"`
	FirstSeenAt  time.Time      `json:"first_seen_at"`
	LastSeenAt   time.Time      `json:"last_seen_at"`
}
