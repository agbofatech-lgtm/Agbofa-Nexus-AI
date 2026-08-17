package application_test

import (
	"context"
	"testing"

	"github.com/agbofa/nexus/services/content-factory/internal/application"
	"github.com/agbofa/nexus/services/content-factory/internal/domain"
)

func TestAdaptationService_AdaptAndLocalize(t *testing.T) {
	packages := newInMemPackageRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewAdaptationService(packages, nil, pub, audit)

	pkg := domain.ContentPackage{
		PackageID: "pkg-200",
		TenantID:  "tenant-1",
		StoryID:   "story-20",
		Title:     "Tech Launch",
		Summary:   "Summary text...",
		Status:    domain.PackageStatusDraft,
		Articles: []domain.ArticleAsset{
			{AssetID: "art-orig", Headline: "Tech Launch", BodyText: "Original english text", Language: "en"},
		},
	}
	_ = packages.SavePackage(pkg)

	soc, err := svc.AdaptPackageToChannel(context.Background(), "tenant-1", "pkg-200", "TWITTER")
	if err != nil {
		t.Fatalf("unexpected error adapting package: %v", err)
	}
	if soc.Platform != "TWITTER" {
		t.Fatalf("expected TWITTER platform, got %s", soc.Platform)
	}

	localized, err := svc.LocalizePackage(context.Background(), "tenant-1", "pkg-200", "es")
	if err != nil || len(localized) == 0 {
		t.Fatalf("expected localized articles, got err=%v len=%d", err, len(localized))
	}
	if localized[0].Language != "es" {
		t.Fatalf("expected language 'es', got '%s'", localized[0].Language)
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected adaptation event emitted")
	}
}
