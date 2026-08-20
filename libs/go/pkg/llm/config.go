package llm

import (
	"context"
	"os"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/config"
)

// Settings are optional. Missing provider keys do not fail process startup;
// they fail closed at request time.
type Settings struct {
	Timeout          time.Duration
	Retries          int
	OpenAIBaseURL    string
	OpenAIKey        config.Secret
	AnthropicBaseURL string
	AnthropicKey     config.Secret
}

func LoadSettings(ctx context.Context, secrets config.SecretProvider) Settings {
	s := Settings{
		Timeout:          30 * time.Second,
		Retries:          2,
		OpenAIBaseURL:    firstNonEmpty(os.Getenv("AGBOFA_OPENAI_BASE_URL"), "https://api.openai.com/v1"),
		AnthropicBaseURL: firstNonEmpty(os.Getenv("AGBOFA_ANTHROPIC_BASE_URL"), "https://api.anthropic.com"),
	}
	if parsed, err := time.ParseDuration(os.Getenv("AGBOFA_AI_TIMEOUT")); err == nil && parsed > 0 {
		s.Timeout = parsed
	}
	if secrets != nil {
		if key, err := secrets.Get(ctx, "ai/openai/api_key"); err == nil {
			s.OpenAIKey = key
		}
		if key, err := secrets.Get(ctx, "ai/anthropic/api_key"); err == nil {
			s.AnthropicKey = key
		}
	}
	if s.OpenAIKey.Empty() {
		if raw := strings.TrimSpace(os.Getenv("AGBOFA_SECRET_AI_OPENAI_API_KEY")); raw != "" {
			s.OpenAIKey = config.NewSecret("ai/openai/api_key", raw)
		}
	}
	if s.AnthropicKey.Empty() {
		if raw := strings.TrimSpace(os.Getenv("AGBOFA_SECRET_AI_ANTHROPIC_API_KEY")); raw != "" {
			s.AnthropicKey = config.NewSecret("ai/anthropic/api_key", raw)
		}
	}
	return s
}

func (s Settings) Providers() []Provider {
	return []Provider{
		NewOpenAI(s.OpenAIBaseURL, s.OpenAIKey, nil),
		NewAnthropic(s.AnthropicBaseURL, s.AnthropicKey, nil),
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
