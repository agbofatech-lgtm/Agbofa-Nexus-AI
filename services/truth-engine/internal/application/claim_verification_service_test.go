package application_test

import (
	"context"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/truth-engine/internal/application"
	"github.com/agbofa/nexus/services/truth-engine/internal/domain"
)

type inMemClaimRepo struct {
	claims map[string]domain.StoryClaim
}

func newInMemClaimRepo() *inMemClaimRepo {
	return &inMemClaimRepo{claims: make(map[string]domain.StoryClaim)}
}

func (r *inMemClaimRepo) SaveClaim(c domain.StoryClaim) error {
	r.claims[c.ClaimID] = c
	return nil
}

func (r *inMemClaimRepo) GetClaim(id string) (*domain.StoryClaim, error) {
	c, ok := r.claims[id]
	if !ok {
		return nil, domain.ErrClaimNotFound
	}
	return &c, nil
}

func (r *inMemClaimRepo) ListClaimsByStory(storyID string) ([]domain.StoryClaim, error) {
	var out []domain.StoryClaim
	for _, c := range r.claims {
		if c.StoryID == storyID {
			out = append(out, c)
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
		TotalTokens: 30,
		Latency:     10 * time.Millisecond,
	}, nil
}

func TestClaimVerificationService_VerifyClaimSupported(t *testing.T) {
	claims := newInMemClaimRepo()
	ledger := newInMemLedgerRepo()
	provider := &mockLLMProvider{id: "ai-verifier", name: "Verifier", content: "SUPPORTED"}
	pub := &mockPublisher{}

	svc := application.NewClaimVerificationService(claims, ledger, provider, pub, nil)

	claim, err := svc.VerifyClaim(
		context.Background(),
		"tenant-1",
		"c-101",
		"story-50",
		"AI Platform increases efficiency by 40%",
		[]string{"http://study.org/report"},
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if claim.Status != domain.ClaimStatusSupported {
		t.Fatalf("expected SUPPORTED, got %s", claim.Status)
	}
	if len(ledger.records) != 1 {
		t.Fatalf("expected 1 provenance ledger record created")
	}
}
