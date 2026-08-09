package domain

import (
	"time"
)

type RevenueEventType string

const (
	RevenueEventTypeSubscription RevenueEventType = "SUBSCRIPTION"
	RevenueEventTypeAdImpression RevenueEventType = "AD_IMPRESSION"
	RevenueEventTypeAdClick      RevenueEventType = "AD_CLICK"
	RevenueEventTypeRefund       RevenueEventType = "REFUND"
)

type RevenuePeriod string

const (
	RevenuePeriodMonthly RevenuePeriod = "MONTHLY"
	RevenuePeriodAnnual  RevenuePeriod = "ANNUAL"
)

type RevenueEvent struct {
	EventID    string           `json:"event_id"`
	TenantID   string           `json:"tenant_id"`
	EventType  RevenueEventType `json:"event_type"` // SUBSCRIPTION, AD_IMPRESSION, AD_CLICK, REFUND
	Amount     float64          `json:"amount"`
	Currency   string           `json:"currency"`
	RelatedID  string           `json:"related_id"` // SubscriptionID or PlacementID
	OccurredAt time.Time        `json:"occurred_at"`
}

type RevenueAggregate struct {
	TenantID            string        `json:"tenant_id"`
	Period              RevenuePeriod `json:"period"` // MONTHLY, ANNUAL
	MRR                 float64       `json:"mrr"`
	ARR                 float64       `json:"arr"`
	TotalRevenue        float64       `json:"total_revenue"`
	SubscriptionRevenue float64       `json:"subscription_revenue"`
	AdRevenue           float64       `json:"ad_revenue"`
	ActiveSubscribers   int           `json:"active_subscribers"`
	ChurnRate           float64       `json:"churn_rate"`
	LTV                 float64       `json:"ltv"`
	CAC                 float64       `json:"cac"`
	CalculatedAt        time.Time     `json:"calculated_at"`
}

type MRRData struct {
	TenantID     string    `json:"tenant_id"`
	TotalMRR     float64   `json:"total_mrr"`
	NewMRR       float64   `json:"new_mrr"`
	ExpansionMRR float64   `json:"expansion_mrr"`
	ChurnedMRR   float64   `json:"churned_mrr"`
	CalculatedAt time.Time `json:"calculated_at"`
}

type ChurnData struct {
	TenantID        string    `json:"tenant_id"`
	ChurnRate       float64   `json:"churn_rate"`
	ChurnedReaders  int       `json:"churned_readers"`
	RetainedReaders int       `json:"retained_readers"`
	CalculatedAt    time.Time `json:"calculated_at"`
}
