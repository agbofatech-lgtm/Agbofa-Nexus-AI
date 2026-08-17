package domain

import (
	"time"
)

type CampaignStatus string

const (
	CampaignStatusDraft     CampaignStatus = "DRAFT"
	CampaignStatusActive    CampaignStatus = "ACTIVE"
	CampaignStatusPaused    CampaignStatus = "PAUSED"
	CampaignStatusCompleted CampaignStatus = "COMPLETED"
)

type PlacementType string

const (
	PlacementTypeBanner    PlacementType = "BANNER"
	PlacementTypeNative    PlacementType = "NATIVE"
	PlacementTypeSponsored PlacementType = "SPONSORED"
	PlacementTypeVideo     PlacementType = "VIDEO"
)

type AdvertiserConstraints struct {
	ExcludedTopics   []string `json:"excluded_topics"`
	ExcludedKeywords []string `json:"excluded_keywords"`
	MinBrandSafety   float64  `json:"min_brand_safety"`
	MaxDailySpend    float64  `json:"max_daily_spend"`
}

type AdCampaign struct {
	CampaignID      string                `json:"campaign_id"`
	TenantID        string                `json:"tenant_id"`
	AdvertiserID    string                `json:"advertiser_id"`
	Name            string                `json:"name"`
	Budget          float64               `json:"budget"`
	Currency        string                `json:"currency"`
	StartDate       time.Time             `json:"start_date"`
	EndDate         time.Time             `json:"end_date"`
	TargetPlatforms []string              `json:"target_platforms"`
	TargetTopics    []string              `json:"target_topics"`
	Constraints     AdvertiserConstraints `json:"constraints"`
	Status          CampaignStatus        `json:"status"` // DRAFT, ACTIVE, PAUSED, COMPLETED
}

type AdPlacement struct {
	PlacementID   string        `json:"placement_id"`
	TenantID      string        `json:"tenant_id"`
	CampaignID    string        `json:"campaign_id"`
	ContentID     string        `json:"content_id"`
	Platform      string        `json:"platform"`
	PlacementType PlacementType `json:"placement_type"` // BANNER, NATIVE, SPONSORED, VIDEO
	CPM           float64       `json:"cpm"`
	CPC           float64       `json:"cpc"`
	Status        string        `json:"status"`
	CreatedAt     time.Time     `json:"created_at"`
}

type AdImpression struct {
	ImpressionID string     `json:"impression_id"`
	TenantID     string     `json:"tenant_id"`
	PlacementID  string     `json:"placement_id"`
	ReaderID     string     `json:"reader_id"`
	ServedAt     time.Time  `json:"served_at"`
	Clicked      bool       `json:"clicked"`
	ClickedAt    *time.Time `json:"clicked_at,omitempty"`
	Revenue      float64    `json:"revenue"`
	Currency     string     `json:"currency"`
}
