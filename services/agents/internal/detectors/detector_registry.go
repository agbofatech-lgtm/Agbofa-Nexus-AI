package detectors

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// DetectorRegistry manages registration, lifecycle, and concurrent execution
// of all ContentDetectors in IMP-017-B (AGT-009 through AGT-016).
type DetectorRegistry struct {
	mu        sync.RWMutex
	detectors map[string]ContentDetector
}

func NewDetectorRegistry() *DetectorRegistry {
	return &DetectorRegistry{
		detectors: make(map[string]ContentDetector, 8),
	}
}

func (r *DetectorRegistry) RegisterDetector(detector ContentDetector) error {
	if detector == nil {
		return fmt.Errorf("cannot register nil content detector")
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.detectors[detector.ID()] = detector
	return nil
}

func (r *DetectorRegistry) GetDetector(detectorID string) (ContentDetector, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	d, ok := r.detectors[detectorID]
	if !ok {
		return nil, fmt.Errorf("content detector %s not found in registry", detectorID)
	}
	return d, nil
}

func (r *DetectorRegistry) ListDetectors() []ContentDetector {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]ContentDetector, 0, len(r.detectors))
	for _, d := range r.detectors {
		list = append(list, d)
	}
	return list
}

func (r *DetectorRegistry) InitializeAll(ctx context.Context, tenantID string, config map[string]string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	r.mu.RLock()
	list := make([]ContentDetector, 0, len(r.detectors))
	for _, d := range r.detectors {
		list = append(list, d)
	}
	r.mu.RUnlock()

	for _, d := range list {
		if err := d.Initialize(ctx, tenantID, config); err != nil {
			return fmt.Errorf("failed to initialize detector %s: %w", d.ID(), err)
		}
	}
	return nil
}

func (r *DetectorRegistry) HealthCheckAll(ctx context.Context) (map[string]*domain.SourceHealth, error) {
	r.mu.RLock()
	list := make([]ContentDetector, 0, len(r.detectors))
	for _, d := range r.detectors {
		list = append(list, d)
	}
	r.mu.RUnlock()

	healthMap := make(map[string]*domain.SourceHealth, len(list))
	for _, d := range list {
		h, err := d.HealthCheck(ctx)
		if err != nil || h == nil {
			healthMap[d.ID()] = &domain.SourceHealth{
				SourceID:     d.ID(),
				TenantID:     d.TenantID(),
				Status:       "OFFLINE",
				LastCheckAt:  time.Now(),
				ErrorMessage: fmt.Sprintf("%v", err),
			}
		} else {
			healthMap[d.ID()] = h
		}
	}
	return healthMap, nil
}

func (r *DetectorRegistry) ShutdownAll(ctx context.Context) error {
	r.mu.RLock()
	list := make([]ContentDetector, 0, len(r.detectors))
	for _, d := range r.detectors {
		list = append(list, d)
	}
	r.mu.RUnlock()

	for _, d := range list {
		_ = d.Shutdown(ctx)
	}
	return nil
}

// DetectAll executes Detect concurrently across all registered ContentDetectors
// using goroutines, sync.WaitGroup, and sync.Mutex per IMP-017-B concurrency rules.
func (r *DetectorRegistry) DetectAll(ctx context.Context, signal *domain.MonitorSignal) ([]*domain.DetectionResult, error) {
	if signal == nil || signal.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	list := make([]ContentDetector, 0, len(r.detectors))
	for _, d := range r.detectors {
		if d.TenantID() == "" || d.TenantID() == signal.TenantID {
			list = append(list, d)
		}
	}
	r.mu.RUnlock()

	var results []*domain.DetectionResult
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, d := range list {
		wg.Add(1)
		go func(detector ContentDetector) {
			defer wg.Done()
			res, err := detector.Detect(ctx, signal)
			if err == nil && res != nil {
				mu.Lock()
				results = append(results, res)
				mu.Unlock()
			}
		}(d)
	}

	wg.Wait()
	return results, nil
}
