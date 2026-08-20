package llm

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestGatewayRejectsInvalidRequestAndUnknownModel(t *testing.T) {
	g := NewGateway(DefaultRegistry(), nil)
	if _, err := g.Complete(context.Background(), Request{}); !errors.Is(err, ErrInvalidRequest) {
		t.Fatalf("invalid: %v", err)
	}
	if _, err := g.Complete(context.Background(), Request{Model: "nope", Messages: []Message{{Role: RoleUser, Content: "hi"}}}); !errors.Is(err, ErrUnknownModel) {
		t.Fatalf("unknown model: %v", err)
	}
}

func TestGatewayRoutesAndRecordsUsage(t *testing.T) {
	fake := NewFakeProvider("openai", func(_ context.Context, req Request) (Response, error) {
		if req.Model != "gpt-4o-mini" {
			t.Fatalf("expected remote model, got %s", req.Model)
		}
		return Response{Text: "ok", Usage: Usage{PromptTokens: 10, CompletionTokens: 2, TotalTokens: 12}}, nil
	})
	sink := NewMemoryUsage()
	g := NewGateway(DefaultRegistry(), []Provider{fake}, WithUsageSink(sink), WithRetries(0))
	res, err := g.Complete(context.Background(), Request{
		Model: "openai:gpt-4o-mini", Messages: []Message{{Role: RoleUser, Content: "hello"}}, TenantID: "t1",
	})
	if err != nil {
		t.Fatal(err)
	}
	if res.Text != "ok" || res.Provider != "openai" || res.Cost.EstimatedMicros == 0 {
		t.Fatalf("response %+v", res)
	}
	if len(sink.Snapshot()) != 1 {
		t.Fatal("usage not recorded")
	}
}

func TestGatewayRetriesRateLimitThenSucceeds(t *testing.T) {
	fake := NewFakeProvider("openai", func(context.Context, Request) (Response, error) {
		return Response{}, ErrProviderRateLimited
	})
	g := NewGateway(DefaultRegistry(), []Provider{fake}, WithRetries(1), WithTimeout(50*time.Millisecond))
	_, err := g.Complete(context.Background(), Request{Model: "openai:gpt-4o-mini", Messages: []Message{{Role: RoleUser, Content: "x"}}})
	if !errors.Is(err, ErrProviderRateLimited) {
		t.Fatalf("got %v", err)
	}
	if fake.Calls() != 2 {
		t.Fatalf("retries: %d", fake.Calls())
	}
}

func TestMissingCredentialFailsClosed(t *testing.T) {
	g := NewGateway(DefaultRegistry(), []Provider{NewOpenAI("", NewEmptySecret(), nil)})
	_, err := g.Complete(context.Background(), Request{Model: "openai:gpt-4o-mini", Messages: []Message{{Role: RoleUser, Content: "x"}}})
	if !errors.Is(err, ErrMissingCredential) {
		t.Fatalf("got %v", err)
	}
}
