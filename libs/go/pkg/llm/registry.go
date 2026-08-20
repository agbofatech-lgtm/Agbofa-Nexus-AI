package llm

import (
	"fmt"
	"strings"
	"sync"
)

// Registry maps public model IDs to a provider and remote model name.
type Registry struct {
	mu     sync.RWMutex
	models map[string]ModelSpec
}

func NewRegistry(models ...ModelSpec) *Registry {
	r := &Registry{models: map[string]ModelSpec{}}
	for _, model := range models {
		r.Register(model)
	}
	return r
}

func DefaultRegistry() *Registry {
	return NewRegistry(
		ModelSpec{ID: "openai:gpt-4o-mini", Provider: "openai", RemoteModel: "gpt-4o-mini", InputPer1K: 150, OutputPer1K: 600, Currency: "USD", MaxTokens: 4096},
		ModelSpec{ID: "openai:gpt-4o", Provider: "openai", RemoteModel: "gpt-4o", InputPer1K: 2500, OutputPer1K: 10000, Currency: "USD", MaxTokens: 4096},
		ModelSpec{ID: "anthropic:claude-3-5-haiku", Provider: "anthropic", RemoteModel: "claude-3-5-haiku-20241022", InputPer1K: 800, OutputPer1K: 4000, Currency: "USD", MaxTokens: 4096},
		ModelSpec{ID: "anthropic:claude-3-5-sonnet", Provider: "anthropic", RemoteModel: "claude-3-5-sonnet-20241022", InputPer1K: 3000, OutputPer1K: 15000, Currency: "USD", MaxTokens: 4096},
	)
}

func (r *Registry) Register(spec ModelSpec) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.models[strings.TrimSpace(spec.ID)] = spec
}

func (r *Registry) Lookup(id string) (ModelSpec, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	spec, ok := r.models[strings.TrimSpace(id)]
	if !ok {
		return ModelSpec{}, fmt.Errorf("%w: %s", ErrUnknownModel, id)
	}
	return spec, nil
}

func (r *Registry) All() []ModelSpec {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]ModelSpec, 0, len(r.models))
	for _, spec := range r.models {
		out = append(out, spec)
	}
	return out
}

func EstimateCost(spec ModelSpec, usage Usage) Cost {
	if spec.InputPer1K == 0 && spec.OutputPer1K == 0 {
		return Cost{Currency: spec.Currency, Source: "none"}
	}
	micros := (int64(usage.PromptTokens)*spec.InputPer1K + int64(usage.CompletionTokens)*spec.OutputPer1K) / 1000
	return Cost{Currency: first(spec.Currency, "USD"), EstimatedMicros: micros, Source: "registry"}
}

func first(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
