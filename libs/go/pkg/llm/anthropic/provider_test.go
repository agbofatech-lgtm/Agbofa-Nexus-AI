package anthropic

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
p, err := New("test-anthropic-key")
if err != nil {
t.Fatal(err)
}
if p.ID() != "anthropic" {
t.Fatalf("ID() = %s, want anthropic", p.ID())
}
if p.Name() != "Anthropic Claude" {
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
auth := r.Header.Get("x-api-key")
if auth != "test-anthropic-key" {
t.Errorf("x-api-key header = %q", auth)
}
version := r.Header.Get("anthropic-version")
if version == "" {
t.Error("anthropic-version header missing")
}
resp := anthropicResponse{
Content: []struct {
Type string `json:"type"`
Text string `json:"text"`
}{{Type: "text", Text: "Hello from Anthropic"}},
Usage: struct {
InputTokens  int `json:"input_tokens"`
OutputTokens int `json:"output_tokens"`
}{InputTokens: 10, OutputTokens: 5},
}
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(resp)
}))
defer server.Close()

originalURL := baseURL
baseURL = server.URL
defer func() { baseURL = originalURL }()

p, _ := New("test-anthropic-key")
resp, err := p.Generate(context.Background(), llm.CompletionRequest{
TenantID: "tenant-1",
Model:    "claude-3-5-sonnet",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err != nil {
t.Fatalf("Generate: %v", err)
}
if resp.ProviderID != "anthropic" {
t.Fatalf("ProviderID = %s", resp.ProviderID)
}
if resp.Content != "Hello from Anthropic" {
t.Fatalf("Content = %q", resp.Content)
}
if resp.TotalTokens != 15 {
t.Fatalf("TotalTokens = %d", resp.TotalTokens)
}
}

func TestSystemPromptExtraction(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
var body map[string]any
json.NewDecoder(r.Body).Decode(&body)
if system, ok := body["system"].(string); ok {
if system != "You are a helpful assistant" {
t.Errorf("system = %q", system)
}
} else {
t.Error("system prompt not extracted")
}
resp := anthropicResponse{
Content: []struct {
Type string `json:"type"`
Text string `json:"text"`
}{{Type: "text", Text: "Response"}},
}
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(resp)
}))
defer server.Close()

originalURL := baseURL
baseURL = server.URL
defer func() { baseURL = originalURL }()

p, _ := New("test-anthropic-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model: "claude-3-5-sonnet",
Messages: []llm.Message{
{Role: "system", Content: "You are a helpful assistant"},
{Role: "user", Content: "Hello"},
},
})
if err != nil {
t.Fatalf("Generate: %v", err)
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

p, _ := New("test-anthropic-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "claude-3-5-sonnet",
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

p, _ := New("test-anthropic-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "claude-3-5-sonnet",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err != ErrRateLimited {
t.Fatalf("expected ErrRateLimited, got %v", err)
}
}

func TestMalformedResponse(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.Write([]byte(`{invalid`))
}))
defer server.Close()

originalURL := baseURL
baseURL = server.URL
defer func() { baseURL = originalURL }()

p, _ := New("test-anthropic-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "claude-3-5-sonnet",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err == nil {
t.Fatal("expected error for malformed response")
}
}

func TestAPIKeyNeverInError(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusBadRequest)
}))
defer server.Close()

originalURL := baseURL
baseURL = server.URL
defer func() { baseURL = originalURL }()

p, _ := New("test-anthropic-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "claude-3-5-sonnet",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err == nil {
t.Fatal("expected error")
}
if strings.Contains(err.Error(), "test-anthropic-key") {
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

p, _ := New("test-anthropic-key")
p.client = &http.Client{Timeout: 100 * time.Millisecond}

_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "claude-3-5-sonnet",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err == nil {
t.Fatal("expected timeout error")
}
}
