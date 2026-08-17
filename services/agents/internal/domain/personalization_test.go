package domain

import (
	"testing"
	"time"
)

func TestPersonalizationDomainTypes(t *testing.T) {
	profile := &ReaderProfile{
		ReaderID: "reader-100",
		TenantID: "tenant-pers",
		Preferences: map[string]string{
			"category": "news",
		},
		InterestVector: []float64{0.8, 0.2, 0.5},
		LastActiveAt:   time.Now(),
	}
	if profile.ReaderID != "reader-100" || len(profile.InterestVector) != 3 {
		t.Fatalf("unexpected reader profile properties")
	}

	sig := &BehavioralSignal{
		SignalID:        "sig-pers-1",
		TenantID:        "tenant-pers",
		ReaderID:        "reader-100",
		ContentID:       "cnt-200",
		InteractionType: "CLICK",
		DurationMs:      4500,
		Weight:          1.0,
		OccurredAt:      time.Now(),
	}
	if sig.InteractionType != "CLICK" || sig.Weight != 1.0 {
		t.Fatalf("unexpected behavioral signal properties")
	}

	feed := &PersonalizedFeed{
		FeedID:   "feed-1",
		TenantID: "tenant-pers",
		ReaderID: "reader-100",
		Items: []PersonalizedFeedItem{
			{
				ItemID:         "item-1",
				TenantID:       "tenant-pers",
				ReaderID:       "reader-100",
				ContentID:      "cnt-200",
				RelevanceScore: 0.94,
				Strategy:       "COLLABORATIVE_FILTERING",
				Reason:         "Similar readers engaged with this story",
			},
		},
		GeneratedAt: time.Now(),
	}
	if len(feed.Items) != 1 || feed.Items[0].RelevanceScore != 0.94 {
		t.Fatalf("unexpected personalized feed item properties")
	}

	model := &RecommendationModel{
		ModelID:  "mod-rec-1",
		TenantID: "tenant-pers",
		Name:     "Hybrid-Recommender-v1",
		Weights: map[string]float64{
			"collaborative": 0.40,
			"semantic":      0.45,
			"virality":      0.15,
		},
	}
	if model.Weights["virality"] != 0.15 {
		t.Fatalf("unexpected recommendation model weights")
	}
}

func TestPersonalizationEventConstants(t *testing.T) {
	if EventTypeBehavioralSignalRecorded != "EVT-040" {
		t.Fatalf("expected EVT-040, got %s", EventTypeBehavioralSignalRecorded)
	}
	if EventTypePersonalizedFeedGenerated != "EVT-041" {
		t.Fatalf("expected EVT-041, got %s", EventTypePersonalizedFeedGenerated)
	}
	if EventTypePreferenceModelUpdated != "EVT-042" {
		t.Fatalf("expected EVT-042, got %s", EventTypePreferenceModelUpdated)
	}
}
