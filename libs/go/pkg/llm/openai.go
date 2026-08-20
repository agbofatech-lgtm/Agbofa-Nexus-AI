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

type OpenAI struct {
	baseURL string
	apiKey  config.Secret
	client  *http.Client
}

func NewOpenAI(baseURL string, apiKey config.Secret, client *http.Client) *OpenAI {
	if strings.TrimSpace(baseURL) == "" {
		baseURL = "https://api.openai.com/v1"
	}
	if client == nil {
		client = &http.Client{}
	}
	return &OpenAI{baseURL: strings.TrimRight(baseURL, "/"), apiKey: apiKey, client: client}
}

func (p *OpenAI) Name() string { return "openai" }

func (p *OpenAI) Health(_ context.Context) Health {
	if p.apiKey.Empty() {
		return Health{Provider: p.Name(), Available: false, Reason: ErrMissingCredential.Error()}
	}
	return Health{Provider: p.Name(), Available: true, Reason: "credential configured; live probe is request-scoped"}
}

func (p *OpenAI) Complete(ctx context.Context, req Request) (Response, error) {
	if p.apiKey.Empty() {
		return Response{}, ErrMissingCredential
	}
	body, err := json.Marshal(openaiReq{
		Model:       req.Model,
		Messages:    toOpenAIMessages(req.Messages),
		MaxTokens:   req.MaxTokens,
		Temperature: req.Temperature,
	})
	if err != nil {
		return Response{}, err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return Response{}, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+p.apiKey.Reveal())
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
		return Response{RawStatus: res.StatusCode, RequestID: res.Header.Get("x-request-id")}, fmt.Errorf("%w: openai status %d", err, res.StatusCode)
	}
	var parsed openaiRes
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return Response{}, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}
	text := ""
	reason := ""
	if len(parsed.Choices) > 0 {
		text = parsed.Choices[0].Message.Content
		reason = parsed.Choices[0].FinishReason
	}
	if strings.TrimSpace(text) == "" {
		return Response{}, ErrInvalidResponse
	}
	return Response{
		Provider:     p.Name(),
		Model:        parsed.Model,
		Text:         text,
		FinishReason: reason,
		Usage: Usage{
			PromptTokens:     parsed.Usage.PromptTokens,
			CompletionTokens: parsed.Usage.CompletionTokens,
			TotalTokens:      parsed.Usage.TotalTokens,
		},
		RequestID: first(parsed.ID, res.Header.Get("x-request-id")),
		RawStatus: res.StatusCode,
	}, nil
}

type openaiReq struct {
	Model       string          `json:"model"`
	Messages    []openaiMessage `json:"messages"`
	MaxTokens   int             `json:"max_tokens,omitempty"`
	Temperature float64         `json:"temperature,omitempty"`
}

type openaiMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openaiRes struct {
	ID      string `json:"id"`
	Model   string `json:"model"`
	Choices []struct {
		FinishReason string `json:"finish_reason"`
		Message      struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

func toOpenAIMessages(in []Message) []openaiMessage {
	out := make([]openaiMessage, 0, len(in))
	for _, msg := range in {
		out = append(out, openaiMessage{Role: string(msg.Role), Content: msg.Content})
	}
	return out
}
