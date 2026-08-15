package gemini

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

func newTestProvider(t *testing.T, serverURL string) *GeminiProvider {
t.Helper()
p, err := New("test-gemini-key")
if err != nil {
t.Fatal(err)
}
p.client = &http.Client{Timeout: 10 * time.Second}
// Override baseURL for test server
originalBaseURL := baseURL
baseURL = serverURL
t.Cleanup(func() { baseURL = originalBaseURL })
return p
}

func TestProviderIdentity(t *testing.T) {
p, err := New("test-gemini-key")
if err != nil {
t.Fatal(err)
}
if p.ID() != "gemini" {
t.Fatalf("ID() = %s, want gemini", p.ID())
}
if p.Name() != "Google Gemini" {
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
// Verify API key is in URL query
if !strings.Contains(r.URL.RawQuery, "key=test-gemini-key") {
t.Errorf("API key missing from request URL")
}
resp := geminiResponse{
Candidates: []struct {
Content struct {
Parts []struct {
Text string `json:"text"`
} `json:"parts"`
} `json:"content"`
}{
{Content: struct {
Parts []struct {
Text string `json:"text"`
} `json:"parts"`
}{Parts: []struct {
Text string `json:"text"`
}{{Text: "Hello from Gemini"}}}},
},
UsageMetadata: struct {
PromptTokenCount     int `json:"promptTokenCount"`
CandidatesTokenCount int `json:"candidatesTokenCount"`
TotalTokenCount      int `json:"totalTokenCount"`
}{PromptTokenCount: 10, CandidatesTokenCount: 5, TotalTokenCount: 15},
}
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(resp)
}))
defer server.Close()

p := newTestProvider(t, server.URL)

resp, err := p.Generate(context.Background(), llm.CompletionRequest{
TenantID: "tenant-1",
Model:    "gemini-1.5-flash",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err != nil {
t.Fatalf("Generate: %v", err)
}
if resp.ProviderID != "gemini" {
t.Fatalf("ProviderID = %s", resp.ProviderID)
}
if resp.Content != "Hello from Gemini" {
t.Fatalf("Content = %q", resp.Content)
}
if resp.TotalTokens != 15 {
t.Fatalf("TotalTokens = %d, want 15", resp.TotalTokens)
}
}

func TestEmptyMessages(t *testing.T) {
p, _ := New("test-gemini-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
TenantID: "tenant-1",
Model:    "gemini-1.5-flash",
})
if err != ErrInvalidRequest {
t.Fatalf("expected ErrInvalidRequest, got %v", err)
}
}

func TestEmptyModel(t *testing.T) {
p, _ := New("test-gemini-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
TenantID: "tenant-1",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err != ErrInvalidRequest {
t.Fatalf("expected ErrInvalidRequest, got %v", err)
}
}

func TestAuthenticationError(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusUnauthorized)
w.Write([]byte(`{"error":{"message":"invalid api key"}}`))
}))
defer server.Close()

p := newTestProvider(t, server.URL)
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gemini-1.5-flash",
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

p := newTestProvider(t, server.URL)
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gemini-1.5-flash",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err != ErrRateLimited {
t.Fatalf("expected ErrRateLimited, got %v", err)
}
}

func TestProviderUnavailable(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusInternalServerError)
}))
defer server.Close()

p := newTestProvider(t, server.URL)
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gemini-1.5-flash",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err != ErrProviderUnavailable {
t.Fatalf("expected ErrProviderUnavailable, got %v", err)
}
}

func TestMalformedResponse(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.Write([]byte(`{invalid json`))
}))
defer server.Close()

p := newTestProvider(t, server.URL)
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gemini-1.5-flash",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err == nil {
t.Fatal("expected error for malformed response")
}
}

func TestAPIKeyNeverInError(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusBadRequest)
w.Write([]byte(`{"error":{"message":"bad request with key=test-gemini-key"}}`))
}))
defer server.Close()

p := newTestProvider(t, server.URL)
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gemini-1.5-flash",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err == nil {
t.Fatal("expected error")
}
if strings.Contains(err.Error(), "test-gemini-key") {
t.Fatalf("API key leaked in error: %v", err)
}
}

func TestUnsupportedAttachment(t *testing.T) {
p, _ := New("test-gemini-key")
_, err := p.Generate(context.Background(), llm.CompletionRequest{
Model:    "gemini-1.5-flash",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
Attachments: []llm.MediaAttachment{
{Type: "video_file", Format: "video/mp4", Data: []byte("fake")},
},
})
if err == nil {
t.Fatal("expected error for unsupported attachment type")
}
}

func TestContextCancellation(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// Simulate slow response
time.Sleep(5 * time.Second)
}))
defer server.Close()

p := newTestProvider(t, server.URL)
ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
defer cancel()

_, err := p.Generate(ctx, llm.CompletionRequest{
Model:    "gemini-1.5-flash",
Messages: []llm.Message{{Role: "user", Content: "Hello"}},
})
if err == nil {
t.Fatal("expected timeout error")
}
}