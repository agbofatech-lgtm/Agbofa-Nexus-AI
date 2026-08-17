package pipeline

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// PipelineRegistry manages registration, lifecycle, and concurrent execution
// of all PipelineOperators in IMP-017-D (AGT-025 through AGT-032).
type PipelineRegistry struct {
	mu        sync.RWMutex
	operators map[string]PipelineOperator
}

// NewPipelineRegistry initializes a new PipelineRegistry instance.
func NewPipelineRegistry() *PipelineRegistry {
	return &PipelineRegistry{
		operators: make(map[string]PipelineOperator, 8),
	}
}

// RegisterOperator registers a PipelineOperator in the registry.
func (r *PipelineRegistry) RegisterOperator(operator PipelineOperator) error {
	if operator == nil {
		return fmt.Errorf("cannot register nil pipeline operator")
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.operators[operator.ID()] = operator
	return nil
}

// GetOperator retrieves a PipelineOperator by ID.
func (r *PipelineRegistry) GetOperator(operatorID string) (PipelineOperator, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	o, ok := r.operators[operatorID]
	if !ok {
		return nil, fmt.Errorf("pipeline operator %s not found in registry", operatorID)
	}
	return o, nil
}

// ListOperators returns a slice of all registered PipelineOperators.
func (r *PipelineRegistry) ListOperators() []PipelineOperator {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]PipelineOperator, 0, len(r.operators))
	for _, o := range r.operators {
		list = append(list, o)
	}
	return list
}

// InitializeAll initializes all registered PipelineOperators for a specific tenant.
func (r *PipelineRegistry) InitializeAll(ctx context.Context, tenantID string, config map[string]string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	r.mu.RLock()
	list := make([]PipelineOperator, 0, len(r.operators))
	for _, o := range r.operators {
		if o.TenantID() == "" || o.TenantID() == tenantID {
			list = append(list, o)
		}
	}
	r.mu.RUnlock()

	for _, o := range list {
		if err := o.Initialize(ctx, tenantID, config); err != nil {
			return fmt.Errorf("failed to initialize operator %s: %w", o.ID(), err)
		}
	}
	return nil
}

// HealthCheckAll performs concurrent health checks on all registered PipelineOperators.
func (r *PipelineRegistry) HealthCheckAll(ctx context.Context) (map[string]*domain.SourceHealth, error) {
	r.mu.RLock()
	list := make([]PipelineOperator, 0, len(r.operators))
	for _, o := range r.operators {
		list = append(list, o)
	}
	r.mu.RUnlock()

	healthMap := make(map[string]*domain.SourceHealth, len(list))
	for _, o := range list {
		h, err := o.HealthCheck(ctx)
		if err != nil || h == nil {
			healthMap[o.ID()] = &domain.SourceHealth{
				SourceID:     o.ID(),
				Status:       "OFFLINE",
				LastCheckAt:  time.Now(),
				ErrorMessage: fmt.Sprintf("%v", err),
			}
		} else {
			healthMap[o.ID()] = h
		}
	}
	return healthMap, nil
}

// ShutdownAll gracefully shuts down all registered PipelineOperators.
func (r *PipelineRegistry) ShutdownAll(ctx context.Context) error {
	r.mu.RLock()
	list := make([]PipelineOperator, 0, len(r.operators))
	for _, o := range r.operators {
		list = append(list, o)
	}
	r.mu.RUnlock()

	for _, o := range list {
		_ = o.Shutdown(ctx)
	}
	return nil
}

// OperateAll executes Operate concurrently across all registered PipelineOperators
// using goroutines, sync.WaitGroup, and sync.Mutex with mandatory tenant isolation filtering.
func (r *PipelineRegistry) OperateAll(ctx context.Context, payload *domain.PipelinePayload) ([]*domain.PipelineResult, error) {
	if payload == nil || payload.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	list := make([]PipelineOperator, 0, len(r.operators))
	for _, o := range r.operators {
		if o.TenantID() == "" || o.TenantID() == payload.TenantID {
			list = append(list, o)
		}
	}
	r.mu.RUnlock()

	var results []*domain.PipelineResult
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, o := range list {
		wg.Add(1)
		go func(operator PipelineOperator) {
			defer wg.Done()
			res, err := operator.Operate(ctx, payload)
			if err == nil && res != nil {
				mu.Lock()
				results = append(results, res)
				mu.Unlock()
			}
		}(o)
	}

	wg.Wait()
	return results, nil
}

// RouteAll executes Route concurrently across all registered PipelineOperators
// with mandatory tenant isolation filtering.
func (r *PipelineRegistry) RouteAll(ctx context.Context, payload *domain.PipelinePayload) (map[string]string, error) {
	if payload == nil || payload.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	list := make([]PipelineOperator, 0, len(r.operators))
	for _, o := range r.operators {
		if o.TenantID() == "" || o.TenantID() == payload.TenantID {
			list = append(list, o)
		}
	}
	r.mu.RUnlock()

	routeMap := make(map[string]string, len(list))
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, o := range list {
		wg.Add(1)
		go func(operator PipelineOperator) {
			defer wg.Done()
			target, err := operator.Route(ctx, payload)
			if err == nil {
				mu.Lock()
				routeMap[operator.ID()] = target
				mu.Unlock()
			}
		}(o)
	}

	wg.Wait()
	return routeMap, nil
}

// ReportAll executes Report concurrently across all registered PipelineOperators
// with mandatory tenant isolation filtering.
func (r *PipelineRegistry) ReportAll(ctx context.Context, payload *domain.PipelinePayload) ([]*domain.PipelineReport, error) {
	if payload == nil || payload.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	list := make([]PipelineOperator, 0, len(r.operators))
	for _, o := range r.operators {
		if o.TenantID() == "" || o.TenantID() == payload.TenantID {
			list = append(list, o)
		}
	}
	r.mu.RUnlock()

	var reports []*domain.PipelineReport
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, o := range list {
		wg.Add(1)
		go func(operator PipelineOperator) {
			defer wg.Done()
			rep, err := operator.Report(ctx, payload)
			if err == nil && rep != nil {
				mu.Lock()
				reports = append(reports, rep)
				mu.Unlock()
			}
		}(o)
	}

	wg.Wait()
	return reports, nil
}
