package interfaces

import (
	"context"
	"fmt"
	"sync"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type HealthStatus string

const (
	HealthStatusServing    HealthStatus = "SERVING"
	HealthStatusNotServing HealthStatus = "NOT_SERVING"
)

type HealthChecker struct {
	mu                     sync.RWMutex
	status                 HealthStatus
	personalizationEngines map[string]domain.PersonalizationEngine
}

func NewHealthChecker() *HealthChecker {
	return &HealthChecker{
		status:                 HealthStatusServing,
		personalizationEngines: make(map[string]domain.PersonalizationEngine),
	}
}

func (h *HealthChecker) RegisterPersonalizationEngine(engine domain.PersonalizationEngine) {
	if engine == nil {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.personalizationEngines == nil {
		h.personalizationEngines = make(map[string]domain.PersonalizationEngine)
	}
	h.personalizationEngines[engine.ID()] = engine
}

func (h *HealthChecker) GetPersonalizationEngineStatus() map[string]string {
	h.mu.RLock()
	defer h.mu.RUnlock()
	statusMap := make(map[string]string)
	for id := range h.personalizationEngines {
		statusMap[id] = "ACTIVE"
	}
	return statusMap
}

func (h *HealthChecker) Check(ctx context.Context, service string) (HealthStatus, error) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if h.status == HealthStatusNotServing {
		return HealthStatusNotServing, nil
	}
	if service == "" || service == "personalization" {
		if len(h.personalizationEngines) < 5 {
			return HealthStatusNotServing, fmt.Errorf("personalization: %d/5 engines registered", len(h.personalizationEngines))
		}
	}
	return h.status, nil
}

func (h *HealthChecker) SetStatus(status HealthStatus) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.status = status
}
