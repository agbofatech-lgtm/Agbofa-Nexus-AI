package domain

import (
	"context"
	"time"
)

type ProviderType string

const (
	ProviderTypeStripe   ProviderType = "STRIPE"
	ProviderTypePaystack ProviderType = "PAYSTACK"
)

type PaymentIntent struct {
	PaymentIntentID string            `json:"payment_intent_id"`
	TenantID        string            `json:"tenant_id"`
	Amount          float64           `json:"amount"`
	Currency        string            `json:"currency"`
	Status          string            `json:"status"` // PENDING, SUCCEEDED, FAILED
	ClientSecret    string            `json:"client_secret,omitempty"`
	Metadata        map[string]string `json:"metadata"`
	CreatedAt       time.Time         `json:"created_at"`
}

type PaymentVerification struct {
	PaymentIntentID string    `json:"payment_intent_id"`
	TenantID        string    `json:"tenant_id"`
	Status          string    `json:"status"` // SUCCEEDED, FAILED
	Amount          float64   `json:"amount"`
	Currency        string    `json:"currency"`
	VerifiedAt      time.Time `json:"verified_at"`
}

type PaymentMethod struct {
	MethodID     string       `json:"method_id"`
	TenantID     string       `json:"tenant_id"`
	ReaderID     string       `json:"reader_id"`
	ProviderType ProviderType `json:"provider_type"` // STRIPE, PAYSTACK
	LastFour     string       `json:"last_four"`     // Never full PAN
	ExpiryMonth  int          `json:"expiry_month"`
	ExpiryYear   int          `json:"expiry_year"`
	IsDefault    bool         `json:"is_default"`
	CreatedAt    time.Time    `json:"created_at"`
}

type PaymentEvent struct {
	EventID         string    `json:"event_id"`
	TenantID        string    `json:"tenant_id"`
	ProviderEventID string    `json:"provider_event_id"`
	EventType       string    `json:"event_type"`
	Amount          float64   `json:"amount"`
	Currency        string    `json:"currency"`
	SubscriptionID  string    `json:"subscription_id"`
	RawPayload      []byte    `json:"raw_payload"`
	ProcessedAt     time.Time `json:"processed_at"`
}

type PaymentProvider interface {
	InitializePayment(ctx context.Context, tenantID string, amount float64, currency string, metadata map[string]string) (*PaymentIntent, error)
	VerifyPayment(ctx context.Context, tenantID, paymentIntentID string) (*PaymentVerification, error)
	CreateCustomer(ctx context.Context, tenantID, readerID, email string, metadata map[string]string) (string, error)
	CreateSubscription(ctx context.Context, tenantID, customerID, planID string) (string, error)
	CancelSubscription(ctx context.Context, tenantID, subscriptionID string) error
	ProcessWebhook(ctx context.Context, tenantID string, payload []byte, signature string) (*PaymentEvent, error)
}
