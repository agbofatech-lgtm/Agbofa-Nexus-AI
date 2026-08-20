package llm

import (
	"context"
	"sync/atomic"
)

// FakeProvider is test-only. It must never be constructed from production config.
type FakeProvider struct {
	name     string
	handler  func(context.Context, Request) (Response, error)
	calls    atomic.Int32
}

func NewFakeProvider(name string, handler func(context.Context, Request) (Response, error)) *FakeProvider {
	if name == "" {
		name = "fake"
	}
	return &FakeProvider{name: name, handler: handler}
}

func (p *FakeProvider) Name() string { return p.name }

func (p *FakeProvider) Calls() int { return int(p.calls.Load()) }

func (p *FakeProvider) Health(context.Context) Health {
	return Health{Provider: p.name, Available: true, Reason: "test-only fake"}
}

func (p *FakeProvider) Complete(ctx context.Context, req Request) (Response, error) {
	p.calls.Add(1)
	if p.handler == nil {
		return Response{}, ErrSimulatedForbidden
	}
	return p.handler(ctx, req)
}
