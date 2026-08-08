package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/content-factory/internal/domain"
)

type AdaptationService struct {
	packages   domain.ContentPackageRepository
	aiProvider llm.Provider
	pub        EventPublisher
	audit      AuditLogger
}

func NewAdaptationService(
	packages domain.ContentPackageRepository,
	aiProvider llm.Provider,
	pub EventPublisher,
	audit AuditLogger,
) *AdaptationService {
	return &AdaptationService{
		packages:   packages,
		aiProvider: aiProvider,
		pub:        pub,
		audit:      audit,
	}
}

func (s *AdaptationService) AdaptPackageToChannel(
	ctx context.Context,
	tenantID, packageID, channel string,
) (*domain.SocialAsset, error) {
	pkg, err := s.packages.GetPackage(tenantID, packageID)
	if err != nil {
		return nil, err
	}

	postText := fmt.Sprintf("Exciting news: %s #AI #Media", pkg.Title)

	if s.aiProvider != nil {
		req := llm.CompletionRequest{
			TenantID: tenantID,
			Model:    "social-content-generator-v1",
			Messages: []llm.Message{
				{Role: "system", Content: "Generate concise social post for target channel."},
				{Role: "user", Content: fmt.Sprintf("Channel: %s\nTitle: %s\nSummary: %s", channel, pkg.Title, pkg.Summary)},
			},
		}
		resp, err := s.aiProvider.Generate(ctx, req)
		if err == nil && resp.Content != "" {
			postText = resp.Content
		}
	}

	social := domain.SocialAsset{
		AssetID:   fmt.Sprintf("soc-%d", time.Now().UnixNano()),
		TenantID:  tenantID,
		PackageID: packageID,
		Platform:  channel,
		PostText:  postText,
	}

	pkg.Social = append(pkg.Social, social)
	pkg.UpdatedAt = time.Now()

	if err := s.packages.SavePackage(*pkg); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "content_factory.story.adapted", tenantID, "SVC-050", fmt.Sprintf("pkg=%s channel=%s", packageID, channel))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "adapt_package_channel", social.AssetID, fmt.Sprintf("pkg=%s channel=%s", packageID, channel))
	}

	return &social, nil
}

func (s *AdaptationService) LocalizePackage(
	ctx context.Context,
	tenantID, packageID, targetLang string,
) ([]domain.ArticleAsset, error) {
	pkg, err := s.packages.GetPackage(tenantID, packageID)
	if err != nil {
		return nil, err
	}

	var localized []domain.ArticleAsset
	for _, art := range pkg.Articles {
		transHeadline := fmt.Sprintf("[%s] %s", targetLang, art.Headline)
		transBody := fmt.Sprintf("[%s] %s", targetLang, art.BodyText)

		if s.aiProvider != nil {
			req := llm.CompletionRequest{
				TenantID: tenantID,
				Model:    "localization-translator-v1",
				Messages: []llm.Message{
					{Role: "system", Content: "Translate headline and article into target language."},
					{Role: "user", Content: fmt.Sprintf("Lang: %s\nHeadline: %s\nBody: %s", targetLang, art.Headline, art.BodyText)},
				},
			}
			resp, err := s.aiProvider.Generate(ctx, req)
			if err == nil && resp.Content != "" {
				transBody = resp.Content
			}
		}

		lArt := domain.ArticleAsset{
			AssetID:        fmt.Sprintf("art-loc-%d", time.Now().UnixNano()),
			TenantID:       tenantID,
			PackageID:      packageID,
			Headline:       transHeadline,
			BodyText:       transBody,
			SEOTitle:       art.SEOTitle,
			SEODescription: art.SEODescription,
			Language:       targetLang,
		}
		localized = append(localized, lArt)
	}

	pkg.Articles = append(pkg.Articles, localized...)
	pkg.UpdatedAt = time.Now()

	if err := s.packages.SavePackage(*pkg); err != nil {
		return nil, err
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "localize_package", packageID, "target_lang="+targetLang)
	}

	return localized, nil
}
