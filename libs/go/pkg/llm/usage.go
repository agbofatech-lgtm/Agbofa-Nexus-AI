package llm

import (
	"context"
	"log"
	"sync"
)

// MemoryUsage is a process-local usage ledger for Phase 02.
// It is not a billing system.
type MemoryUsage struct {
	mu      sync.Mutex
	records []UsageRecord
}

type UsageRecord struct {
	TenantID      string
	SubjectID     string
	CorrelationID string
	Provider      string
	Model         string
	Usage         Usage
	Cost          Cost
	Err           string
}

func NewMemoryUsage() *MemoryUsage { return &MemoryUsage{} }

func (m *MemoryUsage) Record(_ context.Context, req Request, res Response, err error) {
	rec := UsageRecord{
		TenantID: req.TenantID, SubjectID: req.SubjectID, CorrelationID: req.CorrelationID,
		Provider: res.Provider, Model: req.Model, Usage: res.Usage, Cost: res.Cost,
	}
	if err != nil {
		rec.Err = err.Error()
	}
	m.mu.Lock()
	m.records = append(m.records, rec)
	m.mu.Unlock()
	log.Printf("ai.usage tenant=%s model=%s provider=%s tokens=%d cost_micros=%d err=%t",
		req.TenantID, req.Model, res.Provider, res.Usage.TotalTokens, res.Cost.EstimatedMicros, err != nil)
}

func (m *MemoryUsage) Snapshot() []UsageRecord {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make([]UsageRecord, len(m.records))
	copy(out, m.records)
	return out
}
