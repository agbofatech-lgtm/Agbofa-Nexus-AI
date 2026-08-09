package domain

import (
	"time"
)

type SubscriptionCreatedEvent struct {
	EventID        string    `json:"event_id"`
	TenantID       string    `json:"tenant_id"`
	SubscriptionID string    `json:"subscription_id"`
	ReaderID       string    `json:"reader_id"`
	PlanID         string    `json:"plan_id"`
	Tier           PlanTier  `json:"tier"`
	Amount         float64   `json:"amount"`
	Currency       string    `json:"currency"`
	OccurredAt     time.Time `json:"occurred_at"`
}

type SubscriptionCanceledEvent struct {
	EventID        string    `json:"event_id"`
	TenantID       string    `json:"tenant_id"`
	SubscriptionID string    `json:"subscription_id"`
	ReaderID       string    `json:"reader_id"`
	Reason         string    `json:"reason"`
	OccurredAt     time.Time `json:"occurred_at"`
}

type PaymentSucceededEvent struct {
	EventID         string    `json:"event_id"`
	TenantID        string    `json:"tenant_id"`
	SubscriptionID  string    `json:"subscription_id"`
	Amount          float64   `json:"amount"`
	Currency        string    `json:"currency"`
	ProviderEventID string    `json:"provider_event_id"`
	OccurredAt      time.Time `json:"occurred_at"`
}

type PaymentFailedEvent struct {
	EventID        string    `json:"event_id"`
	TenantID       string    `json:"tenant_id"`
	SubscriptionID string    `json:"subscription_id"`
	Amount         float64   `json:"amount"`
	Currency       string    `json:"currency"`
	FailureReason  string    `json:"failure_reason"`
	OccurredAt     time.Time `json:"occurred_at"`
}

type AdImpressionEvent struct {
	EventID     string    `json:"event_id"`
	TenantID    string    `json:"tenant_id"`
	PlacementID string    `json:"placement_id"`
	CampaignID  string    `json:"campaign_id"`
	ReaderID    string    `json:"reader_id"`
	Revenue     float64   `json:"revenue"`
	Currency    string    `json:"currency"`
	OccurredAt  time.Time `json:"occurred_at"`
}

type AdClickEvent struct {
	EventID     string    `json:"event_id"`
	TenantID    string    `json:"tenant_id"`
	PlacementID string    `json:"placement_id"`
	CampaignID  string    `json:"campaign_id"`
	ReaderID    string    `json:"reader_id"`
	Revenue     float64   `json:"revenue"`
	Currency    string    `json:"currency"`
	OccurredAt  time.Time `json:"occurred_at"`
}

type PaywallTriggeredEvent struct {
	EventID   string        `json:"event_id"`
	TenantID  string        `json:"tenant_id"`
	ReaderID  string        `json:"reader_id"`
	ContentID string        `json:"content_id"`
	HasAccess bool          `json:"has_access"`
	Reason    PaywallReason `json:"reason"`
	OccurredAt time.Time    `json:"occurred_at"`
}

type RevenueAggregatedEvent struct {
	EventID           string        `json:"event_id"`
	TenantID          string        `json:"tenant_id"`
	Period            RevenuePeriod `json:"period"` // MONTHLY, ANNUAL
	MRR               float64       `json:"mrr"`
	ARR               float64       `json:"arr"`
	TotalRevenue      float64       `json:"total_revenue"`
	ActiveSubscribers int           `json:"active_subscribers"`
	ChurnRate         float64       `json:"churn_rate"`
	OccurredAt        time.Time     `json:"occurred_at"`
}
