package domain

import (
	"time"
)

// SourceType defines the classification of news gathering input sources
// per Arena.txt Volume 22 (Agent Catalogue) and Volume 25 (13.1.2 Source Intelligence Layer).
type SourceType string

const (
	SourceTypeSocial    SourceType = "SOCIAL"
	SourceTypeWire      SourceType = "WIRE"
	SourceTypeWeb       SourceType = "WEB"
	SourceTypeBroadcast SourceType = "BROADCAST"
	SourceTypeSensor    SourceType = "SENSOR"
	SourceTypeRSS       SourceType = "RSS"
)

// SourceConfig holds initialization and runtime configuration for a news gathering source.
//
// Authoritative Spec Reference:
//   Arena.txt, Volume 25, lines 162580-162618 (SourceConnector.Initialize)
type SourceConfig struct {
	SourceID            string            `json:"source_id"`
	TenantID            string            `json:"tenant_id"`
	SourceType          SourceType        `json:"source_type"`
	Name                string            `json:"name"`
	URL                 string            `json:"url"`
	APIKey              string            `json:"api_key,omitempty"`
	PollIntervalSeconds int               `json:"poll_interval_seconds"`
	Metadata            map[string]string `json:"metadata"`
}

// SourceHealth reports the operational status of an active source connector.
//
// Authoritative Spec Reference:
//   Arena.txt, Volume 25, lines 162580-162618 (SourceConnector.HealthCheck)
type SourceHealth struct {
	SourceID     string    `json:"source_id"`
	TenantID     string    `json:"tenant_id"`
	Status       string    `json:"status"` // ONLINE, OFFLINE, DEGRADED
	LastCheckAt  time.Time `json:"last_check_at"`
	ErrorMessage string    `json:"error_message,omitempty"`
	LatencyMs    int64     `json:"latency_ms"`
}

// FetchOptions defines query parameters for fetching raw source documents.
//
// Authoritative Spec Reference:
//   Arena.txt, Volume 25, lines 162580-162618 (SourceConnector.Fetch)
type FetchOptions struct {
	TenantID string    `json:"tenant_id"`
	SourceID string    `json:"source_id"`
	Keywords []string  `json:"keywords"`
	Limit    int       `json:"limit"`
	Since    time.Time `json:"since"`
}

// RawDocument represents a single unstructured item retrieved from a monitor source.
type RawDocument struct {
	DocID       string            `json:"doc_id"`
	TenantID    string            `json:"tenant_id"`
	SourceID    string            `json:"source_id"`
	URL         string            `json:"url"`
	Author      string            `json:"author"`
	Content     string            `json:"content"`
	Language    string            `json:"language"`
	PublishedAt time.Time         `json:"published_at"`
	Metadata    map[string]string `json:"metadata"`
}

// FetchResult packages the retrieved raw documents and telemetry from a Fetch execution.
type FetchResult struct {
	TenantID  string         `json:"tenant_id"`
	SourceID  string         `json:"source_id"`
	Documents []*RawDocument `json:"documents"`
	FetchedAt time.Time      `json:"fetched_at"`
	Count     int            `json:"count"`
}
