package llm

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/agbofa/nexus/libs/go/pkg/config"
)

func TestOpenAICompleteAgainstHTTPTestServer(t *testing.T) {
	var sawAuth bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.Header.Get("Authorization"), "Bearer sk-test") {
			sawAuth = true
		}
		if r.URL.Path != "/chat/completions" {
			t.Fatalf("path %s", r.URL.Path)
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"id":    "cmpl-1",
			"model": "gpt-4o-mini",
			"choices": []map[string]any{{
				"finish_reason": "stop",
				"message":       map[string]any{"content": "real-provider-shaped"},
			}},
			"usage": map[string]any{"prompt_tokens": 3, "completion_tokens": 2, "total_tokens": 5},
		})
	}))
	t.Cleanup(srv.Close)

	p := NewOpenAI(srv.URL, config.NewSecret("ai/openai/api_key", "sk-test"), srv.Client())
	res, err := p.Complete(context.Background(), Request{Model: "gpt-4o-mini", Messages: []Message{{Role: RoleUser, Content: "hi"}}})
	if err != nil {
		t.Fatal(err)
	}
	if !sawAuth || res.Text != "real-provider-shaped" || res.Usage.TotalTokens != 5 {
		t.Fatalf("res=%+v auth=%v", res, sawAuth)
	}
}

func TestOpenAIMapsUnauthorized(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"bad key"}`))
	}))
	t.Cleanup(srv.Close)
	p := NewOpenAI(srv.URL, config.NewSecret("k", "sk-bad"), srv.Client())
	_, err := p.Complete(context.Background(), Request{Model: "gpt-4o-mini", Messages: []Message{{Role: RoleUser, Content: "hi"}}})
	if !errors.Is(err, ErrProviderUnauthorized) {
		t.Fatalf("expected unauthorized, got %v", err)
	}
}