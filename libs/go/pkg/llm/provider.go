package llm

import (
	"context"
	"errors"
	"fmt"
	"time"
)

var (
	ErrNoProviderAvailable = errors.New("no llm provider available for route")
	ErrQuotaExceeded       = errors.New("tenant token quota exceeded")
	ErrRateLimitExceeded   = errors.New("provider rate limit exceeded")
)

type Message struct {
	Role    string
	Content string
}

type ModelParameters struct {
	Temperature float64
	MaxTokens   int
	TopP        float64
}

type CompletionRequest struct {
	TenantID  string
	Model     string
	Messages  []Message
	Params    ModelParameters
	Context   map[string]string
}

type CompletionResponse struct {
	ProviderID       string
	Model            string
	Content          string
	PromptTokens     int
	CompletionTokens int
	TotalTokens      int
	Latency          time.Duration
}

type Provider interface {
	ID() string
	Name() string
	Generate(ctx context.Context, req CompletionRequest) (CompletionResponse, error)
}

type ModelRoutePolicy struct {
	Name               string
	PrimaryProvider    string
	FallbackProviders  []string
	MaxTokensPerMinute int
	Timeout            time.Duration
}

type FallbackRouter struct {
	providers map[string]Provider
}

func NewFallbackRouter(providers []Provider) *FallbackRouter {
	pm := make(map[string]Provider, len(providers))
	for _, p := range providers {
		pm[p.ID()] = p
	}
	return &FallbackRouter{providers: pm}
}

func (r *FallbackRouter) Route(ctx context.Context, req CompletionRequest, policy ModelRoutePolicy) (CompletionResponse, error) {
	candidates := append([]string{policy.PrimaryProvider}, policy.FallbackProviders...)
	var lastErr error
	for _, pid := range candidates {
		provider, ok := r.providers[pid]
		if !ok {
			lastErr = fmt.Errorf("provider %s not registered", pid)
			continue
		}
		resp, err := provider.Generate(ctx, req)
		if err == nil {
			return resp, nil
		}
		lastErr = err
	}
	if lastErr != nil {
		return CompletionResponse{}, fmt.Errorf("%w: %v", ErrNoProviderAvailable, lastErr)
	}
	return CompletionResponse{}, ErrNoProviderAvailable
}
