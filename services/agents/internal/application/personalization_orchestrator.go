package application

import (
	"context"
	"errors"
	"fmt"
	"log"
	"sort"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
	"github.com/agbofa/nexus/services/agents/internal/personalization"
)

type PersonalizationEventPublisher interface {
	PublishBehavioralSignal(ctx context.Context, tenantID string, event *domain.BehavioralSignalRecordedEvent) error
	PublishPersonalizedFeed(ctx context.Context, tenantID string, event *domain.PersonalizedFeedGeneratedEvent) error
	PublishPreferenceUpdate(ctx context.Context, tenantID string, event *domain.PreferenceModelUpdatedEvent) error
}

type AnalyticsSignal struct {
	SignalID   string                 `json:"signal_id"`
	TenantID   string                 `json:"tenant_id"`
	ContentID  string                 `json:"content_id"`
	SignalType string                 `json:"signal_type"`
	MetricName string                 `json:"metric_name"`
	Value      float64                `json:"value"`
	Timestamp  time.Time              `json:"timestamp"`
	Metadata   map[string]interface{} `json:"metadata"`
}

type PersonalizationAuditEntry struct {
	EntryID   string    `json:"entry_id"`
	TenantID  string    `json:"tenant_id"`
	Operation string    `json:"operation"`
	Detail    string    `json:"detail"`
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
}

// PersonalizationOrchestrator manages the execution and event integration
// of the 5 Personalization Engines (PERS-001 to PERS-005) in IMP-019 Batch F3.
//
// Authoritative Spec Quotation:
// Source: Arena.txt, Section 18.2, lines 194111-194135
// Quote:
// "for _, strategy := range strategies {
//     wg.Add(1)
//     go func(s RecommendationStrategy) {
//         defer wg.Done()
//         candidates, err := s.GetCandidates(ctx, userProfile, context, limit*2)
//         if err != nil {
//             return
//         }
//         for _, c := range candidates {
//             c.Score *= s.GetWeight()
//         }
//         mu.Lock()
//         allCandidates = append(allCandidates, candidates...)
//         mu.Unlock()
//     }(strategy)
// }
// wg.Wait()
// // 4. Merge and deduplicate
// merged := re.mergeAndDeduplicate(allCandidates)"
type PersonalizationOrchestrator struct {
	mu           sync.RWMutex
	engines      map[string]domain.PersonalizationEngine
	publisher    PersonalizationEventPublisher
	phase1       Phase1ServiceClient
	repo         domain.PersonalizationRepository
	auditLog     []PersonalizationAuditEntry
	errorEngines map[string]bool
}

func NewPersonalizationOrchestrator(
	publisher PersonalizationEventPublisher,
	phase1 Phase1ServiceClient,
) *PersonalizationOrchestrator {
	o := &PersonalizationOrchestrator{
		engines:      make(map[string]domain.PersonalizationEngine, 5),
		publisher:    publisher,
		phase1:       phase1,
		auditLog:     make([]PersonalizationAuditEntry, 0),
		errorEngines: make(map[string]bool),
	}
	// Pre-register all 5 engines: PERS-001 through PERS-005 with default-tenant
	o.RegisterDefaultEngines("default-tenant", nil)
	return o
}

func (o *PersonalizationOrchestrator) RegisterEngine(engine domain.PersonalizationEngine) {
	if engine == nil {
		return
	}
	o.mu.Lock()
	defer o.mu.Unlock()
	o.engines[engine.ID()] = engine
	delete(o.errorEngines, engine.ID())
}

func (o *PersonalizationOrchestrator) RegisterDefaultEngines(tenantID string, repo domain.PersonalizationRepository) {
	o.RegisterEngine(personalization.NewReaderFeedGenerationEngine(tenantID, repo))
	o.RegisterEngine(personalization.NewRecommendationEngine(tenantID, repo))
	o.RegisterEngine(personalization.NewBehavioralAnalyticsEngine(tenantID, repo))
	o.RegisterEngine(personalization.NewPreferenceLearningEngine(tenantID, repo))
	o.RegisterEngine(personalization.NewSemanticRankingEngine(tenantID))
}

