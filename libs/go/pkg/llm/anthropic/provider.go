// Package anthropic implements the Anthropic provider adapter against the
// existing llm.Provider contract.
//
// API key comes from ANTHROPIC_API_KEY environment variable.
// Server-side only. Never exposed to browser or BFF.
//
// IMP-AI-GATEWAY-001 - Batch 3
package anthropic

import (
"bytes"
"context"
"encoding/json"
"errors"
"fmt"
"io"
"net/http"
"os"
"strings"
"time"

"github.com/agbofa/nexus/libs/go/pkg/llm"
)

const (
ProviderID = "anthropic"
baseURL    = "https://api.anthropic.com/v1"
version    = "2023-06-01"
)

var (
ErrMissingAPIKey       = errors.New("anthropic api key is required")
ErrAuthentication      = errors.New("anthropic authentication failed")
ErrRateLimited         = errors.New("anthropic rate limit exceeded")
ErrUnsupportedModel    = errors.New("anthropic model not supported")
ErrInvalidRequest      = errors.New("anthropic invalid request")
ErrProviderUnavailable = errors.New("anthropic provider unavailable")
ErrMalformedResponse   = errors.New("anthropic malformed response")
)

// AnthropicProvider implements llm.Provider for Anthropic Claude.
type AnthropicProvider struct {
apiKey string
client *http.Client
}

func New(apiKey string) (*AnthropicProvider, error) {
if apiKey == "" {
return nil, ErrMissingAPIKey
}
return &AnthropicProvider{
apiKey: apiKey,
client: &http.Client{Timeout: 60 * time.Second},
}, nil
}

func NewFromEnv() (*AnthropicProvider, error) {
return New(strings.TrimSpace(os.Getenv("ANTHROPIC_API_KEY")))
}

func (p *AnthropicProvider) ID() string   { return ProviderID }
func (p *AnthropicProvider) Name() string { return "Anthropic Claude" }

func (p *AnthropicProvider) Generate(ctx context.Context, req llm.CompletionRequest) (llm.CompletionResponse, error) {
if p.apiKey == "" {
return llm.CompletionResponse{}, ErrMissingAPIKey
}
if req.Model == "" {
return llm.CompletionResponse{}, ErrInvalidRequest
}
if len(req.Messages) == 0 {
return llm.CompletionResponse{}, ErrInvalidRequest
}

systemPrompt, messages := toAnthropicMessages(req.Messages)

requestBody := map[string]any{
"model":       req.Model,
"max_tokens":  req.Params.MaxTokens,
"temperature": req.Params.Temperature,
"messages":    messages,
}
if systemPrompt != "" {
requestBody["system"] = systemPrompt
}
if req.Params.MaxTokens == 0 {
requestBody["max_tokens"] = 1000
}
if req.Params.Temperature == 0 {
requestBody["temperature"] = 0.7
}
if req.Params.TopP > 0 {
requestBody["top_p"] = req.Params.TopP
}

body, err := json.Marshal(requestBody)
if err != nil {
return llm.CompletionResponse{}, fmt.Errorf("marshal anthropic request: %w", err)
}

httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/messages", bytes.NewReader(body))
if err != nil {
return llm.CompletionResponse{}, err
}
httpReq.Header.Set("Content-Type", "application/json")
httpReq.Header.Set("x-api-key", p.apiKey)
httpReq.Header.Set("anthropic-version", version)

resp, err := p.client.Do(httpReq)
if err != nil {
if ctx.Err() == context.DeadlineExceeded {
return llm.CompletionResponse{}, ctx.Err()
}
return llm.CompletionResponse{}, fmt.Errorf("%w: %v", ErrProviderUnavailable, err)
}
defer resp.Body.Close()

respBody, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
if err != nil {
return llm.CompletionResponse{}, fmt.Errorf("%w: read response: %v", ErrMalformedResponse, err)
}

if resp.StatusCode >= 200 && resp.StatusCode < 300 {
return parseSuccess(respBody, req)
}
return llm.CompletionResponse{}, mapError(resp.StatusCode)
}

type anthropicResponse struct {
Content []struct {
Type string `json:"type"`
Text string `json:"text"`
} `json:"content"`
Usage struct {
InputTokens  int `json:"input_tokens"`
OutputTokens int `json:"output_tokens"`
} `json:"usage"`
}

func parseSuccess(body []byte, req llm.CompletionRequest) (llm.CompletionResponse, error) {
var ar anthropicResponse
if err := json.Unmarshal(body, &ar); err != nil {
return llm.CompletionResponse{}, fmt.Errorf("%w: %v", ErrMalformedResponse, err)
}
var text string
for _, content := range ar.Content {
if content.Type == "text" {
text += content.Text
}
}
if text == "" {
return llm.CompletionResponse{}, fmt.Errorf("%w: no text content", ErrMalformedResponse)
}
return llm.CompletionResponse{
ProviderID:       ProviderID,
Model:            req.Model,
Content:          text,
PromptTokens:     ar.Usage.InputTokens,
CompletionTokens: ar.Usage.OutputTokens,
TotalTokens:      ar.Usage.InputTokens + ar.Usage.OutputTokens,
}, nil
}

func mapError(status int) error {
switch status {
case http.StatusUnauthorized, http.StatusForbidden:
return ErrAuthentication
case http.StatusTooManyRequests:
return ErrRateLimited
case http.StatusBadRequest:
return ErrInvalidRequest
case http.StatusNotFound:
return ErrUnsupportedModel
default:
if status >= 500 {
return ErrProviderUnavailable
}
return fmt.Errorf("anthropic unexpected status %d", status)
}
}

func toAnthropicMessages(messages []llm.Message) (string, []map[string]string) {
var system string
var out []map[string]string
for _, msg := range messages {
if strings.EqualFold(msg.Role, "system") {
if system != "" {
system += "\n"
}
system += msg.Content
continue
}
role := msg.Role
if role == "" {
role = "user"
}
if strings.EqualFold(role, "model") {
role = "assistant"
}
out = append(out, map[string]string{"role": role, "content": msg.Content})
}
return system, out
}
