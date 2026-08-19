package repositories

import (
	"context"
	"encoding/json"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/services/foundation/internal/domain"
)

type TenantRepository struct {
	db DB
}

func NewTenantRepository(db DB) *TenantRepository {
	return &TenantRepository{db: db}
}

func (r *TenantRepository) CreateTenant(ctx context.Context, tenant domain.Tenant) (domain.Tenant, error) {
	if tenant.ID == "" {
		id, err := newID()
		if err != nil {
			return domain.Tenant{}, err
		}
		tenant.ID = id
	}
	cfg, err := json.Marshal(tenant.Config)
	if err != nil {
		return domain.Tenant{}, err
	}
	if tenant.Status == "" {
		tenant.Status = domain.TenantStatusActive
	}
	row := r.db.QueryRow(ctx, `
INSERT INTO tenants (id, name, status, config)
VALUES ($1, $2, $3, $4::jsonb)
RETURNING created_at, updated_at`, tenant.ID, tenant.Name, string(tenant.Status), cfg)
	if err := row.Scan(&tenant.CreatedAt, &tenant.UpdatedAt); err != nil {
		return domain.Tenant{}, mapDB(err)
	}
	return tenant, nil
}

func (r *TenantRepository) FindTenantByName(ctx context.Context, name string) (*domain.Tenant, error) {
	tenant, err := scanTenant(r.db.QueryRow(ctx, `
SELECT id, name, status, config, created_at, updated_at
FROM tenants WHERE name = $1`, name))
	if err != nil {
		if err == database.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &tenant, nil
}

func (r *TenantRepository) GetTenant(ctx context.Context, id string) (domain.Tenant, error) {
	return scanTenant(r.db.QueryRow(ctx, `
SELECT id, name, status, config, created_at, updated_at
FROM tenants WHERE id = $1`, id))
}

func (r *TenantRepository) UpdateTenant(ctx context.Context, tenant domain.Tenant) (domain.Tenant, error) {
	cfg, err := json.Marshal(tenant.Config)
	if err != nil {
		return domain.Tenant{}, err
	}
	row := r.db.QueryRow(ctx, `
UPDATE tenants SET name = $2, status = $3, config = $4::jsonb
WHERE id = $1
RETURNING created_at, updated_at`, tenant.ID, tenant.Name, string(tenant.Status), cfg)
	if err := row.Scan(&tenant.CreatedAt, &tenant.UpdatedAt); err != nil {
		return domain.Tenant{}, mapDB(err)
	}
	return tenant, nil
}

func (r *TenantRepository) DeleteTenant(ctx context.Context, id string) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM tenants WHERE id = $1`, id)
	if err != nil {
		return mapDB(err)
	}
	if tag.RowsAffected() == 0 {
		return database.ErrNotFound
	}
	return nil
}

func (r *TenantRepository) CreateUser(ctx context.Context, user domain.User) (domain.User, error) {
	return NewUserRepository(r.db).CreateUser(ctx, user)
}

func (r *TenantRepository) FindUserByPrincipal(ctx context.Context, tenantID string, principalName string) (*domain.User, error) {
	return NewUserRepository(r.db).FindUserByPrincipal(ctx, tenantID, principalName)
}

func (r *TenantRepository) RecordLogin(ctx context.Context, userID string, occurredAt time.Time) error {
	return NewUserRepository(r.db).RecordLogin(ctx, userID, occurredAt)
}

func scanTenant(row interface{ Scan(dest ...any) error }) (domain.Tenant, error) {
	var tenant domain.Tenant
	var status string
	var raw []byte
	if err := row.Scan(&tenant.ID, &tenant.Name, &status, &raw, &tenant.CreatedAt, &tenant.UpdatedAt); err != nil {
		return domain.Tenant{}, mapDB(err)
	}
	tenant.Status = domain.TenantStatus(status)
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &tenant.Config); err != nil {
			return domain.Tenant{}, err
		}
	}
	return tenant, nil
}
