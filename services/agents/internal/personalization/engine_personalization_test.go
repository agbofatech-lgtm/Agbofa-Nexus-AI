package personalization

import (
	"context"
	"errors"
	"math"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockPersonalizationRepository struct {
	profiles map[string]*domain.ReaderProfile
	signals  []*domain.BehavioralSignal
	feeds    map[string]*domain.PersonalizedFeed
}

func newMockRepo() *mockPersonalizationRepository {
	return &mockPersonalizationRepository{
		profiles: make(map[string]*domain.ReaderProfile),
		feeds:    make(map[string]*domain.PersonalizedFeed),
	}
}

func (m *mockPersonalizationRepository) SaveReaderProfile(ctx context.Context, tenantID string, profile *domain.ReaderProfile) error {
	if profile.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}
	m.profiles[profile.ReaderID] = profile
	return nil
}

func (m *mockPersonalizationRepository) GetReaderProfile(ctx context.Context, tenantID, readerID string) (*domain.ReaderProfile, error) {
	p, ok := m.profiles[readerID]
	if !ok {
		return nil, errors.New("profile not found")
	}
	if p.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return p, nil
}

func (m *mockPersonalizationRepository) RecordBehavioralSignal(ctx context.Context, tenantID string, signal *domain.BehavioralSignal) error {
	if signal.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}
	m.signals = append(m.signals, signal)
	return nil
}

func (m *mockPersonalizationRepository) SavePersonalizedFeed(ctx context.Context, tenantID string, feed *domain.PersonalizedFeed) error {
	if feed.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}
	m.feeds[feed.ReaderID] = feed
	return nil
}

func (m *mockPersonalizationRepository) GetPersonalizedFeed(ctx context.Context, tenantID, readerID string) (*domain.PersonalizedFeed, error) {
	f, ok := m.feeds[readerID]
	if !ok {
		return nil, errors.New("feed not found")
	}
	if f.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return f, nil
}

func (m *mockPersonalizationRepository) CleanupExpiredSignals(ctx context.Context, maxAge time.Duration) (int, error) {
	return 0, nil
}

