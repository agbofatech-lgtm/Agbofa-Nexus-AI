package llm

import (
	"context"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/config"
)

func TestAnthropicRealIntegration(t *testing.T) {
	key := os.Getenv("AGBOFA_SECRET_AI_ANTHROPIC_API_KEY")
	if key == "" {
		t.Skip("AGBOFA_SECRET_AI_ANTHROPIC_API_KEY not set")
	}

	client := NewAnthropic(
		"https://api.anthropic.com/v1/messages",
		config.NewSecret("anthropic/key", key),
		&http.Client{Timeout: 30 * time.Second},
	)

	res, err := client.Complete(context.Background(), Request{
		Model: "claude-3-5-sonnet-20241022",
		Messages: []Message{
			{Role: "user", Content: "What is 2+2? Answer in one word."},
		},
	})
	if err != nil {
		t.Fatalf("real Anthropic call failed: %v", err)
	}
	if res.Text == "" {
		t.Fatal("empty response from real Anthropic")
	}
	t.Logf("Anthropic response: %s", res.Text)
}