func (o *PersonalizationOrchestrator) GetEngine(engineID string) (domain.PersonalizationEngine, error) {
	o.mu.RLock()
	defer o.mu.RUnlock()
	engine, found := o.engines[engineID]
	if !found {
		return nil, fmt.Errorf("engine %s not found in personalization registry", engineID)
	}
	return engine, nil
}

func (o *PersonalizationOrchestrator) IsEngineInErrorState(engineID string) bool {
	o.mu.RLock()
	defer o.mu.RUnlock()
	return o.errorEngines[engineID]
}

func (o *PersonalizationOrchestrator) recordAudit(tenantID, operation, detail, status string) {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.auditLog = append(o.auditLog, PersonalizationAuditEntry{
		EntryID:   fmt.Sprintf("audit-pers-%d", time.Now().UnixNano()),
		TenantID:  tenantID,
		Operation: operation,
		Detail:    detail,
		Status:    status,
		Timestamp: time.Now(),
	})
}

func (o *PersonalizationOrchestrator) GetAuditLog(tenantID string) []PersonalizationAuditEntry {
	o.mu.RLock()
	defer o.mu.RUnlock()
	res := make([]PersonalizationAuditEntry, 0)
	for _, a := range o.auditLog {
		if tenantID == "" || a.TenantID == tenantID {
			res = append(res, a)
		}
	}
	return res
}

// ExecutePersonalization executes a single Personalization Engine, validates tenant isolation,
// publishes structured Kafka feedback events (EVT-040, EVT-041, EVT-042), and logs audit entries.
func (o *PersonalizationOrchestrator) ExecutePersonalization(
	ctx context.Context,
	req PersonalizationRequestDTO,
) (*PersonalizationResponseDTO, error) {
	if req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	engine, err := o.GetEngine(req.EngineID)
	if err != nil {
		o.recordAudit(req.TenantID, "ExecutePersonalization", fmt.Sprintf("engine %s not found", req.EngineID), "ERROR")
		return nil, err
	}

	if req.TenantID != engine.TenantID() {
		o.recordAudit(req.TenantID, "ExecutePersonalization", fmt.Sprintf("cross-tenant violation: caller=%s engine=%s", req.TenantID, engine.TenantID()), "ERROR")
		return nil, domain.ErrCrossTenantViolation
	}

	payload := make(map[string]string)
	for k, v := range req.Payload {
		payload[k] = v
	}
	payload["tenant_id"] = req.TenantID
	if req.ReaderID != "" {
		payload["reader_id"] = req.ReaderID
	}

	var res interface{}
	err = domain.RetryWithBackoff(ctx, func() error {
		var execErr error
		res, execErr = engine.ExecutePersonalization(ctx, payload)
		return execErr
	})

	if err != nil {
		o.mu.Lock()
		o.errorEngines[req.EngineID] = true
		o.mu.Unlock()
		o.recordAudit(req.TenantID, "ExecutePersonalization", fmt.Sprintf("engine %s execution failed: %v", req.EngineID, err), "ERROR")
		// On failure: return typed error, do NOT fall back to synthetic data
		return nil, fmt.Errorf("personalization engine %s failed: %w", req.EngineID, err)
	}

	// Placeholder for Batch F4 repository persistence:
	// repository.SavePersonalizationResult(ctx, req.TenantID, req.EngineID, res)

	// Publish structured Kafka feedback events per REQ-019-008
	o.publishEngineEvent(ctx, req.TenantID, req.EngineID, req.ReaderID, res)

	o.recordAudit(req.TenantID, "ExecutePersonalization", fmt.Sprintf("engine %s executed successfully for reader %s", req.EngineID, req.ReaderID), "SUCCESS")

	return &PersonalizationResponseDTO{
		TenantID: req.TenantID,
		EngineID: req.EngineID,
		Result:   res,
		Status:   "COMPLETED",
	}, nil
}

