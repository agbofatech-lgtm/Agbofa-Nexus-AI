package application

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/content-factory/internal/domain"
)

type EditorialGenerationService struct {
	packages   domain.ContentPackageRepository
	aiProvider llm.Provider
	audit      AuditLogger
}

func NewEditorialGenerationService(
	packages domain.ContentPackageRepository,
	aiProvider llm.Provider,
	audit AuditLogger,
) *EditorialGenerationService {
	return &EditorialGenerationService{
		packages:   packages,
		aiProvider: aiProvider,
		audit:      audit,
	}
}

func (s *EditorialGenerationService) GenerateArticleAsset(
	ctx context.Context,
	tenantID, packageID, headlinePrompt, bodyPrompt, language string,
) (*domain.ArticleAsset, error) {
	pkg, err := s.packages.GetPackage(tenantID, packageID)
	if err != nil {
		return nil, err
	}

	headline := "Generated Headline"
	bodyText := "Generated authoritative article body text..."
	seoTitle := "SEO Title for " + headlinePrompt
	seoDesc := "SEO description summarizing article content..."

	if s.aiProvider != nil {
		req := llm.CompletionRequest{
			TenantID: tenantID,
			Model:    "article-generator-v1",
			Messages: []llm.Message{
				{Role: "system", Content: "Generate headline and full article body in specified language."},
				{Role: "user", Content: fmt.Sprintf("Headline: %s\nBodyPrompt: %s\nLanguage: %s", headlinePrompt, bodyPrompt, language)},
			},
		}
		resp, err := s.aiProvider.Generate(ctx, req)
		if err == nil && resp.Content != "" {
			parts := strings.SplitN(resp.Content, "\n", 2)
			headline = parts[0]
			if len(parts) > 1 {
				bodyText = parts[1]
			}
		}
	}

	asset := domain.ArticleAsset{
		AssetID:        fmt.Sprintf("art-%d", time.Now().UnixNano()),
		TenantID:       tenantID,
		PackageID:      packageID,
		Headline:       headline,
		BodyText:       bodyText,
		SEOTitle:       seoTitle,
		SEODescription: seoDesc,
		Language:       language,
	}

	pkg.Articles = append(pkg.Articles, asset)
	pkg.UpdatedAt = time.Now()

	if err := s.packages.SavePackage(*pkg); err != nil {
		return nil, err
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "generate_article_asset", asset.AssetID, fmt.Sprintf("pkg=%s lang=%s", packageID, language))
	}

	return &asset, nil
}

func (s *EditorialGenerationService) GenerateMultimediaAsset(
	ctx context.Context,
	tenantID, packageID, assetType, scriptPrompt string,
) (*domain.MultimediaAsset, error) {
	pkg, err := s.packages.GetPackage(tenantID, packageID)
	if err != nil {
		return nil, err
	}

	contentSpec := "Generated script spec for " + assetType

	if s.aiProvider != nil {
		req := llm.CompletionRequest{
			TenantID: tenantID,
			Model:    "media-script-generator-v1",
			Messages: []llm.Message{
				{Role: "system", Content: "Generate media script specification."},
				{Role: "user", Content: fmt.Sprintf("Type: %s\nPrompt: %s", assetType, scriptPrompt)},
			},
		}
		resp, err := s.aiProvider.Generate(ctx, req)
		if err == nil && resp.Content != "" {
			contentSpec = resp.Content
		}
	}

	asset := domain.MultimediaAsset{
		AssetID:     fmt.Sprintf("media-%d", time.Now().UnixNano()),
		TenantID:    tenantID,
		PackageID:   packageID,
		AssetType:   assetType,
		ContentSpec: contentSpec,
	}

	pkg.Media = append(pkg.Media, asset)
	pkg.UpdatedAt = time.Now()

	if err := s.packages.SavePackage(*pkg); err != nil {
		return nil, err
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "generate_multimedia_asset", asset.AssetID, fmt.Sprintf("pkg=%s type=%s", packageID, assetType))
	}

	return &asset, nil
}
