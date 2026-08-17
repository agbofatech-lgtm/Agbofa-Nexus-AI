package domain

import (
	"time"
)

type EnvironmentType string

const (
	EnvDevelopment    EnvironmentType = "DEVELOPMENT"
	EnvTestValidation EnvironmentType = "TEST_VALIDATION"
	EnvStaging        EnvironmentType = "STAGING"
	EnvProduction     EnvironmentType = "PRODUCTION"
)

type ReleaseGateName string

const (
	GateCodeQuality          ReleaseGateName = "CODE_QUALITY"
	GateTests                ReleaseGateName = "TESTS"
	GateBuild                ReleaseGateName = "BUILD"
	GateDependencyValidation ReleaseGateName = "DEPENDENCY_VALIDATION"
	GateSecurity             ReleaseGateName = "SECURITY"
	GateMigrations           ReleaseGateName = "MIGRATIONS"
	GatePerformance          ReleaseGateName = "PERFORMANCE"
	GateAccessibility        ReleaseGateName = "ACCESSIBILITY"
	GateGovernance           ReleaseGateName = "GOVERNANCE"
)

type GateStatus string

const (
	GateStatusPass    GateStatus = "PASS"
	GateStatusFail    GateStatus = "FAIL"
	GateStatusPending GateStatus = "PENDING"
)

type ReleaseGateEvaluation struct {
	GateName    ReleaseGateName
	Status      GateStatus
	EvidenceRef string
	EvaluatedAt time.Time
}

type ReleaseCandidateArtifact struct {
	CandidateID          string
	TenantID             string
	Version              string
	CommitSHA            string
	Environment          EnvironmentType
	GateEvaluations      []ReleaseGateEvaluation
	ApprovedForPromotion bool
	ProvenanceHash       string
	CreatedAt            time.Time
}

type DeploymentRecord struct {
	DeploymentID   string
	TenantID       string
	CandidateID    string
	Environment    EnvironmentType
	Version        string
	Status         string // DEPLOYED, ROLLED_BACK, FAILED
	ProvenanceHash string
	DeployedAt     time.Time
}

type RollbackRecord struct {
	RollbackID          string
	TenantID            string
	CurrentDeploymentID string
	TargetDeploymentID  string
	TargetVersion       string
	Reason              string
	Executed            bool
	ExecutedAt          time.Time
}

type DRBackupVerification struct {
	BackupID       string
	TenantID       string
	Environment    EnvironmentType
	Restorable     bool
	ProvenanceHash string
	VerifiedAt     time.Time
}

type OperationalAuditRecord struct {
	RecordID          string
	TenantID          string
	ResourceID        string
	Action            string
	Actor             string
	CryptographicHash string
	Timestamp         time.Time
}

type SystemStatusSnapshot struct {
	TenantID  string
	Status    string // HEALTHY, DEGRADED, DOWN
	CheckedAt time.Time
}

type WorkflowInstanceRef struct {
	InstanceID string
	TenantID   string
	WorkflowID string
	Status     string
	Parameters map[string]string
	StartedAt  time.Time
}
