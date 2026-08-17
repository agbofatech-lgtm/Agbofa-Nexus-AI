package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockPersonalizationPublisher struct {
	evt040Count int
	evt041Count int
	evt042Count int
	lastEvt040  *domain.BehavioralSignalRecordedEvent
	lastEvt041  *domain.PersonalizedFeedGeneratedEvent
	lastEvt042  *domain.PreferenceModelUpdatedEvent
}

func (m *mockPersonalizationPublisher) PublishBehavioralSignal(ctx context.Context, tenantID string, event *domain.BehavioralSignalRecordedEvent) error {
	m.evt040Count++
	m.lastEvt040 = event
	return nil
}

func (m *mockPersonalizationPublisher) PublishPersonalizedFeed(ctx context.Context, tenantID string, event *domain.PersonalizedFeedGeneratedEvent) error {
	m.evt041Count++
	m.lastEvt041 = event
	return nil
}

func (m *mockPersonalizationPublisher) PublishPreferenceUpdate(ctx context.Context, tenantID string, event *domain.PreferenceModelUpdatedEvent) error {
	m.evt042Count++
	m.lastEvt042 = event
	return nil
}

type mockPhase1Client struct {
	signals []map[string]interface{}
	err     error
}

func (m *mockPhase1Client) RouteToContentFactory(ctx context.Context, tenantID, storyID string, metadata map[string]string) error {
	return nil
}

func (m *mockPhase1Client) CheckCompliance(ctx context.Context, tenantID, contentID string) (bool, string, error) {
	return true, "cleared", nil
}

func (m *mockPhase1Client) ScheduleDistribution(ctx context.Context, tenantID, contentID string, platforms []string) error {
	return nil
}

func (m *mockPhase1Client) CollectAnalytics(ctx context.Context, tenantID, contentID string) (map[string]interface{}, error) {
	return nil, nil
}

func (m *mockPhase1Client) MonitorServiceHealth(ctx context.Context, serviceID string) (bool, error) {
	return true, nil
}

func (m *mockPhase1Client) CollectOptimizationSignals(ctx context.Context, tenantID string) ([]map[string]interface{}, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.signals, nil
}

