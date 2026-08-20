package llm

import (
	"context"
	"time"
)

type Role string

const (
	RoleSystem    Role = "system"
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
)

type Message struct {
	Role    Role
	Content string
}

type Request struct {
	Model          string
	Messages       []Message
	MaxTokens      int
	Temperature    float64
	CorrelationID  string
	TenantID       string
	SubjectID      string
	Timeout        time.Duration
	IdempotencyKey string
}

type Usage struct {
	PromptTokens     int
	CompletionTokens int
	TotalTokens      int
}

type Cost struct {
	Currency        string
	EstimatedMicros int64
	Source          string
}

type Response struct {
	Provider     string
	Model        string
	Text         string
	FinishReason string
	Usage        Usage
	Cost         Cost
	Latency      time.Duration
	RequestID    string
	RawStatus    int
}

type Health struct {
	Provider  string
	Available bool
	Reason    string
}

// Provider is a real AI backend. Implementations must not invent completions.
type Provider interface {
	Name() string
	Complete(ctx context.Context, req Request) (Response, error)
	Health(ctx context.Context) Health
}

type UsageSink interface {
	Record(ctx context.Context, req Request, res Response, err error)
}

type ModelSpec struct {
	ID           string
	Provider     string
	RemoteModel  string
	InputPer1K   int64
	OutputPer1K  int64
	Currency     string
	MaxTokens    int
}
