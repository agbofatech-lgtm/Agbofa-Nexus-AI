package openai

import (
"context"
"encoding/json"
"net/http"
"net/http/httptest"
"strings"
"testing"
"time"

"github.com/agbofa/nexus/libs/go/pkg/llm"
)

func TestProviderIdentity(t *testing.T) {
p, err := New("test-openai-key")
if err != nil {
t.Fatal(err)
}
if p.ID() != "openai" {
t.Fatalf("ID() = %s, want openai", p.ID())
}
if p.Name() != "OpenAI" {
t.Fatalf("Name() = %s", p.Name())
}
}

func TestMissingAPIKey(t *testing.T) {
_, err := New("")
if err != ErrMissingAPIKey {
t.Fatalf("expected ErrMissingAPIKey, got %v", err)
}
}

func TestSuccessfulTextGeneration(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
auth := r.Header.Get("Authorization")
if auth != "Bearer test-openai-key" {
t.Errorf("Authorization header = %q", auth)
}
resp := openaiResponse{
Choices: []struct {
Message struct {
Content string `json:"content"`
} `json:"message"`
}{
{Message: struct {
Content string `json:"content"`
}{Content: "Hello from OpenAI"}},
},
Usage: struct {
PromptTokens     int `json:"prompt_tokens"`
CompletionTokens int `json:"completion_tokens"`
TotalTokens      int `json:"total_tokens"`
}{PromptTokens: 10, CompletionTokens: 5, TotalTokens: 15},
}
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(resp)
}))
defer server.Close()

// Override baseURL for test
originalURL := baseURL
baseURL = server.URL
defer func() { baseURL = originalURL }()

p, _ := New("test-openai-key")
resp, err := p.Generate(context.Background(), llm.CompletionRequest{
TenantID: "tenant-1",
Model:    "gpt-4o",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err != nil {
t.Fatalf("Generate: %v", err)
}
if resp.ProviderID != "openai" {
t.Fatalf("ProviderID = %s", resp.ProviderID)
}
if resp.Content != "Hello from OpenAI" {
t.Fatalf("Content = %q", resp.Content)
}
if resp.TotalTokens != 15 {
t.Fatalf("TotalTokens = %d", resp.TotalTokens)
}
}

func TestEmptyMessages(t *testing.T) {
p, _ := New("test-openai-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
TenantID: "tenant-1",
Model:    "gpt-4o",
})
if err != ErrInvalidRequest {
t.Fatalf("expected ErrInvalidRequest, got %v", err)
}
}

func TestAuthenticationError(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusUnauthorized)
}))
defer server.Close()

originalURL := baseURL
baseURL = server.URL
defer func() { baseURL = originalURL }()

p, _ := New("test-openai-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gpt-4o",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err != ErrAuthentication {
t.Fatalf("expected ErrAuthentication, got %v", err)
}
}

func TestRateLimitError(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusTooManyRequests)
}))
defer server.Close()

originalURL := baseURL
baseURL = server.URL
defer func() { baseURL = originalURL }()

p, _ := New("test-openai-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gpt-4o",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err != ErrRateLimited {
t.Fatalf("expected ErrRateLimited, got %v", err)
}
}

func TestMalformedResponse(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.Write([]byte(`{invalid json`))
}))
defer server.Close()

originalURL := baseURL
baseURL = server.URL
defer func() { baseURL = originalURL }()

p, _ := New("test-openai-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gpt-4o",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err == nil {
t.Fatal("expected error for malformed response")
}
}

func TestAPIKeyNeverInError(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusBadRequest)
w.Write([]byte(`{"error":{"message":"bad request with test-openai-key"}}`))
}))
defer server.Close()

originalURL := baseURL
baseURL = server.URL
defer func() { baseURL = originalURL }()

p, _ := New("test-openai-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gpt-4o",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err == nil {
t.Fatal("expected error")
}
if strings.Contains(err.Error(), "test-openai-key") {
t.Fatalf("API key leaked in error: %v", err)
}
}

func TestContextCancellation(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
time.Sleep(5 * time.Second)
}))
defer server.Close()

originalURL := baseURL
baseURL = server.URL
defer func() { baseURL = originalURL }()

p, _ := New("test-openai-key")
p.client = &http.Client{Timeout: 100 * time.Millisecond}

_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gpt-4o",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err == nil {
t.Fatal("expected timeout error")
}
}