func TestPersonalizationOrchestrator_RegistryAndTenantIsolation(t *testing.T) {
	ctx := context.Background()
	pub := &mockPersonalizationPublisher{}
	phase1 := &mockPhase1Client{}

	o := NewPersonalizationOrchestrator(pub, phase1)

	// Pre-registered all 5 engines: PERS-001 through PERS-005
	for _, id := range []string{"PERS-001", "PERS-002", "PERS-003", "PERS-004", "PERS-005"} {
		eng, err := o.GetEngine(id)
		if err != nil || eng == nil {
			t.Fatalf("expected pre-registered engine %s, got err=%v", id, err)
		}
	}

	tenantID := "tenant-f3-test"
	o.RegisterDefaultEngines(tenantID, nil)

	// 1. Cross-tenant violation
	_, err := o.ExecutePersonalization(ctx, PersonalizationRequestDTO{
		TenantID: "unauthorized-tenant",
		EngineID: "PERS-001",
		ReaderID: "reader-1",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	// 2. Successful single engine execution and event emission (EVT-041)
	resp, err := o.ExecutePersonalization(ctx, PersonalizationRequestDTO{
		TenantID: tenantID,
		EngineID: "PERS-001",
		ReaderID: "reader-1",
		Payload:  map[string]string{"limit": "5"},
	})
	if err != nil {
		t.Fatalf("unexpected error executing PERS-001: %v", err)
	}
	if resp.Status != "COMPLETED" {
		t.Errorf("expected COMPLETED status, got %s", resp.Status)
	}
	if pub.evt041Count != 1 {
		t.Errorf("expected 1 EVT-041 event published, got %d", pub.evt041Count)
	}

	// 3. Check audit log
	audit := o.GetAuditLog(tenantID)
	if len(audit) == 0 {
		t.Fatalf("expected audit entries for tenant %s, got 0", tenantID)
	}
}

func TestPersonalizationOrchestrator_BatchExecutionAndMergeDeduplicate(t *testing.T) {
	ctx := context.Background()
	tenantID := "tenant-batch-test"
	pub := &mockPersonalizationPublisher{}
	o := NewPersonalizationOrchestrator(pub, nil)
	o.RegisterDefaultEngines(tenantID, nil)

	req := BatchPersonalizationRequestDTO{
		TenantID:  tenantID,
		ReaderID:  "reader-batch",
		EngineIDs: []string{"PERS-001", "PERS-002"},
		Payload:   map[string]string{"limit": "10"},
	}

	resp, err := o.ExecuteBatchPersonalization(ctx, req)
	if err != nil {
		t.Fatalf("unexpected error in batch execution: %v", err)
	}
	if resp.EnginesExecuted != 2 {
		t.Errorf("expected 2 engines executed, got %d", resp.EnginesExecuted)
	}
	if len(resp.Results) == 0 {
		t.Fatalf("expected merged feed items, got 0")
	}

	// Verify deduplication and descending relevance order
	seen := make(map[string]bool)
	for i, item := range resp.Results {
		if seen[item.ContentID] {
			t.Errorf("duplicate ContentID %s in merged results", item.ContentID)
		}
		seen[item.ContentID] = true
		if i > 0 && item.RelevanceScore > resp.Results[i-1].RelevanceScore {
			t.Errorf("merged results not sorted descending at index %d", i)
		}
	}
}

func TestPersonalizationOrchestrator_AnalyticsSignalsFreshnessSLA(t *testing.T) {
	ctx := context.Background()
	tenantID := "tenant-sla-test"
	pub := &mockPersonalizationPublisher{}

	nowStr := time.Now().Format(time.RFC3339)
	staleStr := time.Now().Add(-2 * time.Hour).Format(time.RFC3339) // 7200s old (> 3600s SLA)

	phase1 := &mockPhase1Client{
		signals: []map[string]interface{}{
			{
				"signal_id":   "sig-fresh",
				"content_id":  "c-1",
				"metric_name": "click_through_rate",
				"value":       0.05,
				"timestamp":   nowStr,
			},
			{
				"signal_id":   "sig-stale",
				"content_id":  "c-2",
				"metric_name": "dwell_time",
				"value":       12.0,
				"timestamp":   staleStr,
			},
		},
	}

	o := NewPersonalizationOrchestrator(pub, phase1)
	o.RegisterDefaultEngines(tenantID, nil)

	signals, err := o.ConsumeAnalyticsSignals(ctx, tenantID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Only the fresh signal should be returned
	if len(signals) != 1 {
		t.Fatalf("expected 1 fresh signal returned, got %d", len(signals))
	}
	if signals[0].SignalID != "sig-fresh" {
		t.Errorf("expected sig-fresh, got %s", signals[0].SignalID)
	}

	// When all signals are stale, should return domain.ErrStaleSignal
	phase1AllStale := &mockPhase1Client{
		signals: []map[string]interface{}{
			{
				"signal_id": "sig-stale-only",
				"timestamp": staleStr,
			},
		},
	}
	oAllStale := NewPersonalizationOrchestrator(pub, phase1AllStale)
	_, errStale := oAllStale.ConsumeAnalyticsSignals(ctx, tenantID)
	if !errors.Is(errStale, domain.ErrStaleSignal) {
		t.Fatalf("expected ErrStaleSignal when all signals are stale, got %v", errStale)
	}

	// Test RefreshPersonalizationData integration
	errRefresh := o.RefreshPersonalizationData(ctx, tenantID)
	if errRefresh != nil {
		t.Fatalf("unexpected error refreshing personalization data: %v", errRefresh)
	}
}

type mockPersonalizationRepo struct {
	cleanupCount int
	cleaned      int
	err          error
}

func (m *mockPersonalizationRepo) SaveReaderProfile(ctx context.Context, tenantID string, profile *domain.ReaderProfile) error {
	return nil
}

func (m *mockPersonalizationRepo) GetReaderProfile(ctx context.Context, tenantID, readerID string) (*domain.ReaderProfile, error) {
	return nil, nil
}

func (m *mockPersonalizationRepo) RecordBehavioralSignal(ctx context.Context, tenantID string, signal *domain.BehavioralSignal) error {
	return nil
}

func (m *mockPersonalizationRepo) SavePersonalizedFeed(ctx context.Context, tenantID string, feed *domain.PersonalizedFeed) error {
	return nil
}

func (m *mockPersonalizationRepo) GetPersonalizedFeed(ctx context.Context, tenantID, readerID string) (*domain.PersonalizedFeed, error) {
	return nil, nil
}

func (m *mockPersonalizationRepo) CleanupExpiredSignals(ctx context.Context, maxAge time.Duration) (int, error) {
	m.cleanupCount++
	return m.cleaned, m.err
}

func TestPersonalizationOrchestrator_GDPRCleanup(t *testing.T) {
	ctx := context.Background()
	mockRepo := &mockPersonalizationRepo{cleaned: 5}
	o := NewPersonalizationOrchestrator(nil, nil).WithRepository(mockRepo)

	count, err := o.RunGDPRCleanup(ctx, "tenant-gdpr-orch")
	if err != nil {
		t.Fatalf("unexpected error on RunGDPRCleanup: %v", err)
	}
	if count != 5 || mockRepo.cleanupCount != 1 {
		t.Errorf("expected 5 purged signals and 1 call to repo, got count=%d calls=%d", count, mockRepo.cleanupCount)
	}

	audit := o.GetAuditLog("tenant-gdpr-orch")
	if len(audit) == 0 || audit[len(audit)-1].Operation != "RunGDPRCleanup" {
		t.Errorf("expected RunGDPRCleanup audit entry, got %v", audit)
	}
}
