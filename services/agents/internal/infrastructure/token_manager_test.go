package infrastructure

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestTokenManagerGetTokenAndRefresh(t *testing.T) {
	tm := NewTokenManager("")
	ctx := context.Background()

	os.Setenv("TWITTER_BEARER_TOKEN", "test-bearer-token-123")
	defer os.Unsetenv("TWITTER_BEARER_TOKEN")

	token, err := tm.GetToken(ctx, domain.PlatformTwitter)
	if err != nil {
		t.Fatalf("expected get token success, got %v", err)
	}
	if token != "test-bearer-token-123" {
		t.Fatalf("unexpected token value: %s", token)
	}

	// Verify cached token
	token2, err := tm.GetToken(ctx, domain.PlatformTwitter)
	if err != nil || token2 != "test-bearer-token-123" {
		t.Fatalf("expected cached token return")
	}

	// Test test helper SetTokenForTest
	expiry := time.Now().Add(10 * time.Minute)
	tm.SetTokenForTest(domain.PlatformInstagram, "ig-test-token", expiry)
	igToken, err := tm.GetToken(ctx, domain.PlatformInstagram)
	if err != nil || igToken != "ig-test-token" {
		t.Fatalf("expected ig test token return, got %s (%v)", igToken, err)
	}
}
