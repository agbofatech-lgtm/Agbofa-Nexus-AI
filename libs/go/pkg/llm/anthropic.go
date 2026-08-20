package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/agbofa/nexus/libs/go/pkg/config"
)

type Anthropic struct {
	baseURL string
	apiKey  config.Secret
	client  *http.Client
}

func NewAnthropic(baseURL string, apiKey config.Secret, client *http.Client) *Anthropic {
	if strings.TrimSpace(baseURL) == "" {
		baseURL = "https://api.anthropic.com"
	}
	if client == nil {
		client = &http.Client{}
	}
	return &Anthropic{baseURL: strings.TrimRight(baseURL, "/"), apiKey: apiKey, client: client}
}

func (p *Anthropic) Name() string { return "anthropic" }

func (p *Anthropic) Health(_ context.Context) Health {
	if p.apiKey.Empty() {
		return Health{Provider: p.Name(), Available: false, Reason: ErrMissingCredential.Error()}
	}
	return Health{Provider: p.Name(), Available: true, Reason: "credential configured; live probe is request-scoped"}
}

func (p *Anthropic) Complete(ctx context.Context, req Request) (Response, error) {
	if p.apiKey.Empty() {
		return Response{}, ErrMissingCredential
	}
	system, messages := splitSystem(req.Messages)
	body, err := json.Marshal(anthropicReq{
		Model:     req.Model,
		MaxTokens: max(req.MaxTokens, 1),
		System:    system,
		Messages:  messages,
	})
	if err != nil {
		return Response{}, err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/v1/messages", bytes.NewReader(body))
	if err != nil {
		return Response{}, err
	}
	httpReq.Header.Set("x-api-key", p.apiKey.Reveal())
	httpReq.Header.Set("anthropic-version", "2023-06-01")
	httpReq.Header.Set("Content-Type", "application/json")
	if req.CorrelationID != "" {
		httpReq.Header.Set("X-Correlation-ID", req.CorrelationID)
	}
	res, err := p.client.Do(httpReq)
	if err != nil {
		return Response{}, classifyTransport(err)
	}
	defer res.Body.Close()
	raw, err := readLimited(res.Body, 1<<20)
	if err != nil {
		return Response{}, err
	}
	if err := mapHTTPStatus(res.StatusCode); err != nil {
		return Response{RawStatus: res.StatusCode, RequestID: res.Header.Get("request-id")}, fmt.Errorf("%w: anthropic status %d", err, res.StatusCode)
	}
	var parsed anthropicRes
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return Response{}, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}
	text := strings.TrimSpace(joinAnthropic(parsed.Content))
	if text == "" {
		return Response{}, ErrInvalidResponse
	}
	return Response{
		Provider:     p.Name(),
		Model:        parsed.Model,
		Text:         text,
		FinishReason: parsed.StopReason,
		Usage: Usage{
			PromptTokens:     parsed.Usage.InputTokens,
			CompletionTokens: parsed.Usage.OutputTokens,
			TotalTokens:      parsed.Usage.InputTokens + parsed.Usage.OutputTokens,
		},
		RequestID: first(parsed.ID, res.Header.Get("request-id")),
		RawStatus: res.StatusCode,
	}, nil
}

type anthropicReq struct {
	Model     string             `json:"model"`
	MaxTokens int                `json:"max_tokens"`
	System    string             `json:"system,omitempty"`
	Messages  []anthropicMessage `json:"messages"`
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicRes struct {
	ID         string `json:"id"`
	Model      string `json:"model"`
	StopReason string `json:"stop_reason"`
	Content    []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Usage struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
	} `json:"usage"`
}

func splitSystem(in []Message) (string, []anthropicMessage) {
	var system []string
	var msgs []anthropicMessage
	for _, msg := range in {
		if msg.Role == RoleSystem {
			system = append(system, msg.Content)
			continue
		}
		role := string(msg.Role)
		if role != "user" && role != "assistant" {
			role = "user"
		}
		msgs = append(msgs, anthropicMessage{Role: role, Content: msg.Content})
	}
	return strings.Join(system, "\n"), msgs
}

func joinAnthropic(blocks []struct {
	Type string `json:"type"`
	Text string `json:"text"`
}) string {
	var parts []string
	for _, block := range blocks {
		if block.Type == "text" || block.Text != "" {
			parts = append(parts, block.Text)
		}
	}
	return strings.Join(parts, "")
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
