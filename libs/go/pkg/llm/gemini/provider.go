// Package gemini implements the Gemini provider adapter against the
// existing llm.Provider contract.
//
// This is a server-side provider. The API key is NEVER exposed to the
// browser or BFF. Keys come from GEMINI_API_KEY environment variable.
//
// IMP-AI-GATEWAY-001 � Batch 1
package gemini

import (
	"os"
"bytes"
"context"
"encoding/json"
"errors"
"fmt"
"io"
"net/http"
"strings"
"time"

"github.com/agbofa/nexus/libs/go/pkg/llm"
)

var (
ProviderID = "gemini"
baseURL = "https://generativelanguage.googleapis.com/v1beta"
)

var (
ErrMissingAPIKey       = errors.New("gemini api key is required")
ErrAuthentication      = errors.New("gemini authentication failed")
ErrRateLimited         = errors.New("gemini rate limit exceeded")
ErrUnsupportedModel    = errors.New("gemini model not supported")
ErrInvalidRequest      = errors.New("gemini invalid request")
ErrProviderUnavailable = errors.New("gemini provider unavailable")
ErrMalformedResponse   = errors.New("gemini malformed response")
ErrUnsupportedMedia    = errors.New("gemini unsupported media attachment")
)

// GeminiProvider implements llm.Provider for Google Gemini.
type GeminiProvider struct {
apiKey string
client *http.Client
}

// New creates a GeminiProvider using GEMINI_API_KEY.
func New(apiKey string) (*GeminiProvider, error) {
if apiKey == "" {
return nil, ErrMissingAPIKey
}
return &GeminiProvider{
apiKey: apiKey,
client: &http.Client{Timeout: 60 * time.Second},
}, nil
}

// NewFromEnv creates a GeminiProvider from GEMINI_API_KEY environment.
func NewFromEnv() (*GeminiProvider, error) {
return New(getEnv("GEMINI_API_KEY"))
}

func getEnv(key string) string {
return strings.TrimSpace(getenv(key))
}

// getenv is isolated so tests can avoid touching the real environment.
var getenv = func(key string) string {
// We cannot import os directly here because tests may need to override.
// Use a small indirection so the test package can set fake keys.
return envLookup(key)
}

// envLookup is the actual environment lookup. Tests never call this directly
// because they construct GeminiProvider via New("test-gemini-key").
func envLookup(key string) string {
// Imported separately to keep test isolation.
return os.Getenv(key)
}

// ID returns the provider identifier.
func (p *GeminiProvider) ID() string { return ProviderID }

// Name returns a human-readable provider name.
func (p *GeminiProvider) Name() string { return "Google Gemini" }

// Generate sends a CompletionRequest to Gemini and returns a
// CompletionResponse. It never logs the API key.
func (p *GeminiProvider) Generate(ctx context.Context, req llm.CompletionRequest) (llm.CompletionResponse, error) {
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
"contents":          toGeminiContents(req.Messages),
"generationConfig":  toGeminiConfig(req.Params),
}

if len(req.Attachments) > 0 {
parts, err := toGeminiInlineData(req.Attachments)
if err != nil {
return llm.CompletionResponse{}, err
}
if len(parts) > 0 {
if contents, ok := requestBody["contents"].([]map[string]any); ok && len(contents) > 0 {
contents[len(contents)-1]["parts"] = append(
contents[len(contents)-1]["parts"].([]map[string]any),
parts...,
)
}
}
}

body, err := json.Marshal(requestBody)
if err != nil {
return llm.CompletionResponse{}, fmt.Errorf("marshal gemini request: %w", err)
}

url := fmt.Sprintf("%s/models/%s:generateContent?key=%s", baseURL, req.Model, p.apiKey)

httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
if err != nil {
return llm.CompletionResponse{}, err
}
httpReq.Header.Set("Content-Type", "application/json")

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
return p.parseSuccess(respBody, req)
}

return llm.CompletionResponse{}, mapGeminiError(resp.StatusCode, respBody)
}

