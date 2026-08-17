package application

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type FloodDetector struct {
	mu            sync.RWMutex
	threshold     int
	pauseDuration time.Duration
	sourceCounts  map[string][]time.Time
	pausedUntil   map[string]time.Time
	auditTrail    []string
}

func NewFloodDetector(threshold int, pauseDuration time.Duration) *FloodDetector {
	if threshold <= 0 {
		threshold = 50
	}
	if pauseDuration <= 0 {
		pauseDuration = 5 * time.Minute
	}
	return &FloodDetector{
		threshold:     threshold,
		pauseDuration: pauseDuration,
		sourceCounts:  make(map[string][]time.Time),
		pausedUntil:   make(map[string]time.Time),
		auditTrail:    make([]string, 0),
	}
}

func (f *FloodDetector) CheckAndRecord(tenantID, source string, count int) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	key := fmt.Sprintf("%s:%s", tenantID, source)
	now := time.Now()

	if until, exists := f.pausedUntil[key]; exists && now.Before(until) {
		return domain.ErrFloodDetected
	}

	windowStart := now.Add(-1 * time.Minute)
	timestamps := f.sourceCounts[key]
	valid := make([]time.Time, 0, len(timestamps))
	for _, ts := range timestamps {
		if ts.After(windowStart) {
			valid = append(valid, ts)
		}
	}

	for i := 0; i < count; i++ {
		valid = append(valid, now)
	}
	f.sourceCounts[key] = valid

	if len(valid) > f.threshold {
		pauseEnd := now.Add(f.pauseDuration)
		f.pausedUntil[key] = pauseEnd
		auditMsg := fmt.Sprintf("AUDIT [%s]: Flood detected for source %s (%d signals/min > %d threshold). Paused until %s", now.Format(time.RFC3339), key, len(valid), f.threshold, pauseEnd.Format(time.RFC3339))
		f.auditTrail = append(f.auditTrail, auditMsg)
		return domain.ErrFloodDetected
	}

	return nil
}

func (f *FloodDetector) GetAuditTrail() []string {
	f.mu.RLock()
	defer f.mu.RUnlock()
	res := make([]string, len(f.auditTrail))
	copy(res, f.auditTrail)
	return res
}

type MonitorOrchestrator struct {
	client        PlatformClient
	publisher     EventPublisher
	aiGateway     AIGatewayClient
	floodDetector *FloodDetector
}

func NewMonitorOrchestrator(client PlatformClient, publisher EventPublisher) *MonitorOrchestrator {
	return &MonitorOrchestrator{
		client:        client,
		publisher:     publisher,
		floodDetector: NewFloodDetector(50, 5*time.Minute),
	}
}

func (o *MonitorOrchestrator) WithAIGateway(ai AIGatewayClient) *MonitorOrchestrator {
	o.aiGateway = ai
	return o
}

func (o *MonitorOrchestrator) WithFloodDetector(fd *FloodDetector) *MonitorOrchestrator {
	o.floodDetector = fd
	return o
}

func (o *MonitorOrchestrator) ExecuteScan(
	ctx context.Context,
	agent domain.MonitorAgent,
	req ScanRequestDTO,
) (*ScanResponseDTO, error) {
	start := time.Now()
	if agent == nil {
		return nil, fmt.Errorf("agent is nil")
	}
	if req.TenantID != agent.TenantID() {
		return nil, domain.ErrCrossTenantViolation
	}

	signals, err := agent.Scan(ctx, req.TenantID, req.Keywords)
	if err != nil {
		return nil, fmt.Errorf("scan error for agent %s: %w", agent.ID(), err)
	}

	if req.Limit > 0 && len(signals) > req.Limit {
		signals = signals[:req.Limit]
	}

	// Check Adversarial Flood Protection before LLM dispatch
	if o.floodDetector != nil {
		if err := o.floodDetector.CheckAndRecord(req.TenantID, agent.Platform().String(), len(signals)); err != nil {
			return nil, err
		}
	}

	for i := range signals {
		if o.aiGateway != nil {
			summary, score, err := o.aiGateway.SummarizeSignal(ctx, req.TenantID, agent.ID(), &signals[i])
			if err == nil {
				if signals[i].Metadata == nil {
					signals[i].Metadata = make(map[string]string)
				}
				signals[i].Metadata["ai_summary"] = summary
				signals[i].Metadata["ai_score"] = fmt.Sprintf("%.2f", score)
			}
		}

		if o.publisher != nil {
			evt := &domain.MonitorSignalDetectedEvent{
				EventID:    fmt.Sprintf("evt-019-%s-%d", signals[i].SignalID, time.Now().UnixNano()),
				TenantID:   req.TenantID,
				AgentID:    agent.ID(),
				Platform:   agent.Platform(),
				Signal:     signals[i],
				OccurredAt: time.Now(),
			}
			_ = o.publisher.PublishSignalDetected(ctx, evt)
		}
	}

	elapsed := time.Since(start).Milliseconds()
	resp := &ScanResponseDTO{
		TenantID:        req.TenantID,
		AgentID:         agent.ID(),
		Platform:        agent.Platform(),
		SignalsCount:    len(signals),
		Signals:         signals,
		ExecutionTimeMs: elapsed,
	}
	return resp, nil
}

func (o *MonitorOrchestrator) CheckHealth(ctx context.Context, agent domain.MonitorAgent) (*AgentHealthReportDTO, error) {
	if agent == nil {
		return nil, fmt.Errorf("agent is nil")
	}
	remaining, err := agent.GetRateLimitStatus(ctx)
	if err != nil {
		return nil, err
	}
	return &AgentHealthReportDTO{
		AgentID:        agent.ID(),
		TenantID:       agent.TenantID(),
		Status:         agent.Status(),
		Platform:       agent.Platform().String(),
		RemainingQuota: remaining,
		LastScanAt:     time.Now(),
	}, nil
}
