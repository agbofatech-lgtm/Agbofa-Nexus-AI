package verification

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockContentVerifier struct {
	id         string
	name       string
	tenantID   string
	version    string
	initCalled bool
	shutCalled bool
	verifyRes  *domain.VerificationResult
	corrobRes  *domain.CorroborationResult
	assessRes  *domain.AssessmentResult
	err        error
}

func (m *mockContentVerifier) ID() string       { return m.id }
func (m *mockContentVerifier) Name() string     { return m.name }
func (m *mockContentVerifier) TenantID() string { return m.tenantID }
func (m *mockContentVerifier) Version() string  { return m.version }

func (m *mockContentVerifier) Initialize(ctx context.Context, tenantID string, config map[string]string) error {
	m.initCalled = true
	return m.err
}

func (m *mockContentVerifier) HealthCheck(ctx context.Context) (*domain.SourceHealth, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.SourceHealth{
		SourceID:    m.id,
		Status:      "HEALTHY",
		LastCheckAt: time.Now(),
	}, nil
}

func (m *mockContentVerifier) Shutdown(ctx context.Context) error {
	m.shutCalled = true
	return nil
}

func (m *mockContentVerifier) Verify(ctx context.Context, claim *domain.Claim) (*domain.VerificationResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.verifyRes, nil
}

func (m *mockContentVerifier) Corroborate(ctx context.Context, claim *domain.Claim, sources []domain.Source) (*domain.CorroborationResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.corrobRes, nil
}

func (m *mockContentVerifier) Assess(ctx context.Context, claim *domain.Claim) (*domain.AssessmentResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.assessRes, nil
}

func TestVerificationRegistryRegistrationAndLookup(t *testing.T) {
	reg := NewVerificationRegistry()

	if err := reg.RegisterVerifier(nil); err == nil {
		t.Fatalf("expected error registering nil verifier")
	}

	mock1 := &mockContentVerifier{id: "AGT-017", name: "Fact-Check Agent", tenantID: "tenant-1"}
	if err := reg.RegisterVerifier(mock1); err != nil {
		t.Fatalf("unexpected error registering verifier: %v", err)
	}

	got, err := reg.GetVerifier("AGT-017")
	if err != nil || got.ID() != "AGT-017" {
		t.Fatalf("failed to retrieve registered verifier AGT-017")
	}

	if _, err := reg.GetVerifier("AGT-UNKNOWN"); err == nil {
		t.Fatalf("expected error retrieving unknown verifier")
	}

	list := reg.ListVerifiers()
	if len(list) != 1 {
		t.Fatalf("expected 1 registered verifier, got %d", len(list))
	}
}

func TestVerificationRegistryLifecycleAndTenantIsolation(t *testing.T) {
	reg := NewVerificationRegistry()

	mock1 := &mockContentVerifier{id: "AGT-017", tenantID: "tenant-A"}
	mock2 := &mockContentVerifier{id: "AGT-018", tenantID: "tenant-B"}
	_ = reg.RegisterVerifier(mock1)
	_ = reg.RegisterVerifier(mock2)

	ctx := context.Background()

	// Should reject empty tenant ID
	if err := reg.InitializeAll(ctx, "", nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got: %v", err)
	}

	// Should only initialize mock1 for tenant-A
	if err := reg.InitializeAll(ctx, "tenant-A", nil); err != nil {
		t.Fatalf("unexpected error initializing tenant-A: %v", err)
	}
	if !mock1.initCalled || mock2.initCalled {
		t.Fatalf("expected only mock1 to be initialized for tenant-A")
	}

	// Health check all
	health, err := reg.HealthCheckAll(ctx)
	if err != nil || len(health) != 2 {
		t.Fatalf("expected health check results for 2 verifiers")
	}

	// Shutdown all
	_ = reg.ShutdownAll(ctx)
	if !mock1.shutCalled || !mock2.shutCalled {
		t.Fatalf("expected shutdown on all verifiers")
	}
}

func TestVerificationRegistryConcurrentOperations(t *testing.T) {
	reg := NewVerificationRegistry()

	mock1 := &mockContentVerifier{
		id:       "AGT-017",
		tenantID: "tenant-A",
		verifyRes: &domain.VerificationResult{
			VerificationID:  "ver-1",
			AgentID:         "AGT-017",
			Verdict:         "TRUE",
			ConfidenceScore: 0.95,
		},
		corrobRes: &domain.CorroborationResult{
			ResultID:     "cor-1",
			Corroborated: true,
		},
		assessRes: &domain.AssessmentResult{
			AssessmentID:   "ass-1",
			AssessmentType: "BIAS",
		},
	}

	mock2 := &mockContentVerifier{
		id:       "AGT-018",
		tenantID: "tenant-A",
		verifyRes: &domain.VerificationResult{
			VerificationID:  "ver-2",
			AgentID:         "AGT-018",
			Verdict:         "HALF_TRUE",
			ConfidenceScore: 0.80,
		},
		corrobRes: &domain.CorroborationResult{
			ResultID:     "cor-2",
			Corroborated: false,
		},
		assessRes: &domain.AssessmentResult{
			AssessmentID:   "ass-2",
			AssessmentType: "EVIDENCE",
		},
	}

	mockOtherTenant := &mockContentVerifier{
		id:       "AGT-019",
		tenantID: "tenant-B",
		verifyRes: &domain.VerificationResult{
			VerificationID: "ver-3",
			AgentID:        "AGT-019",
		},
	}

	_ = reg.RegisterVerifier(mock1)
	_ = reg.RegisterVerifier(mock2)
	_ = reg.RegisterVerifier(mockOtherTenant)

	ctx := context.Background()

	// Verify nil claim returns ErrCrossTenantViolation
	if _, err := reg.VerifyAll(ctx, nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for nil claim in VerifyAll")
	}
	if _, err := reg.CorroborateAll(ctx, nil, nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for nil claim in CorroborateAll")
	}
	if _, err := reg.AssessAll(ctx, nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for nil claim in AssessAll")
	}

	claim := &domain.Claim{
		ClaimID:      "clm-001",
		TenantID:     "tenant-A",
		ClaimText:    "Inflation is at 3%",
		ClaimType:    "STATEMENT_OF_FACT",
		IsVerifiable: true,
	}

	verifyResults, err := reg.VerifyAll(ctx, claim)
	if err != nil || len(verifyResults) != 2 {
		t.Fatalf("expected 2 verification results for tenant-A, got %d (err: %v)", len(verifyResults), err)
	}

	corrobResults, err := reg.CorroborateAll(ctx, claim, nil)
	if err != nil || len(corrobResults) != 2 {
		t.Fatalf("expected 2 corroboration results for tenant-A, got %d (err: %v)", len(corrobResults), err)
	}

	assessResults, err := reg.AssessAll(ctx, claim)
	if err != nil || len(assessResults) != 2 {
		t.Fatalf("expected 2 assessment results for tenant-A, got %d (err: %v)", len(assessResults), err)
	}
}
