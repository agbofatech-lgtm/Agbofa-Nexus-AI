package domain

import (
	"time"
)

type DeliveryStatus string

const (
	DeliveryStatusScheduled DeliveryStatus = "SCHEDULED"
	DeliveryStatusDelivering DeliveryStatus = "DELIVERING"
	DeliveryStatusDelivered  DeliveryStatus = "DELIVERED"
	DeliveryStatusFailed     DeliveryStatus = "FAILED"
	DeliveryStatusRetrying   DeliveryStatus = "RETRYING"
	DeliveryStatusRetracted  DeliveryStatus = "RETRACTED"
	DeliveryStatusCorrected  DeliveryStatus = "CORRECTED"
)

type ChannelStatus struct {
	ChannelID      string
	Platform       string
	Status         DeliveryStatus
	PlatformPostID string
	ErrorMessage   string
	DeliveredAt    time.Time
}

type PublicationJob struct {
	PublicationJobID string
	TenantID         string
	PackageID        string
	StoryID          string
	Title            string
	ComplianceStatus string
	Status           DeliveryStatus
	ChannelStatuses  []ChannelStatus
	RetryCount       int
	ScheduledTime    time.Time
	PublishedAt      time.Time
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type BreakingNewsAlert struct {
	AlertID          string
	TenantID         string
	PackageID        string
	StoryID          string
	AlertText        string
	PriorityChannels []string
	Status           DeliveryStatus
	DeliveredAt      time.Time
}

type CorrectionRecord struct {
	CorrectionID     string
	TenantID         string
	PublicationJobID string
	CorrectedContent string
	CorrectionNote   string
	IssuedAt         time.Time
}

type RetractionRecord struct {
	RetractionID     string
	TenantID         string
	PublicationJobID string
	RetractionReason string
	IssuedAt         time.Time
}

type DeliveryAuditRecord struct {
	RecordID          string
	TenantID          string
	PublicationJobID  string
	Channel           string
	EventType         string
	Actor             string
	CryptographicHash string
	Timestamp         time.Time
}

type QueueHealth struct {
	QueueID         string
	TenantID        string
	Depth           int
	DeadLetterCount int
	Healthy         bool
}

type WorkflowInstanceRef struct {
	InstanceID string
	TenantID   string
	WorkflowID string
	Status     string
	Parameters map[string]string
	StartedAt  time.Time
}
