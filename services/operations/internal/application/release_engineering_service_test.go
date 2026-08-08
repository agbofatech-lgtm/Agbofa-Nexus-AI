package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/operations/internal/application"
	"github.com/agbofa/nexus/services/operations/internal/domain"
)

type inMemCandidateRepo struct {
	candidates map[string]domain.ReleaseCandidateArtifact
}

func newInMemCandidateRepo() *inMemCandidateRepo {
	return &inMemCandidateRepo{candidates: make(map[string]domain.ReleaseCandidateArtifact)}
}

func (r *inMemCandidateRepo) SaveCandidate(c domain.ReleaseCandidateArtifact) error {
	r.candidates[c.TenantID+":"+c.CandidateID] = c
	return nil
}

func (r *inMemCandidateRepo) GetCandidate(tenantID, candidateID string) (*domain.ReleaseCandidateArtifact, error) {
	c, ok := r.candidates[tenantID+":"+candidateID]
	if !ok {
		return nil, domain.ErrCandidateNotFound
	}
	return &c, nil
}

type inMemDeploymentRepo struct {
	deployments map[string]domain.DeploymentRecord
}

func newInMemDeploymentRepo() *inMemDeploymentRepo {
	return &inMemDeploymentRepo{deployments: make(map[string]domain.DeploymentRecord)}
}

func (r *inMemDeploymentRepo) SaveDeployment(d domain.DeploymentRecord) error {
	r.deployments[d.TenantID+":"+d.DeploymentID] = d
	return nil
}

func (r *inMemDeploymentRepo) GetDeployment(tenantID, deploymentID string) (*domain.DeploymentRecord, error) {
	d, ok := r.deployments[tenantID+":"+deploymentID]
	if !ok {
		return nil, domain.ErrDeploymentNotFound
	}
	return &d, nil
}

type inMemAuditRepo struct {
	records []domain.OperationalAuditRecord
}

func newInMemAuditRepo() *inMemAuditRepo {
	return &inMemAuditRepo{}
}

func (r *inMemAuditRepo) AppendRecord(rec domain.OperationalAuditRecord) error {
	r.records = append(r.records, rec)
	return nil
}

func (r *inMemAuditRepo) GetAuditTrail(tenantID, resourceID string) ([]domain.OperationalAuditRecord, error) {
	var out []domain.OperationalAuditRecord
	for _, rec := range r.records {
		if rec.TenantID == tenantID && rec.ResourceID == resourceID {
			out = append(out, rec)
		}
	}
	return out, nil
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

func TestReleaseEngineeringService_FlowAndProtection(t *testing.T) {
	candidates := newInMemCandidateRepo()
	deployments := newInMemDeploymentRepo()
	auditRepo := newInMemAuditRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewReleaseEngineeringService(candidates, deployments, auditRepo, pub, audit)

	cand, err := svc.CreateReleaseCandidate(
		context.Background(),
		"tenant-1",
		"v1.0.0-rc1",
		"sha-abc1234",
		domain.EnvStaging,
	)
	if err != nil || cand == nil {
		t.Fatalf("expected candidate created, got err=%v", err)
	}

	_, err = svc.RecordDeployment(context.Background(), "tenant-1", cand.CandidateID, "v1.0.0-rc1", "sha-abc1234", domain.EnvStaging)
	if !errors.Is(err, domain.ErrGateVerificationFailed) {
		t.Fatalf("expected ErrGateVerificationFailed for unapproved candidate, got %v", err)
	}

	allPass := []domain.ReleaseGateEvaluation{
		{GateName: domain.GateCodeQuality, Status: domain.GateStatusPass, EvidenceRef: "ev-1"},
		{GateName: domain.GateTests, Status: domain.GateStatusPass, EvidenceRef: "ev-2"},
		{GateName: domain.GateBuild, Status: domain.GateStatusPass, EvidenceRef: "ev-3"},
		{GateName: domain.GateDependencyValidation, Status: domain.GateStatusPass, EvidenceRef: "ev-4"},
		{GateName: domain.GateSecurity, Status: domain.GateStatusPass, EvidenceRef: "ev-5"},
		{GateName: domain.GateMigrations, Status: domain.GateStatusPass, EvidenceRef: "ev-6"},
		{GateName: domain.GateGovernance, Status: domain.GateStatusPass, EvidenceRef: "ev-7"},
	}

	ok, failures, err := svc.EvaluateReleaseGates(context.Background(), "tenant-1", cand.CandidateID, allPass)
	if err != nil || !ok || len(failures) > 0 {
		t.Fatalf("expected release gate evaluation to pass, got ok=%v failures=%v err=%v", ok, failures, err)
	}

	dep, err := svc.RecordDeployment(context.Background(), "tenant-1", cand.CandidateID, "v1.0.0-rc1", "sha-abc1234", domain.EnvStaging)
	if err != nil || dep == nil {
		t.Fatalf("expected deployment recorded after gate approval, got err=%v", err)
	}
	if len(pub.events) < 3 {
		t.Fatalf("expected 3 events emitted, got %d", len(pub.events))
	}
}
