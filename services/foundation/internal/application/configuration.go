package application

import (
	"context"
	"fmt"
)

type ConfigurationBundle struct {
	Namespace string
	Values    map[string]string
	Version   int64
}

type ConfigurationChange struct {
	Key      string
	OldValue string
	NewValue string
}

type ConfigurationRepository interface {
	GetBundle(ctx context.Context, namespace string) (ConfigurationBundle, error)
	SetBundle(ctx context.Context, namespace string, values map[string]string, modifiedBy string) (ConfigurationBundle, []ConfigurationChange, error)
}

type ConfigurationEventPublisher interface {
	PublishConfigurationUpdated(ctx context.Context, bundle ConfigurationBundle, changes []ConfigurationChange) error
}

type ConfigurationService struct {
	repository ConfigurationRepository
	events     ConfigurationEventPublisher
}

func NewConfigurationService(repository ConfigurationRepository, events ConfigurationEventPublisher) *ConfigurationService {
	return &ConfigurationService{repository: repository, events: events}
}

func (s *ConfigurationService) GetConfiguration(ctx context.Context, namespace string) (ConfigurationBundle, error) {
	bundle, err := s.repository.GetBundle(ctx, namespace)
	if err != nil {
		return ConfigurationBundle{}, fmt.Errorf("get configuration bundle: %w", err)
	}
	return bundle, nil
}

// WatchConfiguration is DEFERRED for Phase 01.
// Lifecycle, cancellation, reconnection, backpressure, authorization, and
// tenant scope must be defined before a streaming Watch is implemented.
// Get and Set remain the current production configuration RPCs.

func (s *ConfigurationService) SetConfiguration(ctx context.Context, namespace string, values map[string]string, modifiedBy string) (ConfigurationBundle, error) {
	bundle, changes, err := s.repository.SetBundle(ctx, namespace, values, modifiedBy)
	if err != nil {
		return ConfigurationBundle{}, fmt.Errorf("set configuration bundle: %w", err)
	}
	if err := s.events.PublishConfigurationUpdated(ctx, bundle, changes); err != nil {
		return ConfigurationBundle{}, fmt.Errorf("publish configuration updated: %w", err)
	}
	return bundle, nil
}
