package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/content-factory/internal/application"
	"github.com/agbofa/nexus/services/content-factory/internal/domain"
)

type inMemPackageRepo struct {
	packages map[string]domain.ContentPackage
}

func newInMemPackageRepo() *inMemPackageRepo {
	return &inMemPackageRepo{packages: make(map[string]domain.ContentPackage)}
}

func (r *inMemPackageRepo) SavePackage(p domain.ContentPackage) error {
	r.packages[p.TenantID+":"+p.PackageID] = p
	return nil
}

func (r *inMemPackageRepo) GetPackage(tenantID, packageID string) (*domain.ContentPackage, error) {
	p, ok := r.packages[tenantID+":"+packageID]
	if !ok {
		return nil, domain.ErrPackageNotFound
	}
	return &p, nil
}

func (r *inMemPackageRepo) ListPackages(tenantID, statusFilter string) ([]domain.ContentPackage, error) {
	var out []domain.ContentPackage
	for _, p := range r.packages {
		if p.TenantID == tenantID {
			if statusFilter == "" || string(p.Status) == statusFilter {
				out = append(out, p)
			}
		}
	}
	return out, nil
}

type inMemVoiceRepo struct {
	voices map[string]domain.BrandVoiceProfile
}

func newInMemVoiceRepo() *inMemVoiceRepo {
	return &inMemVoiceRepo{voices: make(map[string]domain.BrandVoiceProfile)}
}

func (r *inMemVoiceRepo) SaveProfile(p domain.BrandVoiceProfile) error {
	r.voices[p.TenantID+":"+p.BrandVoiceID] = p
	return nil
}

func (r *inMemVoiceRepo) GetProfile(tenantID, profileID string) (*domain.BrandVoiceProfile, error) {
	p, ok := r.voices[tenantID+":"+profileID]
	if !ok {
		return nil, domain.ErrBrandVoiceNotFound
	}
	return &p, nil
}

type mockPublisher struct {
	events []string
}

func (m *mockPublisher) PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error {
	m.events = append(m.events, eventType+":"+payload)
	return nil
}

type mockAudit struct {
	logs []string
}

func (m *mockAudit) LogEvent(ctx context.Context, tenantID, action, resource, details string) error {
	m.logs = append(m.logs, action+":"+resource)
	return nil
}

func TestStoryIntelligenceService_CreatePackage(t *testing.T) {
	packages := newInMemPackageRepo()
	voices := newInMemVoiceRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewStoryIntelligenceService(packages, voices, pub, audit)

	_ = svc.RegisterBrandVoiceProfile(context.Background(), domain.BrandVoiceProfile{
		BrandVoiceID: "voice-tech",
		TenantID:     "tenant-1",
		Name:         "Authoritative Tech",
		Tone:         "professional",
	})

	pkg, err := svc.CreateContentPackage(
		context.Background(),
		"tenant-1",
		"story-500",
		"AI Media Revolution",
		"Summary...",
		"voice-tech",
		[]string{"ARTICLE", "TWITTER"},
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if pkg.Status != domain.PackageStatusDraft {
		t.Fatalf("expected status DRAFT, got %s", pkg.Status)
	}

	_, err = svc.CreateContentPackage(
		context.Background(),
		"tenant-1",
		"story-501",
		"Missing Voice",
		"Summary...",
		"voice-unknown",
		nil,
	)
	if !errors.Is(err, domain.ErrBrandVoiceNotFound) {
		t.Fatalf("expected ErrBrandVoiceNotFound, got %v", err)
	}
}
