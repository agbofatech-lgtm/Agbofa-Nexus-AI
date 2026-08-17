package infrastructure

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
	"github.com/agbofa/nexus/services/agents/internal/platforms"
)

// PlatformRegistry manages registration, lifecycle, and health monitoring
// of all SourceConnectors and PlatformConnectors in IMP-017-A.
type PlatformRegistry struct {
	mu         sync.RWMutex
	sources    map[string]application.SourceConnector
	connectors map[string]platforms.PlatformConnector
}

func NewPlatformRegistry() *PlatformRegistry {
	return &PlatformRegistry{
		sources:    make(map[string]application.SourceConnector),
		connectors: make(map[string]platforms.PlatformConnector),
	}
}

func (r *PlatformRegistry) RegisterSource(source application.SourceConnector) error {
	if source == nil {
		return fmt.Errorf("cannot register nil source connector")
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sources[source.ID()] = source
	return nil
}

func (r *PlatformRegistry) GetSource(sourceID string) (application.SourceConnector, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	src, ok := r.sources[sourceID]
	if !ok {
		return nil, fmt.Errorf("source connector %s not found in registry", sourceID)
	}
	return src, nil
}

func (r *PlatformRegistry) ListSources() []application.SourceConnector {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]application.SourceConnector, 0, len(r.sources))
	for _, s := range r.sources {
		list = append(list, s)
	}
	return list
}

func (r *PlatformRegistry) RegisterConnector(connector platforms.PlatformConnector) error {
	if connector == nil {
		return fmt.Errorf("cannot register nil platform connector")
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.connectors[connector.PlatformName()] = connector
	return nil
}

func (r *PlatformRegistry) GetConnector(platformName string) (platforms.PlatformConnector, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	c, ok := r.connectors[platformName]
	if !ok {
		return nil, fmt.Errorf("platform connector %s not found in registry", platformName)
	}
	return c, nil
}

func (r *PlatformRegistry) ListConnectors() []platforms.PlatformConnector {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]platforms.PlatformConnector, 0, len(r.connectors))
	for _, c := range r.connectors {
		list = append(list, c)
	}
	return list
}

func (r *PlatformRegistry) InitializeAll(ctx context.Context, tenantID string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	r.mu.RLock()
	sources := make([]application.SourceConnector, 0, len(r.sources))
	for _, s := range r.sources {
		sources = append(sources, s)
	}
	connectors := make([]platforms.PlatformConnector, 0, len(r.connectors))
	for _, c := range r.connectors {
		connectors = append(connectors, c)
	}
	r.mu.RUnlock()

	for _, s := range sources {
		cfg := domain.SourceConfig{
			SourceID:            s.ID(),
			TenantID:            tenantID,
			SourceType:          s.SourceType(),
			Name:                s.Name(),
			PollIntervalSeconds: 60,
		}
		if err := s.Initialize(ctx, cfg); err != nil {
			return fmt.Errorf("failed to initialize source %s: %w", s.ID(), err)
		}
	}

	for _, c := range connectors {
		cfg := platforms.ConnectorConfig{
			"tenant_id": tenantID,
			"platform":  c.PlatformName(),
		}
		if err := c.Initialize(ctx, cfg); err != nil {
			return fmt.Errorf("failed to initialize connector %s: %w", c.PlatformName(), err)
		}
	}
	return nil
}

func (r *PlatformRegistry) HealthCheckAll(ctx context.Context) (map[string]*domain.SourceHealth, error) {
	r.mu.RLock()
	sources := make([]application.SourceConnector, 0, len(r.sources))
	for _, s := range r.sources {
		sources = append(sources, s)
	}
	connectors := make([]platforms.PlatformConnector, 0, len(r.connectors))
	for _, c := range r.connectors {
		connectors = append(connectors, c)
	}
	r.mu.RUnlock()

	healthMap := make(map[string]*domain.SourceHealth)
	for _, s := range sources {
		h, err := s.HealthCheck(ctx)
		if err != nil || h == nil {
			healthMap[s.ID()] = &domain.SourceHealth{
				SourceID:     s.ID(),
				Status:       "OFFLINE",
				LastCheckAt:  time.Now(),
				ErrorMessage: fmt.Sprintf("%v", err),
			}
		} else {
			healthMap[s.ID()] = h
		}
	}

	for _, c := range connectors {
		h, err := c.HealthCheck(ctx)
		if err != nil || h == nil {
			healthMap[c.PlatformName()] = &domain.SourceHealth{
				SourceID:     c.PlatformName(),
				Status:       "OFFLINE",
				LastCheckAt:  time.Now(),
				ErrorMessage: fmt.Sprintf("%v", err),
			}
		} else {
			healthMap[c.PlatformName()] = h
		}
	}

	return healthMap, nil
}

func (r *PlatformRegistry) ShutdownAll(ctx context.Context) error {
	r.mu.RLock()
	sources := make([]application.SourceConnector, 0, len(r.sources))
	for _, s := range r.sources {
		sources = append(sources, s)
	}
	connectors := make([]platforms.PlatformConnector, 0, len(r.connectors))
	for _, c := range r.connectors {
		connectors = append(connectors, c)
	}
	r.mu.RUnlock()

	for _, s := range sources {
		_ = s.Shutdown(ctx)
	}
	for _, c := range connectors {
		_ = c.Shutdown(ctx)
	}
	return nil
}
