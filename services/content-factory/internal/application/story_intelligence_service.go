package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/content-factory/internal/domain"
)

type EventPublisher interface {
	PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error
}

type AuditLogger interface {
	LogEvent(ctx context.Context, tenantID, action, resource, details string) error
}

type StoryIntelligenceService struct {
	packages domain.ContentPackageRepository
	voices   domain.BrandVoiceRepository
	pub      EventPublisher
	audit    AuditLogger
}

func NewStoryIntelligenceService(
	packages domain.ContentPackageRepository,
	voices domain.BrandVoiceRepository,
	pub EventPublisher,
	audit AuditLogger,
) *StoryIntelligenceService {
	return &StoryIntelligenceService{
		packages: packages,
		voices:   voices,
		pub:      pub,
		audit:    audit,
	}
}

func (s *StoryIntelligenceService) CreateContentPackage(
	ctx context.Context,
	tenantID, storyID, title, summary, brandVoiceID string,
	channels []string,
) (*domain.ContentPackage, error) {
	if brandVoiceID != "" {
		if _, err := s.voices.GetProfile(tenantID, brandVoiceID); err != nil {
			if s.audit != nil {
				_ = s.audit.LogEvent(ctx, tenantID, "brand_voice_not_found", brandVoiceID, err.Error())
			}
			return nil, err
		}
	}

	pkg := domain.ContentPackage{
		PackageID:    fmt.Sprintf("pkg-%d", time.Now().UnixNano()),
		TenantID:     tenantID,
		StoryID:      storyID,
		Title:        title,
		Summary:      summary,
		Status:       domain.PackageStatusDraft,
		BrandVoiceID: brandVoiceID,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.packages.SavePackage(pkg); err != nil {
		return nil, err
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "create_content_package", pkg.PackageID, fmt.Sprintf("story=%s voice=%s", storyID, brandVoiceID))
	}

	return &pkg, nil
}

func (s *StoryIntelligenceService) RegisterBrandVoiceProfile(
	ctx context.Context,
	profile domain.BrandVoiceProfile,
) error {
	if err := s.voices.SaveProfile(profile); err != nil {
		return err
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, profile.TenantID, "register_brand_voice", profile.BrandVoiceID, profile.Name)
	}
	return nil
}
