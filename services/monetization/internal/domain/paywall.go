package domain

import (
	"time"
)

type PaywallReason string

const (
	PaywallReasonSubscribed  PaywallReason = "SUBSCRIBED"
	PaywallReasonMeteredFree PaywallReason = "METERED_FREE"
	PaywallReasonPremiumOnly PaywallReason = "PREMIUM_ONLY"
	PaywallReasonExpired     PaywallReason = "EXPIRED"
)

type PaywallEntitlement struct {
	TenantID     string        `json:"tenant_id"`
	ReaderID     string        `json:"reader_id"`
	ContentID    string        `json:"content_id"`
	HasAccess    bool          `json:"has_access"`
	Reason       PaywallReason `json:"reason"` // SUBSCRIBED, METERED_FREE, PREMIUM_ONLY, EXPIRED
	MeteredCount int           `json:"metered_count"`
	MeteredLimit int           `json:"metered_limit"`
	CheckedAt    time.Time     `json:"checked_at"`
}

type MeteredAccess struct {
	TenantID     string    `json:"tenant_id"`
	ReaderID     string    `json:"reader_id"`
	MeteredCount int       `json:"metered_count"`
	MeteredLimit int       `json:"metered_limit"`
	WindowStart  time.Time `json:"window_start"`
	WindowEnd    time.Time `json:"window_end"`
}

type EntitlementCheck struct {
	TenantID   string        `json:"tenant_id"`
	ReaderID   string        `json:"reader_id"`
	ContentID  string        `json:"content_id"`
	IsPremium  bool          `json:"is_premium"`
	HasAccess  bool          `json:"has_access"`
	Reason     PaywallReason `json:"reason"`
	CheckedAt  time.Time     `json:"checked_at"`
}
