// Package openai implements the OpenAI provider adapter against the
// existing llm.Provider contract.
//
// API key comes from OPENAI_API_KEY environment variable.
// Server-side only. Never exposed to browser or BFF.
//
// IMP-AI-GATEWAY-001 � Batch 2
package openai

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
ProviderID = "openai"
baseURL    = "https://api.openai.com/v1"
)

var (
ErrMissingAPIKey       = errors.New("openai api key is required")
ErrAuthentication      = errors.New("openai authentication failed")
ErrRateLimited         = errors.New("openai rate limit exceeded")
ErrUnsupportedModel    = errors.New("openai model not supported")
ErrInvalidRequest      = errors.New("openai invalid request")
ErrProviderUnavailable = errors.New("openai provider unavailable")
ErrMalformedResponse   = errors.New("openai malformed response")
)

// OpenAIProvider implements llm.Provider for OpenAI.
type OpenAIProvider struct {
apiKey string
client *http.Client
}

func New(apiKey string) (*OpenAIProvider, error) {
if apiKey == "" {
return nil, ErrMissingAPIKey
}
return &OpenAIProvider{
apiKey: apiKey,
client: &http.Client{Timeout: 60 * time.Second},
}, nil
}

func NewFromEnv() (*OpenAIProvider, error) {
return New(strings.TrimSpace(os.Getenv("OPENAI_API_KEY")))
}

func (p *OpenAIProvider) ID() string   { return ProviderID }
func (p *OpenAIProvider) Name() string { return "OpenAI" }

func (p *OpenAIProvider) Generate(ctx context.Context, req llm.CompletionRequest) (llm.CompletionResponse, error) {
if p.apiKey == "" {
return llm.CompletionResponse{}, ErrMissingAPIKey
}
if req.Model == "" {
return llm.CompletionResponse{}, ErrInvalidRequest
}
if len(req.Messages) == 0 {
return llm.CompletionResponse{}, ErrInvalidRequest
}

requestBody := map[string]any{
"model":       req.Model,
"messages":    toOpenAIMessages(req.Messages),
"temperature": req.Params.Temperature,
"max_tokens":  req.Params.MaxTokens,
"top_p":       req.Params.TopP,
}
if req.Params.MaxTokens == 0 {
delete(requestBody, "max_tokens")
}
if req.Params.Temperature == 0 {
requestBody["temperature"] = 0.7
}
if req.Params.TopP == 0 {
delete(requestBody, "top_p")
}

body, err := json.Marshal(requestBody)
if err != nil {
return llm.CompletionResponse{}, fmt.Errorf("marshal openai request: %w", err)
}

httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/chat/completions", bytes.NewReader(body))
if err != nil {
return llm.CompletionResponse{}, err
}
httpReq.Header.Set("Content-Type", "application/json")
httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)

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

type openaiResponse struct {
Choices []struct {
Message struct {
Content string `json:"content"`
} `json:"message"`
} `json:"choices"`
Usage struct {
PromptTokens     int `json:"prompt_tokens"`
CompletionTokens int `json:"completion_tokens"`
TotalTokens      int `json:"total_tokens"`
} `json:"usage"`
}

func parseSuccess(body []byte, req llm.CompletionRequest) (llm.CompletionResponse, error) {
var or openaiResponse
if err := json.Unmarshal(body, &or); err != nil {
return llm.CompletionResponse{}, fmt.Errorf("%w: %v", ErrMalformedResponse, err)
}
if len(or.Choices) == 0 {
return llm.CompletionResponse{}, fmt.Errorf("%w: no choices", ErrMalformedResponse)
}
return llm.CompletionResponse{
ProviderID:       ProviderID,
Model:            req.Model,
Content:          or.Choices[0].Message.Content,
PromptTokens:     or.Usage.PromptTokens,
CompletionTokens: or.Usage.CompletionTokens,
TotalTokens:      or.Usage.TotalTokens,
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
return fmt.Errorf("openai unexpected status %d", status)
}
}

func toOpenAIMessages(messages []llm.Message) []map[string]string {
var out []map[string]string
for _, msg := range messages {
role := msg.Role
if role == "" {
role = "user"
}
if strings.EqualFold(role, "model") {
role = "assistant"
}
out = append(out, map[string]string{"role": role, "content": msg.Content})
}
return out
}
