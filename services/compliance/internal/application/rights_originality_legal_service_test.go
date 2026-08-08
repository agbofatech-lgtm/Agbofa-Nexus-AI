package application_test

import (
	"context"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/compliance/internal/application"
	"github.com/agbofa/nexus/services/compliance/internal/domain"
)

type inMemAuditRepo struct {
	records []domain.ComplianceAuditRecord
}

func newInMemAuditRepo() *inMemAuditRepo {
	return &inMemAuditRepo{}
}

func (r *inMemAuditRepo) AppendRecord(rec domain.ComplianceAuditRecord) error {
	r.records = append(r.records, rec)
	return nil
}

func (r *inMemAuditRepo) GetAuditTrail(tenantID, packageID string) ([]domain.ComplianceAuditRecord, error) {
	var out []domain.ComplianceAuditRecord
	for _, rec := range r.records {
		if rec.TenantID == tenantID && rec.PackageID == packageID {
			out = append(out, rec)
		}
	}
	return out, nil
}

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

func TestRightsOriginalityLegalService_Checks(t *testing.T) {
	auditRepo := newInMemAuditRepo()
	provider := &mockLLMProvider{id: "ai-orig", name: "Originality", content: "ORIGINAL"}
	pub := &mockPublisher{}

	svc := application.NewRightsOriginalityLegalService(auditRepo, provider, pub, nil)

	rights, err := svc.EvaluateRightsAndAttribution(context.Background(), "tenant-1", "pkg-100", "Title", "Content text...")
	if err != nil || !rights.Passed {
		t.Fatalf("expected rights check to pass, got err=%v rights=%v", err, rights)
	}

	orig, err := svc.EvaluateOriginalityAndPlagiarism(context.Background(), "tenant-1", "pkg-100", "Content text...")
	if err != nil || !orig.Passed {
		t.Fatalf("expected originality check to pass, got err=%v orig=%v", err, orig)
	}

	legal, err := svc.EvaluateLegalAndRegulatoryRisks(context.Background(), "tenant-1", "pkg-100", "Title", "Content text...")
	if err != nil || !legal.Passed {
		t.Fatalf("expected legal check to pass, got err=%v legal=%v", err, legal)
	}

	if len(auditRepo.records) != 3 {
		t.Fatalf("expected 3 audit records recorded, got %d", len(auditRepo.records))
	}
}
