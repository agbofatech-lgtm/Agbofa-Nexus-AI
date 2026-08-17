package domain

import (
	// "context" unused
	"sync"
)

// InMemoryModelRegistry implements ModelRegistryRepo with in-memory storage.
type InMemoryModelRegistry struct {
	mu     sync.RWMutex
	models map[string]ModelEndpointEntity
}

func NewInMemoryModelRegistry() *InMemoryModelRegistry {
	return &InMemoryModelRegistry{models: make(map[string]ModelEndpointEntity)}
}

func (r *InMemoryModelRegistry) RegisterModel(model ModelEndpointEntity) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.models[model.ModelID] = model
	return nil
}

func (r *InMemoryModelRegistry) FindModel(modelID string) (*ModelEndpointEntity, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if m, ok := r.models[modelID]; ok {
		return &m, nil
	}
	return nil, ErrModelNotFound
}

func (r *InMemoryModelRegistry) ListModels(activeOnly bool) ([]ModelEndpointEntity, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]ModelEndpointEntity, 0, len(r.models))
	for _, m := range r.models {
		if activeOnly && !m.Active {
			continue
		}
		out = append(out, m)
	}
	return out, nil
}

// InMemoryPromptRepo implements PromptRepo with in-memory storage.
type InMemoryPromptRepo struct {
	mu      sync.RWMutex
	prompts map[string]PromptTemplateEntity
}

func NewInMemoryPromptRepo() *InMemoryPromptRepo {
	return &InMemoryPromptRepo{prompts: make(map[string]PromptTemplateEntity)}
}

func (r *InMemoryPromptRepo) SavePrompt(tmpl PromptTemplateEntity) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.prompts[tmpl.ID+":"+tmpl.Version] = tmpl
	return nil
}

func (r *InMemoryPromptRepo) GetPrompt(id, version string) (*PromptTemplateEntity, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if p, ok := r.prompts[id+":"+version]; ok {
		return &p, nil
	}
	return nil, ErrPromptNotFound
}

var (
	ErrModelNotFound  = &DomainError{Message: "model not found"}
	ErrPromptNotFound = &DomainError{Message: "prompt not found"}
)

// DomainError is a simple error type for domain-level failures.
type DomainError struct {
	Message string
}

func (e *DomainError) Error() string { return e.Message }