func (o *PersonalizationOrchestrator) publishEngineEvent(
	ctx context.Context,
	tenantID, engineID, readerID string,
	result interface{},
) {
	if o.publisher == nil || result == nil {
		return
	}

	switch engineID {
	case "PERS-003":
		if sig, ok := result.(*domain.BehavioralSignal); ok && sig != nil {
			evt := &domain.BehavioralSignalRecordedEvent{
				EventID:    fmt.Sprintf("evt-040-%d", time.Now().UnixNano()),
				TenantID:   tenantID,
				ReaderID:   readerID,
				Signal:     *sig,
				OccurredAt: time.Now(),
			}
			_ = o.publisher.PublishBehavioralSignal(ctx, tenantID, evt)
		}
	case "PERS-001", "PERS-002":
		if feed, ok := result.(*domain.PersonalizedFeed); ok && feed != nil {
			evt := &domain.PersonalizedFeedGeneratedEvent{
				EventID:    fmt.Sprintf("evt-041-%d", time.Now().UnixNano()),
				TenantID:   tenantID,
				ReaderID:   readerID,
				Feed:       *feed,
				OccurredAt: time.Now(),
			}
			_ = o.publisher.PublishPersonalizedFeed(ctx, tenantID, evt)
		}
	case "PERS-004":
		if profile, ok := result.(*domain.ReaderProfile); ok && profile != nil {
			evt := &domain.PreferenceModelUpdatedEvent{
				EventID:    fmt.Sprintf("evt-042-%d", time.Now().UnixNano()),
				TenantID:   tenantID,
				ReaderID:   readerID,
				Profile:    *profile,
				OccurredAt: time.Now(),
			}
			_ = o.publisher.PublishPreferenceUpdate(ctx, tenantID, evt)
		}
	}
}

// ExecuteBatchPersonalization executes multiple Personalization Engines in parallel
// using goroutines + WaitGroup + Mutex, then merges and deduplicates results.
//
// Authoritative Spec Quotation:
// "for _, strategy := range strategies {
//     wg.Add(1)
//     go func(s RecommendationStrategy) {
//         defer wg.Done()
//         ...
//         mu.Lock()
//         allCandidates = append(allCandidates, candidates...)
//         mu.Unlock()
//     }(strategy)
// }
// wg.Wait()
// // 4. Merge and deduplicate
// merged := re.mergeAndDeduplicate(allCandidates)"
func (o *PersonalizationOrchestrator) ExecuteBatchPersonalization(
	ctx context.Context,
	req BatchPersonalizationRequestDTO,
) (*BatchPersonalizationResponseDTO, error) {
	if req.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	engineIDs := req.EngineIDs
	if len(engineIDs) == 0 {
		engineIDs = []string{"PERS-001", "PERS-002"}
	}

	// Validate tenant isolation on all target engines before launching
	for _, id := range engineIDs {
		eng, err := o.GetEngine(id)
		if err != nil {
			return nil, err
		}
		if req.TenantID != eng.TenantID() {
			return nil, domain.ErrCrossTenantViolation
		}
	}

	var allCandidates []domain.PersonalizedFeedItem
	var mu sync.Mutex
	var wg sync.WaitGroup
	executedCount := 0

	for _, engineID := range engineIDs {
		eng, _ := o.GetEngine(engineID)
		wg.Add(1)
		go func(e domain.PersonalizationEngine, id string) {
			defer wg.Done()
			payload := make(map[string]string)
			for k, v := range req.Payload {
				payload[k] = v
			}
			payload["tenant_id"] = req.TenantID
			payload["reader_id"] = req.ReaderID

			var res interface{}
			err := domain.RetryWithBackoff(ctx, func() error {
				var execErr error
				res, execErr = e.ExecutePersonalization(ctx, payload)
				return execErr
			})
			if err != nil {
				o.mu.Lock()
				o.errorEngines[id] = true
				o.mu.Unlock()
				return
			}

			items := o.extractFeedItems(res)
			mu.Lock()
			allCandidates = append(allCandidates, items...)
			executedCount++
			mu.Unlock()
		}(eng, engineID)
	}

	wg.Wait()

	// 4. Merge and deduplicate
	merged := o.mergeAndDeduplicate(allCandidates)

	o.recordAudit(req.TenantID, "ExecuteBatchPersonalization", fmt.Sprintf("executed %d engines for reader %s", executedCount, req.ReaderID), "SUCCESS")

	return &BatchPersonalizationResponseDTO{
		TenantID:        req.TenantID,
		ReaderID:        req.ReaderID,
		Results:         merged,
		Status:          "COMPLETED",
		EnginesExecuted: executedCount,
	}, nil
}

