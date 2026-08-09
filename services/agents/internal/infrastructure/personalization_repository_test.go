package infrastructure

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestPostgresPersonalizationRepository_CRUDAndTenantIsolation(t *testing.T) {
	ctx := context.Background()
	repo := NewPostgresPersonalizationRepository("")
	tenantID := "tenant-repo-f6"

	// 1. Cross-tenant violations
	err := repo.SaveReaderProfile(ctx, "wrong-tenant", &domain.ReaderProfile{ReaderID: "r-1", TenantID: tenantID})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on SaveReaderProfile, got %v", err)
	}
	_, err = repo.GetReaderProfile(ctx, "", "r-1")
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on GetReaderProfile, got %v", err)
	}

	// 2. Profile CRUD
	profile := &domain.ReaderProfile{
		ReaderID:       "reader-1",
		TenantID:       tenantID,
		Preferences:    map[string]string{"theme": "dark"},
		InterestVector: []float64{0.5, 0.8},
		LastActiveAt:   time.Now(),
	}
	if err := repo.SaveReaderProfile(ctx, tenantID, profile); err != nil {
		t.Fatalf("unexpected error SaveReaderProfile: %v", err)
	}
	fetchedProf, err := repo.GetReaderProfile(ctx, tenantID, "reader-1")
	if err != nil || fetchedProf == nil {
		t.Fatalf("expected fetched profile, got err=%v", err)
	}
	if fetchedProf.Preferences["theme"] != "dark" {
		t.Errorf("expected preference theme dark, got %v", fetchedProf.Preferences["theme"])
	}

	// 3. Behavioral signals and feed CRUD
	sig := &domain.BehavioralSignal{
		SignalID:        "sig-100",
		TenantID:        tenantID,
		ReaderID:        "reader-1",
		ContentID:       "story-1",
		InteractionType: "CLICK",
		OccurredAt:      time.Now(),
	}
	if err := repo.RecordBehavioralSignal(ctx, tenantID, sig); err != nil {
		t.Fatalf("unexpected error RecordBehavioralSignal: %v", err)
	}

	feed := &domain.PersonalizedFeed{
		FeedID:      "feed-100",
		TenantID:    tenantID,
		ReaderID:    "reader-1",
		Items:       []domain.PersonalizedFeedItem{{ContentID: "story-1", RelevanceScore: 0.99}},
		GeneratedAt: time.Now(),
	}
	if err := repo.SavePersonalizedFeed(ctx, tenantID, feed); err != nil {
		t.Fatalf("unexpected error SavePersonalizedFeed: %v", err)
	}
	fetchedFeed, err := repo.GetPersonalizedFeed(ctx, tenantID, "reader-1")
	if err != nil || len(fetchedFeed.Items) != 1 {
		t.Fatalf("expected feed with 1 item, got err=%v feed=%v", err, fetchedFeed)
	}
}

func TestPostgresPersonalizationRepository_GDPRCleanup(t *testing.T) {
	ctx := context.Background()
	repo := NewPostgresPersonalizationRepository("")
	tenantID := "tenant-gdpr-f7"

	now := time.Now()
	// Add 1 fresh signal (10 days old) and 2 expired signals (100 days old, exceeding 90-day GDPR limit)
	_ = repo.RecordBehavioralSignal(ctx, tenantID, &domain.BehavioralSignal{
		SignalID:   "fresh-1",
		TenantID:   tenantID,
		OccurredAt: now.Add(-10 * 24 * time.Hour),
	})
	_ = repo.RecordBehavioralSignal(ctx, tenantID, &domain.BehavioralSignal{
		SignalID:   "expired-1",
		TenantID:   tenantID,
		OccurredAt: now.Add(-100 * 24 * time.Hour),
	})
	_ = repo.RecordBehavioralSignal(ctx, tenantID, &domain.BehavioralSignal{
		SignalID:   "expired-2",
		TenantID:   tenantID,
		OccurredAt: now.Add(-120 * 24 * time.Hour),
	})

	count, err := repo.CleanupExpiredSignals(ctx, 0) // 0 should default to 90 days
	if err != nil {
		t.Fatalf("unexpected error during cleanup: %v", err)
	}
	if count != 2 {
		t.Errorf("expected 2 expired signals cleaned up (>90 days), got %d", count)
	}
	if len(repo.signals) != 1 || repo.signals[0].SignalID != "fresh-1" {
		t.Errorf("expected only fresh-1 signal to remain, got %d signals", len(repo.signals))
	}
}
