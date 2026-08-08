package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/operations/internal/application"
	"github.com/agbofa/nexus/services/operations/internal/domain"
)

type inMemBackupRepo struct {
	backups map[string]domain.DRBackupVerification
}

func newInMemBackupRepo() *inMemBackupRepo {
	return &inMemBackupRepo{backups: make(map[string]domain.DRBackupVerification)}
}

func (r *inMemBackupRepo) SaveBackupVerification(b domain.DRBackupVerification) error {
	r.backups[b.TenantID+":"+b.BackupID] = b
	return nil
}

func (r *inMemBackupRepo) GetBackupVerification(tenantID, backupID string) (*domain.DRBackupVerification, error) {
	b, ok := r.backups[tenantID+":"+backupID]
	if !ok {
		return nil, domain.ErrBackupNotFound
	}
	return &b, nil
}

func TestOperationsHealthAndDRService_Flow(t *testing.T) {
	backups := newInMemBackupRepo()
	auditRepo := newInMemAuditRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewOperationsHealthAndDRService(backups, auditRepo, pub, audit)

	status, err := svc.CheckSystemStatus(context.Background(), "tenant-1")
	if err != nil || status.Status != "HEALTHY" {
		t.Fatalf("expected HEALTHY system status, got err=%v status=%v", err, status)
	}

	ver, err := svc.VerifyDisasterRecoveryBackup(context.Background(), "tenant-1", "backup-20260808")
	if err != nil || ver == nil {
		t.Fatalf("expected backup verification to succeed, got err=%v", err)
	}
	if !ver.Restorable {
		t.Fatalf("expected backup to be restorable")
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected operations.dr.backup_verified event emitted")
	}

	secOk, secChecks, _ := svc.RunSecurityCertificationAudit(context.Background(), "tenant-1", "rc-100")
	if !secOk || len(secChecks) < 4 {
		t.Fatalf("expected security audit checks to pass, got ok=%v checks=%d", secOk, len(secChecks))
	}

	perfOk, perfChecks, _ := svc.RunPerformanceReadinessAudit(context.Background(), "tenant-1", "rc-100")
	if !perfOk || len(perfChecks) < 3 {
		t.Fatalf("expected performance audit checks to pass, got ok=%v checks=%d", perfOk, len(perfChecks))
	}

	_, err = svc.CheckSystemStatus(context.Background(), "")
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant, got %v", err)
	}
}