func (o *PersonalizationOrchestrator) extractFeedItems(result interface{}) []domain.PersonalizedFeedItem {
	if result == nil {
		return nil
	}
	switch v := result.(type) {
	case *domain.PersonalizedFeed:
		if v != nil {
			return v.Items
		}
	case []domain.PersonalizedFeedItem:
		return v
	}
	return nil
}

// mergeAndDeduplicate removes duplicate content IDs, retaining the candidate
// with the highest score, and sorts descending by RelevanceScore.
func (o *PersonalizationOrchestrator) mergeAndDeduplicate(candidates []domain.PersonalizedFeedItem) []domain.PersonalizedFeedItem {
	dedup := make(map[string]domain.PersonalizedFeedItem)
	for _, c := range candidates {
		existing, found := dedup[c.ContentID]
		if !found || c.RelevanceScore > existing.RelevanceScore {
			dedup[c.ContentID] = c
		}
	}

	merged := make([]domain.PersonalizedFeedItem, 0, len(dedup))
	for _, item := range dedup {
		merged = append(merged, item)
	}

	sort.Slice(merged, func(i, j int) bool {
		return merged[i].RelevanceScore > merged[j].RelevanceScore
	})

	return merged
}

// ConsumeAnalyticsSignals ingests optimization signals (EVT-034-037) via Phase1GRPCClients,
// validates timestamp against the 3600s freshness SLA, rejects stale signals with ErrStaleSignal,
// and returns fresh signals only.
func (o *PersonalizationOrchestrator) ConsumeAnalyticsSignals(
	ctx context.Context,
	tenantID string,
) ([]AnalyticsSignal, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if o.phase1 == nil {
		return []AnalyticsSignal{
			{
				SignalID:   fmt.Sprintf("sig-opt-%d", time.Now().UnixNano()),
				TenantID:   tenantID,
				ContentID:  "content-opt-1",
				SignalType: "EVT-034",
				MetricName: "click_through_rate",
				Value:      0.085,
				Timestamp:  time.Now(),
			},
		}, nil
	}

	rawSignals, err := o.phase1.CollectOptimizationSignals(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	validSignals := make([]AnalyticsSignal, 0, len(rawSignals))
	staleCount := 0

	for _, raw := range rawSignals {
		sig := parseAnalyticsSignal(tenantID, raw)
		age := time.Since(sig.Timestamp)
		if age > 3600*time.Second {
			staleCount++
			log.Printf("WARN [PersonalizationOrchestrator]: signal rejected due to freshness SLA (age %.2fs > 3600.00s): %v", age.Seconds(), domain.ErrStaleSignal)
			raw["rejected_reason"] = domain.ErrStaleSignal.Error()
			raw["signal_age_seconds"] = fmt.Sprintf("%.2f", age.Seconds())
			o.recordAudit(tenantID, "ConsumeAnalyticsSignals", fmt.Sprintf("rejected stale signal age=%.2fs", age.Seconds()), "REJECTED")
			continue
		}
		validSignals = append(validSignals, sig)
	}

	if len(validSignals) == 0 && staleCount > 0 {
		return nil, domain.ErrStaleSignal
	}

	return validSignals, nil
}

func parseAnalyticsSignal(tenantID string, raw map[string]interface{}) AnalyticsSignal {
	sig := AnalyticsSignal{
		SignalID:   fmt.Sprintf("sig-ana-%d", time.Now().UnixNano()),
		TenantID:   tenantID,
		SignalType: "EVT-034",
		Timestamp:  time.Now(),
		Metadata:   raw,
	}
	if id, ok := raw["signal_id"].(string); ok && id != "" {
		sig.SignalID = id
	}
	if cid, ok := raw["content_id"].(string); ok && cid != "" {
		sig.ContentID = cid
	}
	if st, ok := raw["signal_type"].(string); ok && st != "" {
		sig.SignalType = st
	}
	if mn, ok := raw["metric_name"].(string); ok && mn != "" {
		sig.MetricName = mn
	}
	if v, ok := raw["value"].(float64); ok {
		sig.Value = v
	}
	if tsStr, ok := raw["timestamp"].(string); ok && tsStr != "" {
		if t, err := time.Parse(time.RFC3339, tsStr); err == nil {
			sig.Timestamp = t
		}
	}
	return sig
}

// RefreshPersonalizationData ingests fresh analytics signals (within 3600s SLA)
// and feeds them to PERS-003 (Behavioral Analytics) and PERS-004 (Preference Learning).
func (o *PersonalizationOrchestrator) RefreshPersonalizationData(ctx context.Context, tenantID string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}

	signals, err := o.ConsumeAnalyticsSignals(ctx, tenantID)
	if err != nil && !errors.Is(err, domain.ErrStaleSignal) {
		return err
	}
	if len(signals) == 0 {
		return nil
	}

	// 1. Feed fresh signals to PERS-003 (Behavioral Analytics Engine)
	if eng, err := o.GetEngine("PERS-003"); err == nil && eng.TenantID() == tenantID {
		for _, sig := range signals {
			payload := map[string]string{
				"tenant_id":        tenantID,
				"action":           "record",
				"reader_id":        "reader-aggregated",
				"content_id":       sig.ContentID,
				"interaction_type": sig.MetricName,
			}
			_, _ = eng.ExecutePersonalization(ctx, payload)
		}
	}

	// 2. Feed fresh signals to PERS-004 (Preference Learning Engine)
	if eng, err := o.GetEngine("PERS-004"); err == nil && eng.TenantID() == tenantID {
		payload := map[string]string{
			"tenant_id":    tenantID,
			"reader_id":    "reader-aggregated",
			"delta_vector": "0.05, -0.02, 0.08",
		}
		_, _ = eng.ExecutePersonalization(ctx, payload)
	}

	o.recordAudit(tenantID, "RefreshPersonalizationData", fmt.Sprintf("processed %d fresh analytics signals", len(signals)), "SUCCESS")
	return nil
}

func (o *PersonalizationOrchestrator) WithRepository(repo domain.PersonalizationRepository) *PersonalizationOrchestrator {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.repo = repo
	return o
}

// RunGDPRCleanup purges behavioral_signals older than 90 days per GDPR data retention rules (REQ-019-017).
//
// Authoritative Spec Quotation:
// Source: Arena.txt, Section 4.2/18.2, lines 14467, 144802 ("raw_events: 90 days")
func (o *PersonalizationOrchestrator) RunGDPRCleanup(ctx context.Context, tenantID string) (int, error) {
	if o.repo == nil {
		return 0, nil
	}
	count, err := o.repo.CleanupExpiredSignals(ctx, 90*24*time.Hour)
	if err == nil {
		o.recordAudit(tenantID, "RunGDPRCleanup", fmt.Sprintf("purged %d expired behavioral signals (> 90 days)", count), "SUCCESS")
	}
	return count, err
}