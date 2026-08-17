package domain

import "errors"

var (
	ErrCrossTenantViolation   = errors.New("cross-tenant access violation")
	ErrSubscriptionNotFound   = errors.New("subscription not found")
	ErrPlanNotFound           = errors.New("subscription plan not found")
	ErrAdCampaignNotFound     = errors.New("ad campaign not found")
	ErrAdPlacementNotFound    = errors.New("ad placement not found")
	ErrPaywallAccessDenied    = errors.New("paywall access denied")
	ErrPaymentFailed          = errors.New("payment processing failed")
	ErrInvalidPaymentProvider = errors.New("invalid payment provider")
)

type PlanTier string

const (
	PlanTierFree       PlanTier = "FREE"
	PlanTierPremium    PlanTier = "PREMIUM"
	PlanTierEnterprise PlanTier = "ENTERPRISE"
)

type BillingInterval string

const (
	BillingIntervalMonthly BillingInterval = "MONTHLY"
	BillingIntervalAnnual  BillingInterval = "ANNUAL"
)