func TestReaderFeedGenerationEngine(t *testing.T) {
	ctx := context.Background()
	tenantID := "tenant-alpha"
	repo := newMockRepo()

	e := NewReaderFeedGenerationEngine(tenantID, repo)

	if e.ID() != "PERS-001" {
		t.Errorf("expected ID PERS-001, got %s", e.ID())
	}
	if e.Name() != "Reader Feed Generation Engine" {
		t.Errorf("expected Name 'Reader Feed Generation Engine', got %s", e.Name())
	}
	if e.TenantID() != tenantID {
		t.Errorf("expected TenantID %s, got %s", tenantID, e.TenantID())
	}

	// 1. Cross-tenant violation
	_, err := e.ExecutePersonalization(ctx, map[string]string{
		"tenant_id": "other-tenant",
		"reader_id": "r-001",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	// 2. Fall back to trending recommendations when reader profile is missing
	res, err := e.ExecutePersonalization(ctx, map[string]string{
		"tenant_id": tenantID,
		"reader_id": "nonexistent-reader",
		"limit":     "5",
	})
	if err != nil {
		t.Fatalf("unexpected error on execute: %v", err)
	}
	feed, ok := res.(*domain.PersonalizedFeed)
	if !ok || feed == nil {
		t.Fatalf("expected *domain.PersonalizedFeed, got %T", res)
	}
	if len(feed.Items) != 5 {
		t.Fatalf("expected 5 items, got %d", len(feed.Items))
	}
	if feed.Items[0].Strategy != "TrendingBoost" {
		t.Errorf("expected TrendingBoost fallback strategy, got %s", feed.Items[0].Strategy)
	}

	// 3. Personalized feed generation when profile exists
	_ = repo.SaveReaderProfile(ctx, tenantID, &domain.ReaderProfile{
		ReaderID: "reader-100",
		TenantID: tenantID,
	})
	resPers, err := e.ExecutePersonalization(ctx, map[string]string{
		"tenant_id": tenantID,
		"reader_id": "reader-100",
		"limit":     "3",
	})
	if err != nil {
		t.Fatalf("unexpected error on execute pers: %v", err)
	}
	feedPers, _ := resPers.(*domain.PersonalizedFeed)
	if len(feedPers.Items) != 3 {
		t.Fatalf("expected 3 items, got %d", len(feedPers.Items))
	}
	if feedPers.Items[0].Strategy != "PersonalizedRelevance" {
		t.Errorf("expected PersonalizedRelevance strategy, got %s", feedPers.Items[0].Strategy)
	}
}

func TestRecommendationEngine_MultiStrategyBlending(t *testing.T) {
	ctx := context.Background()
	tenantID := "tenant-beta"
	repo := newMockRepo()

	e := NewRecommendationEngine(tenantID, repo)

	if e.ID() != "PERS-002" {
		t.Errorf("expected ID PERS-002, got %s", e.ID())
	}
	if len(e.strategies) != 6 {
		t.Fatalf("expected 6 strategies matching Arena.txt spec, got %d", len(e.strategies))
	}

	// Check strategies and weights sum to 1.0
	totalWeight := 0.0
	for _, s := range e.strategies {
		totalWeight += s.GetWeight()
	}
	if math.Abs(totalWeight-1.0) > 1e-6 {
		t.Errorf("expected strategy weights to sum to 1.0, got %f", totalWeight)
	}

	profile := &domain.ReaderProfile{
		ReaderID: "reader-blended",
		TenantID: tenantID,
	}
	_ = repo.SaveReaderProfile(ctx, tenantID, profile)

	items, err := e.GenerateMultiStrategyCandidates(ctx, profile, 5)
	if err != nil {
		t.Fatalf("unexpected error generating candidates: %v", err)
	}
	if len(items) != 5 {
		t.Fatalf("expected 5 blended candidates, got %d", len(items))
	}
	// Items should be ordered by descending relevance score
	for i := 1; i < len(items); i++ {
		if items[i].RelevanceScore > items[i-1].RelevanceScore {
			t.Errorf("items not sorted descending at index %d", i)
		}
	}
}

func TestBehavioralAnalyticsEngine_TimeDecay(t *testing.T) {
	ctx := context.Background()
	tenantID := "tenant-gamma"
	repo := newMockRepo()

	e := NewBehavioralAnalyticsEngine(tenantID, repo)

	if e.ID() != "PERS-003" {
		t.Errorf("expected ID PERS-003, got %s", e.ID())
	}

	now := time.Now()
	recentWeight := e.CalculateTimeDecayWeight(now, 1.0)
	olderWeight := e.CalculateTimeDecayWeight(now.Add(-48*time.Hour), 1.0) // 2 days old

	if recentWeight <= olderWeight {
		t.Errorf("expected recent touchpoint weight (%f) > older touchpoint weight (%f)", recentWeight, olderWeight)
	}

	signals := []domain.BehavioralSignal{
		{
			SignalID:   "sig-1",
			TenantID:   tenantID,
			ReaderID:   "r-1",
			ContentID:  "c-1",
			Weight:     10.0,
			OccurredAt: now,
		},
		{
			SignalID:   "sig-2",
			TenantID:   tenantID,
			ReaderID:   "r-1",
			ContentID:  "c-1",
			Weight:     10.0,
			OccurredAt: now.Add(-10 * 24 * time.Hour), // 10 days old
		},
	}

	scores, err := e.EvaluateSignalsWithTimeDecay(ctx, signals)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	score := scores["c-1"]
	expectedMax := 20.0
	if score >= expectedMax {
		t.Errorf("expected time decay to reduce aggregate score below %f, got %f", expectedMax, score)
	}
}

func TestPreferenceLearningEngine_ClosedLoop(t *testing.T) {
	ctx := context.Background()
	tenantID := "tenant-delta"
	repo := newMockRepo()

	e := NewPreferenceLearningEngine(tenantID, repo)

	if e.ID() != "PERS-004" {
		t.Errorf("expected ID PERS-004, got %s", e.ID())
	}

	profile := &domain.ReaderProfile{
		ReaderID:       "reader-learn",
		TenantID:       tenantID,
		InterestVector: []float64{0.50, 0.50},
	}
	_ = repo.SaveReaderProfile(ctx, tenantID, profile)

	// Large delta should be damped by learning rate and clamped to [-0.10, +0.10]
	deltas := []float64{2.0, -2.0}
	updated, err := e.UpdatePreferenceVector(ctx, profile, deltas)
	if err != nil {
		t.Fatalf("unexpected error updating preference vector: %v", err)
	}

	// 2.0 * 0.15 = 0.30 -> clamped to +0.10 -> new val 0.60
	// -2.0 * 0.15 = -0.30 -> clamped to -0.10 -> new val 0.40
	if math.Abs(updated.InterestVector[0]-0.60) > 1e-4 {
		t.Errorf("expected interest vector[0] ~0.60, got %f", updated.InterestVector[0])
	}
	if math.Abs(updated.InterestVector[1]-0.40) > 1e-4 {
		t.Errorf("expected interest vector[1] ~0.40, got %f", updated.InterestVector[1])
	}
}

func TestSemanticRankingEngine_CosineSimilarityAndDeduplication(t *testing.T) {
	ctx := context.Background()
	tenantID := "tenant-epsilon"
	e := NewSemanticRankingEngine(tenantID)

	if e.ID() != "PERS-005" {
		t.Errorf("expected ID PERS-005, got %s", e.ID())
	}

	vecA := []float64{1.0, 0.0, 0.0}
	vecB := []float64{1.0, 0.0, 0.0}
	vecC := []float64{0.0, 1.0, 0.0}

	simAB, err := e.CosineSimilarity(vecA, vecB)
	if err != nil || math.Abs(simAB-1.0) > 1e-6 {
		t.Errorf("expected identical vectors to have similarity 1.0, got %f (err: %v)", simAB, err)
	}

	simAC, err := e.CosineSimilarity(vecA, vecC)
	if err != nil || math.Abs(simAC) > 1e-6 {
		t.Errorf("expected orthogonal vectors to have similarity 0.0, got %f (err: %v)", simAC, err)
	}

	// Check deduplication with duplicate_threshold = 0.85
	candidates := []domain.PersonalizedFeedItem{
		{ContentID: "doc-1", TenantID: tenantID, RelevanceScore: 0.90},
		{ContentID: "doc-2", TenantID: tenantID, RelevanceScore: 0.80}, // near-duplicate of doc-1
		{ContentID: "doc-3", TenantID: tenantID, RelevanceScore: 0.70}, // distinct
	}
	embeddings := map[string][]float64{
		"doc-1": {1.0, 0.0, 0.0},
		"doc-2": {0.98, 0.20, 0.0}, // cosine sim to doc-1 is > 0.85
		"doc-3": {0.0, 1.0, 0.0},   // cosine sim to doc-1 is 0.0
	}

	unique, err := e.DeduplicateAndRank(ctx, candidates, embeddings)
	if err != nil {
		t.Fatalf("unexpected error deduplicating: %v", err)
	}
	if len(unique) != 2 {
		t.Fatalf("expected 2 unique candidates (doc-1 and doc-3), got %d", len(unique))
	}
	if unique[0].ContentID != "doc-1" || unique[1].ContentID != "doc-3" {
		t.Errorf("expected doc-1 and doc-3 after deduplication, got %v and %v", unique[0].ContentID, unique[1].ContentID)
	}
}

func TestIMP019AdvancedPersonalizationClosure(t *testing.T) {
	ctx := context.Background()
	tenantID := "tenant-imp019"
	repo := newMockRepo()
	feedEngine := NewReaderFeedGenerationEngine(tenantID, repo)
	recEngine := NewRecommendationEngine(tenantID, repo)
	behEngine := NewBehavioralAnalyticsEngine(tenantID)

	// 1. DTO/domain compatibility check
	profile := &domain.ReaderProfile{
		ReaderID: "reader-019",
		TenantID: tenantID,
		Preferences: map[string]string{
			"topic:Economy":         "0.90",
			"source:OfficialWire":   "0.85",
			"format:ARTICLE":        "0.80",
			"last_read_title":       "Central Bank Rate Decision",
			"read_story:content-pers-001": "true", // already read exclusion!
		},
		InterestVector: []float64{0.90, 0.50, 0.20},
		LastActiveAt:   time.Now(),
	}
	_ = repo.SaveReaderProfile(ctx, tenantID, profile)

	topPrefs := profile.GetTopicPreferences()
	if len(topPrefs) != 1 || topPrefs[0].TopicID != "Economy" || topPrefs[0].Weight != 0.90 {
		t.Fatalf("unexpected TopicPreferences: %+v", topPrefs)
	}
	srcPrefs := profile.GetSourcePreferences()
	if len(srcPrefs) != 1 || srcPrefs[0].SourceID != "OfficialWire" || srcPrefs[0].Weight != 0.85 {
		t.Fatalf("unexpected SourcePreferences: %+v", srcPrefs)
	}
	fmtPrefs := profile.GetFormatPreferences()
	if len(fmtPrefs) != 1 || fmtPrefs[0].FormatType != "ARTICLE" || fmtPrefs[0].Weight != 0.80 {
		t.Fatalf("unexpected FormatPreferences: %+v", fmtPrefs)
	}

	// 2. 35/25/20/10/10 feed ranking, normalization/clamping, AGT-024 quality integration, cursor pagination
	feedP1, err := feedEngine.GetRecommendationsWithCursor(ctx, "reader-019", 10, "")
	if err != nil {
		t.Fatalf("unexpected error on GetRecommendationsWithCursor page 1: %v", err)
	}
	if len(feedP1.Items) != 10 {
		t.Fatalf("expected 10 items in page 1, got %d", len(feedP1.Items))
	}
	if feedP1.NextCursor != "offset:10" || !feedP1.HasMore {
		t.Fatalf("unexpected page 1 cursor: %s / has_more=%v", feedP1.NextCursor, feedP1.HasMore)
	}
	for _, item := range feedP1.Items {
		if item.Strategy != "Explicit5FactorRanking" {
			t.Fatalf("expected Explicit5FactorRanking strategy, got %s", item.Strategy)
		}
		if item.RelevanceScore < 0.0 || item.RelevanceScore > 1.0 {
			t.Fatalf("expected relevance score clamped to [0.0, 1.0], got %.4f", item.RelevanceScore)
		}
		if item.ContentID == "content-pers-001" {
			t.Fatalf("expected already-read story 'content-pers-001' to be excluded")
		}
	}

	// Check page 2 and verify no duplicates between consecutive pages
	feedP2, err := feedEngine.GetRecommendationsWithCursor(ctx, "reader-019", 10, feedP1.NextCursor)
	if err != nil {
		t.Fatalf("unexpected error on page 2: %v", err)
	}
	if len(feedP2.Items) != 10 || feedP2.PrevCursor != "offset:0" {
		t.Fatalf("unexpected page 2 items or prev_cursor: %d / %s", len(feedP2.Items), feedP2.PrevCursor)
	}
	seen := make(map[string]bool)
	for _, it := range feedP1.Items {
		seen[it.ContentID] = true
	}
	for _, it := range feedP2.Items {
		if seen[it.ContentID] {
			t.Fatalf("duplicate content item across consecutive pages: %s", it.ContentID)
		}
	}

	// 3. Cold-start behavior check
	coldFeed, err := feedEngine.GetRecommendationsWithCursor(ctx, "unknown-reader", 5, "")
	if err != nil || len(coldFeed.Items) != 5 {
		t.Fatalf("expected cold-start fallback to trending recommendations, got %d items (err: %v)", len(coldFeed.Items), err)
	}
	if coldFeed.Items[0].Strategy != "TrendingBoost" {
		t.Fatalf("expected TrendingBoost strategy on cold start, got %s", coldFeed.Items[0].Strategy)
	}

	// 4. "Because you read X", explanation evidence correctness, diversity enforcement
	enhancedItems := recEngine.EnhanceWithExplanationsAndDiversity(ctx, profile, feedP1.Items)
	if len(enhancedItems) != 10 {
		t.Fatalf("expected 10 enhanced items, got %d", len(enhancedItems))
	}
	for _, it := range enhancedItems {
		if !strings.HasPrefix(it.Reason, "Because you read 'Central Bank Rate Decision'") {
			t.Fatalf("expected 'Because you read X' reason formatting, got: %s", it.Reason)
		}
	}

	// Test zero fabrication when profile lacks read title
	noTitleProf := &domain.ReaderProfile{ReaderID: "no-title"}
	noTitleItems := recEngine.EnhanceWithExplanationsAndDiversity(ctx, noTitleProf, feedP1.Items)
	if strings.Contains(noTitleItems[0].Reason, "Because you read") {
		t.Fatalf("expected no fabricated 'Because you read X' when profile lacks read story title")
	}

	// 5. Behavioral analytics insights check
	insights, err := behEngine.GenerateBehavioralInsights(ctx, "reader-019")
	if err != nil || insights == nil {
		t.Fatalf("unexpected error on GenerateBehavioralInsights: %v", err)
	}
	if insights.ReaderID != "reader-019" || insights.Pattern.DepthScore != 0.85 {
		t.Fatalf("unexpected behavioral insights properties: %+v", insights)
	}

	// 6. Tenant isolation and reader isolation check
	if _, err := feedEngine.ExecutePersonalization(ctx, map[string]string{"tenant_id": "wrong-tenant"}); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for wrong tenant, got %v", err)
	}
}

