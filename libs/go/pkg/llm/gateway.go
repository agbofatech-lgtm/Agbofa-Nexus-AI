package llm

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
)

// Gateway routes normalized requests to a real provider adapter.
type Gateway struct {
	registry *Registry
	providers map[string]Provider
	usage    UsageSink
	timeout  time.Duration
	retries  int
	now      func() time.Time
}

type GatewayOption func(*Gateway)

func WithTimeout(d time.Duration) GatewayOption { return func(g *Gateway) { g.timeout = d } }
func WithRetries(n int) GatewayOption           { return func(g *Gateway) { g.retries = n } }
func WithUsageSink(s UsageSink) GatewayOption   { return func(g *Gateway) { g.usage = s } }

func NewGateway(registry *Registry, providers []Provider, opts ...GatewayOption) *Gateway {
	g := &Gateway{
		registry:  registry,
		providers: map[string]Provider{},
		timeout:   30 * time.Second,
		retries:   2,
		now:       time.Now,
	}
	for _, provider := range providers {
		if provider != nil {
			g.providers[provider.Name()] = provider
		}
	}
	for _, opt := range opts {
		opt(g)
	}
	return g
}

func (g *Gateway) Complete(ctx context.Context, req Request) (Response, error) {
	if err := validateRequest(req); err != nil {
		return Response{}, err
	}
	spec, err := g.registry.Lookup(req.Model)
	if err != nil {
		return Response{}, err
	}
	provider, ok := g.providers[spec.Provider]
	if !ok {
		return Response{}, fmt.Errorf("%w: %s", ErrUnknownProvider, spec.Provider)
	}
	forward := req
	forward.Model = spec.RemoteModel
	if forward.MaxTokens <= 0 || (spec.MaxTokens > 0 && forward.MaxTokens > spec.MaxTokens) {
		forward.MaxTokens = spec.MaxTokens
	}
	timeout := g.timeout
	if req.Timeout > 0 {
		timeout = req.Timeout
	}
	start := g.now()
	res, err := withRetries(ctx, g.retries, timeout, func(callCtx context.Context) (Response, error) {
		return provider.Complete(callCtx, forward)
	})
	res.Provider = spec.Provider
	if res.Model == "" {
		res.Model = spec.ID
	} else {
		res.Model = spec.ID
	}
	res.Latency = g.now().Sub(start)
	if res.Cost.Source == "" {
		res.Cost = EstimateCost(spec, res.Usage)
	}
	if g.usage != nil {
		g.usage.Record(ctx, req, res, err)
	}
	return res, err
}

func (g *Gateway) Health(ctx context.Context) []Health {
	out := make([]Health, 0, len(g.providers))
	for _, provider := range g.providers {
		out = append(out, provider.Health(ctx))
	}
	return out
}

func (g *Gateway) Models() []ModelSpec { return g.registry.All() }

func validateRequest(req Request) error {
	if strings.TrimSpace(req.Model) == "" {
		return fmt.Errorf("%w: model is required", ErrInvalidRequest)
	}
	if len(req.Messages) == 0 {
		return fmt.Errorf("%w: messages are required", ErrInvalidRequest)
	}
	for _, msg := range req.Messages {
		if strings.TrimSpace(string(msg.Role)) == "" || strings.TrimSpace(msg.Content) == "" {
			return fmt.Errorf("%w: message role and content are required", ErrInvalidRequest)
		}
	}
	return nil
}

func withRetries(ctx context.Context, retries int, timeout time.Duration, fn func(context.Context) (Response, error)) (Response, error) {
	var last Response
	var lastErr error
	attempts := retries + 1
	if attempts < 1 {
		attempts = 1
	}
	for i := 0; i < attempts; i++ {
		if ctx.Err() != nil {
			return last, fmt.Errorf("%w: %v", ErrProviderTimeout, ctx.Err())
		}
		callCtx, cancel := context.WithTimeout(ctx, timeout)
		last, lastErr = fn(callCtx)
		cancel()
		if lastErr == nil {
			return last, nil
		}
		if !retryable(lastErr) || i == attempts-1 {
			return last, lastErr
		}
		select {
		case <-ctx.Done():
			return last, fmt.Errorf("%w: %v", ErrProviderTimeout, ctx.Err())
		case <-time.After(time.Duration(i+1) * 200 * time.Millisecond):
		}
	}
	return last, lastErr
}

func retryable(err error) bool {
	return errors.Is(err, ErrProviderRateLimited) || errors.Is(err, ErrProviderTimeout) || errors.Is(err, ErrProviderFailed)
}
