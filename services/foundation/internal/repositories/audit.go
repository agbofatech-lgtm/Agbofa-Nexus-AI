package repositories

import (
	"context"
	"encoding/json"
	"time"

	"github.com/agbofa/nexus/services/foundation/internal/domain"
)

type AuthorizationAuditRepository struct {
	db DB
}

type AuthorizationAuditRecord struct {
	ID        string
	TenantID  string
	SubjectID string
	Roles     []string
	Resource  string
	Action    string
	Allowed   bool
	Reason    string
	PolicyID  string
	CreatedAt time.Time
}

func NewAuthorizationAuditRepository(db DB) *AuthorizationAuditRepository {
	return &AuthorizationAuditRepository{db: db}
}

func (r *AuthorizationAuditRepository) RecordDecision(ctx context.Context, request domain.AuthorizationRequest, decision domain.AuthorizationDecision) error {
	roles, err := json.Marshal(request.Roles)
	if err != nil {
		return err
	}
	id, err := newID()
	if err != nil {
		return err
	}
	var policyID any
	if decision.PolicyID != "" {
		policyID = decision.PolicyID
	}
	_, err = r.db.Exec(ctx, `
INSERT INTO authorization_audit_log (
    id, tenant_id, subject_id, roles, resource, action, allowed, reason, policy_id
) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)`,
		id, request.TenantID, request.SubjectID, roles, request.Resource, request.Action, decision.Allowed, decision.Reason, policyID)
	return mapDB(err)
}

func (r *AuthorizationAuditRepository) ListByTenant(ctx context.Context, tenantID string) ([]AuthorizationAuditRecord, error) {
	rows, err := r.db.Query(ctx, `
SELECT id, tenant_id, subject_id, roles, resource, action, allowed, reason, COALESCE(policy_id::text, ''), created_at
FROM authorization_audit_log
WHERE tenant_id = $1
ORDER BY created_at`, tenantID)
	if err != nil {
		return nil, mapDB(err)
	}
	defer rows.Close()
	var out []AuthorizationAuditRecord
	for rows.Next() {
		var rec AuthorizationAuditRecord
		var raw []byte
		if err := rows.Scan(&rec.ID, &rec.TenantID, &rec.SubjectID, &raw, &rec.Resource, &rec.Action, &rec.Allowed, &rec.Reason, &rec.PolicyID, &rec.CreatedAt); err != nil {
			return nil, mapDB(err)
		}
		if len(raw) > 0 {
			_ = json.Unmarshal(raw, &rec.Roles)
		}
		out = append(out, rec)
	}
	return out, rows.Err()
}
