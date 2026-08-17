package infrastructure

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestNeo4jClient_CollaborativeFilteringValidationAndParsing(t *testing.T) {
	ctx := context.Background()
	client := NewNeo4jGraphClient("bolt://invalid-neo4j-host:7687")

	// 1. Cross-tenant violations
	_, err := client.GetCollaborativeRecommendations(ctx, "", "reader-1", 10)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
	_, err = client.GetRelatedStoriesByEntity(ctx, "", "story-1", 10)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
	_, err = client.GetSimilarStoriesByTopic(ctx, "", "story-1", 10)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	// 2. Required ID validations
	_, err = client.GetCollaborativeRecommendations(ctx, "tenant-f4", "", 10)
	if err == nil {
		t.Fatalf("expected error when readerID is empty, got nil")
	}
	_, err = client.GetRelatedStoriesByEntity(ctx, "tenant-f4", "", 10)
	if err == nil {
		t.Fatalf("expected error when storyID is empty, got nil")
	}
	_, err = client.GetSimilarStoriesByTopic(ctx, "tenant-f4", "", 10)
	if err == nil {
		t.Fatalf("expected error when storyID is empty, got nil")
	}

	// 3. Test helper parsers
	if val := parseScoreInt(int64(42)); val != 42 {
		t.Errorf("expected 42 from int64, got %d", val)
	}
	if val := parseScoreInt(42); val != 42 {
		t.Errorf("expected 42 from int, got %d", val)
	}
	if val := parseScoreInt(42.0); val != 42 {
		t.Errorf("expected 42 from float64, got %d", val)
	}

	sliceAny := []any{"ai", "media", "tech"}
	parsed := parseStringSlice(sliceAny)
	if len(parsed) != 3 || parsed[0] != "ai" || parsed[2] != "tech" {
		t.Errorf("expected string slice [ai media tech], got %v", parsed)
	}
	sliceStr := []string{"topic-1", "topic-2"}
	parsedStr := parseStringSlice(sliceStr)
	if len(parsedStr) != 2 || parsedStr[0] != "topic-1" {
		t.Errorf("expected string slice [topic-1 topic-2], got %v", parsedStr)
	}
}
