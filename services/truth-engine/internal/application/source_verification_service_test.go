package application_test

import (
	"context"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/truth-engine/internal/application"
	"github.com/agbofa/nexus/services/truth-engine/internal/domain"
)

type inMemSourceRepo struct {
	sources map[string]domain.SourceReliability
}

func newInMemSourceRepo() *inMemSourceRepo {
	return &inMemSourceRepo{sources: make(map[string]domain.SourceReliability)}
}

func (r *inMemSourceRepo) SaveSourceReliability(s domain.SourceReliability) error {
	r.sources[s.SourceID] = s
	return nil
}

func (r *inMemSourceRepo) GetSourceReliability(id string) (*domain.SourceReliability, error) {
	s, ok := r.sources[id]
	if !ok {
		return nil, domain.ErrSourceNotVerified
	}
	return &s, nil
}

type inMemLedgerRepo struct {
	records []domain.ProvenanceRecord
}

func newInMemLedgerRepo() *inMemLedgerRepo {
	return &inMemLedgerRepo{}
}

func (r *inMemLedgerRepo) AppendRecord(rec domain.ProvenanceRecord) error {
	r.records = append(r.records, rec)
	return nil
}

func (r *inMemLedgerRepo) GetStoryAuditTrail(storyID string) ([]domain.ProvenanceRecord, error) {
	var out []domain.ProvenanceRecord
	for _, rec := range r.records {
		if rec.StoryID == storyID || rec.StoryID == "all" {
			out = append(out, rec)
		}
	}
	return out, nil
}

func (r *inMemLedgerRepo) GetMerkleRoot(tenantID string) (string, error) {
	return "merkle-root-" + tenantID, nil
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

func TestSourceVerificationService_VerifySource(t *testing.T) {
	sources := newInMemSourceRepo()
	ledger := newInMemLedgerRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewSourceVerificationService(sources, ledger, pub, audit)

	rel, err := svc.VerifySource(context.Background(), "tenant-1", "src-10", "Official News", "RSS")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rel.ReliabilityScore < 0.90 || rel.TrustTier != domain.TrustLevelHigh {
		t.Fatalf("expected high trust tier, got score=%.2f tier=%s", rel.ReliabilityScore, rel.TrustTier)
	}
	if len(ledger.records) != 1 {
		t.Fatalf("expected 1 ledger record created, got %d", len(ledger.records))
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected source.evaluated event published")
	}
}
