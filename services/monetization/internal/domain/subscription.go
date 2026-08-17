package domain

import (
	"time"
)

type SubscriptionStatus string

const (
	SubscriptionStatusActive   SubscriptionStatus = "ACTIVE"
	SubscriptionStatusCanceled SubscriptionStatus = "CANCELED"
	SubscriptionStatusPastDue  SubscriptionStatus = "PAST_DUE"
	SubscriptionStatusTrialing SubscriptionStatus = "TRIALING"
	SubscriptionStatusExpired  SubscriptionStatus = "EXPIRED"
	SubscriptionStatusPending  SubscriptionStatus = "PENDING"
)

type SubscriptionPlan struct {
	PlanID          string          `json:"plan_id"`
	TenantID        string          `json:"tenant_id"`
	Name            string          `json:"name"`
	Tier            PlanTier        `json:"tier"` // FREE, PREMIUM, ENTERPRISE
	Price           float64         `json:"price"`
	Currency        string          `json:"currency"`
	BillingInterval BillingInterval `json:"billing_interval"` // MONTHLY, ANNUAL
	Features        []string        `json:"features"`
	MaxReaders      int             `json:"max_readers"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

type ReaderSubscription struct {
	SubscriptionID      string             `json:"subscription_id"`
	TenantID            string             `json:"tenant_id"`
	ReaderID            string             `json:"reader_id"` // from IMP-019 identity
	PlanID              string             `json:"plan_id"`
	Status              SubscriptionStatus `json:"status"` // ACTIVE, CANCELED, PAST_DUE, TRIALING, EXPIRED, PENDING
	CurrentPeriodStart  time.Time          `json:"current_period_start"`
	CurrentPeriodEnd    time.Time          `json:"current_period_end"`
	CancelAtPeriodEnd   bool               `json:"cancel_at_period_end"`
	PaymentMethodID     string             `json:"payment_method_id"`
	CreatedAt           time.Time          `json:"created_at"`
	UpdatedAt           time.Time          `json:"updated_at"`
}
