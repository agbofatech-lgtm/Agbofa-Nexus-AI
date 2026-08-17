package application_test

import (
	"context"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/content-factory/internal/application"
	"github.com/agbofa/nexus/services/content-factory/internal/domain"
)

type mockLLMProvider struct {
	id      string
	name    string
	content string
}

func (m *mockLLMProvider) ID() string   { return m.id }
func (m *mockLLMProvider) Name() string { return m.name }
func (m *mockLLMProvider) Generate(ctx context.Context, req llm.CompletionRequest) (llm.CompletionResponse, error) {
	return llm.CompletionResponse{
		ProviderID:  m.id,
		Model:       req.Model,
		Content:     m.content,
		TotalTokens: 25,
		Latency:     10 * time.Millisecond,
	}, nil
}

func TestEditorialGenerationService_GenerateAssets(t *testing.T) {
	packages := newInMemPackageRepo()
	provider := &mockLLMProvider{
		id:      "ai-gen",
		name:    "AIGenerator",
		content: "AI Newsroom Expands\nAn in-depth look at automated media production...",
	}
	audit := &mockAudit{}

	svc := application.NewEditorialGenerationService(packages, provider, audit)

	pkg := domain.ContentPackage{
		PackageID: "pkg-101",
		TenantID:  "tenant-1",
		StoryID:   "story-10",
		Title:     "Initial Title",
		Status:    domain.PackageStatusDraft,
	}
	_ = packages.SavePackage(pkg)

	art, err := svc.GenerateArticleAsset(context.Background(), "tenant-1", "pkg-101", "AI Newsroom", "Full body text", "en")
	if err != nil {
		t.Fatalf("unexpected error generating article: %v", err)
	}
	if art.Headline != "AI Newsroom Expands" {
		t.Fatalf("expected headline 'AI Newsroom Expands', got '%s'", art.Headline)
	}

	media, err := svc.GenerateMultimediaAsset(context.Background(), "tenant-1", "pkg-101", "AUDIO_SCRIPT", "Podcast intro")
	if err != nil {
		t.Fatalf("unexpected error generating media: %v", err)
	}
	if media.AssetType != "AUDIO_SCRIPT" {
		t.Fatalf("expected asset type AUDIO_SCRIPT, got %s", media.AssetType)
	}
}