type geminiResponse struct {
Candidates []struct {
Content struct {
Parts []struct {
Text string `json:"text"`
} `json:"parts"`
} `json:"content"`
} `json:"candidates"`
UsageMetadata struct {
PromptTokenCount     int `json:"promptTokenCount"`
CandidatesTokenCount int `json:"candidatesTokenCount"`
TotalTokenCount      int `json:"totalTokenCount"`
} `json:"usageMetadata"`
}

func (p *GeminiProvider) parseSuccess(body []byte, req llm.CompletionRequest) (llm.CompletionResponse, error) {
var gr geminiResponse
if err := json.Unmarshal(body, &gr); err != nil {
return llm.CompletionResponse{}, fmt.Errorf("%w: %v", ErrMalformedResponse, err)
}
if len(gr.Candidates) == 0 {
return llm.CompletionResponse{}, fmt.Errorf("%w: no candidates", ErrMalformedResponse)
}
var text string
if len(gr.Candidates[0].Content.Parts) > 0 {
text = gr.Candidates[0].Content.Parts[0].Text
}
return llm.CompletionResponse{
ProviderID:       ProviderID,
Model:            req.Model,
Content:          text,
PromptTokens:     gr.UsageMetadata.PromptTokenCount,
CompletionTokens: gr.UsageMetadata.CandidatesTokenCount,
TotalTokens:      gr.UsageMetadata.TotalTokenCount,
Latency:          0,
}, nil
}

func mapGeminiError(status int, body []byte) error {
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
return fmt.Errorf("gemini unexpected status %d: %s", status, string(body))
}
}

func toGeminiContents(messages []llm.Message) []map[string]any {
var contents []map[string]any
for _, msg := range messages {
role := "user"
if strings.EqualFold(msg.Role, "system") {
role = "user"
} else if strings.EqualFold(msg.Role, "assistant") || strings.EqualFold(msg.Role, "model") {
role = "model"
}
contents = append(contents, map[string]any{
"role":  role,
"parts": []map[string]any{{"text": msg.Content}},
})
}
return contents
}

func toGeminiConfig(params llm.ModelParameters) map[string]any {
cfg := map[string]any{}
if params.Temperature > 0 {
cfg["temperature"] = params.Temperature
}
if params.MaxTokens > 0 {
cfg["maxOutputTokens"] = params.MaxTokens
}
if params.TopP > 0 {
cfg["topP"] = params.TopP
}
return cfg
}

func toGeminiInlineData(attachments []llm.MediaAttachment) ([]map[string]any, error) {
var parts []map[string]any
for _, att := range attachments {
switch strings.ToLower(att.Type) {
case "image":
mime := att.Format
if mime == "" {
mime = "image/jpeg"
}
parts = append(parts, map[string]any{
"inlineData": map[string]any{
"mimeType": mime,
"data":     base64Encode(att.Data),
},
})
case "audio":
mime := att.Format
if mime == "" {
mime = "audio/wav"
}
parts = append(parts, map[string]any{
"inlineData": map[string]any{
"mimeType": mime,
"data":     base64Encode(att.Data),
},
})
default:
return nil, fmt.Errorf("%w: %s", ErrUnsupportedMedia, att.Type)
}
}
return parts, nil
}

func base64Encode(data []byte) string {
if len(data) == 0 {
return ""
}
const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
var sb strings.Builder
for i := 0; i < len(data); i += 3 {
var b1, b2, b3 byte
b1 = data[i]
if i+1 < len(data) {
b2 = data[i+1]
}
if i+2 < len(data) {
b3 = data[i+2]
}
sb.WriteByte(base64Chars[b1>>2])
sb.WriteByte(base64Chars[((b1&0x03)<<4)|(b2>>4)])
if i+1 < len(data) {
sb.WriteByte(base64Chars[((b2&0x0F)<<2)|(b3>>6)])
} else {
sb.WriteByte('=')
}
if i+2 < len(data) {
sb.WriteByte(base64Chars[b3&0x3F])
} else {
sb.WriteByte('=')
}
}
return sb.String()
}
