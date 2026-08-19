package repositories

import (
	"context"
	"encoding/json"

	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/services/foundation/internal/domain"
)

type PolicyRepository struct {
	db DB
}

func NewPolicyRepository(db DB) *PolicyRepository {
	return &PolicyRepository{db: db}
}

func (r *PolicyRepository) Create(ctx context.Context, policy domain.RolePolicy) (domain.RolePolicy, error) {
	if policy.ID == "" {
		id, err := newID()
		if err != nil {
			return domain.RolePolicy{}, err
		}
		policy.ID = id
	}
	raw, err := json.Marshal(policy.Permissions)
	if err != nil {
		return domain.RolePolicy{}, err
	}
	_, err = r.db.Exec(ctx, `
INSERT INTO role_policies (id, tenant_id, role, permissions)
VALUES ($1, $2, $3, $4::jsonb)`, policy.ID, policy.TenantID, policy.Role, raw)
	if err != nil {
		return domain.RolePolicy{}, mapDB(err)
	}
	return policy, nil
}

func (r *PolicyRepository) Get(ctx context.Context, id string) (domain.RolePolicy, error) {
	return scanPolicy(r.db.QueryRow(ctx, `
SELECT id, tenant_id, role, permissions FROM role_policies WHERE id = $1`, id))
}

func (r *PolicyRepository) Update(ctx context.Context, policy domain.RolePolicy) (domain.RolePolicy, error) {
	raw, err := json.Marshal(policy.Permissions)
	if err != nil {
		return domain.RolePolicy{}, err
	}
	tag, err := r.db.Exec(ctx, `
UPDATE role_policies SET role = $2, permissions = $3::jsonb WHERE id = $1`,
		policy.ID, policy.Role, raw)
	if err != nil {
		return domain.RolePolicy{}, mapDB(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.RolePolicy{}, database.ErrNotFound
	}
	return policy, nil
}

func (r *PolicyRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM role_policies WHERE id = $1`, id)
	if err != nil {
		return mapDB(err)
	}
	if tag.RowsAffected() == 0 {
		return database.ErrNotFound
	}
	return nil
}

func (r *PolicyRepository) FindPoliciesForRoles(ctx context.Context, tenantID string, roles []string) ([]domain.RolePolicy, error) {
	if len(roles) == 0 {
		return nil, nil
	}
	rows, err := r.db.Query(ctx, `
SELECT id, tenant_id, role, permissions
FROM role_policies
WHERE tenant_id = $1 AND role = ANY($2)
ORDER BY role`, tenantID, roles)
	if err != nil {
		return nil, mapDB(err)
	}
	defer rows.Close()
	var out []domain.RolePolicy
	for rows.Next() {
		policy, err := scanPolicy(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, policy)
	}
	return out, rows.Err()
}

func scanPolicy(row interface{ Scan(dest ...any) error }) (domain.RolePolicy, error) {
	var policy domain.RolePolicy
	var raw []byte
	if err := row.Scan(&policy.ID, &policy.TenantID, &policy.Role, &raw); err != nil {
		return domain.RolePolicy{}, mapDB(err)
	}
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &policy.Permissions); err != nil {
			return domain.RolePolicy{}, err
		}
	}
	return policy, nil
}
